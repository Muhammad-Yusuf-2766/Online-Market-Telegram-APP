import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Order, OrderItem, OrderStatus, Prisma, Product } from "@prisma/client";
import type { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { paginationParams, toPaginatedResult, type PaginatedResult } from "../common/pagination";
import {
  orderItemTitleSnapshot,
  resolveProductUnitPrice,
} from "../products/product-sizes.util";
import { CoinsService } from "../coins/coins.service";
import { PrismaService } from "../prisma/prisma.service";
import { OrderEventsService } from "../realtime/order-events.service";
import { TelegramNotifyService } from "../telegram/telegram-notify.service";
import { PromotionsService } from "../promotions/promotions.service";
import { UserNotificationsService } from "../notifications/user-notifications.service";
import { AdminOrdersQueryDto } from "./dto/admin-orders-query.dto";
import { CreateOrderDto } from "./dto/create-order.dto";

export type AdminOrderRow = Order & {
  items: OrderItem[];
  user: {
    id: string;
    telegramId: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    birthDate: Date | null;
  };
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderEvents: OrderEventsService,
    private readonly telegramNotify: TelegramNotifyService,
    private readonly coinsService: CoinsService,
    private readonly promotions: PromotionsService,
    private readonly userNotifications: UserNotificationsService,
  ) {}

  async createForUser(userId: string, dto: CreateOrderDto): Promise<Order & { items: OrderItem[] }> {
    const hasLat = dto.deliveryLatitude != null;
    const hasLng = dto.deliveryLongitude != null;
    if (hasLat !== hasLng) {
      throw new BadRequestException("deliveryLatitude and deliveryLongitude must be provided together");
    }

    const merged = new Map<string, { productId: string; sizeId: string | undefined; quantity: number }>();
    for (const line of dto.items) {
      const sizeKey = line.sizeId ?? "default";
      const key = `${line.productId}::${sizeKey}`;
      const prev = merged.get(key);
      merged.set(key, {
        productId: line.productId,
        sizeId: line.sizeId,
        quantity: (prev?.quantity ?? 0) + line.quantity,
      });
    }
    const lines = [...merged.values()];
    const productIds = [...new Set(lines.map((l) => l.productId))];

    const created = await this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });
      if (products.length !== productIds.length) {
        throw new NotFoundException("One or more products were not found");
      }

      const presets = await tx.productSizePreset.findMany();
      const presetById = new Map(presets.map((p) => [p.id, p]));

      const byId = new Map(products.map((p) => [p.id, p]));

      let subtotalUzs = 0;
      for (const line of lines) {
        const p = byId.get(line.productId)!;
        const resolved = resolveProductUnitPrice(p.priceUzs, p.sizes, presetById, line.sizeId);
        subtotalUzs += resolved.unitPriceUzs * line.quantity;
      }

      const payer = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { coinBalance: true },
      });
      const requestedCoins = Math.max(0, Math.floor(dto.coinsToSpendUzs ?? 0));
      const coinsAppliedUzs = Math.min(requestedCoins, subtotalUzs, payer.coinBalance);
      let discountUzs = 0;
      let promoCodeId: string | null = null;
      if (dto.promoCode?.trim()) {
        const promo = await this.promotions.validate(dto.promoCode, subtotalUzs, userId);
        discountUzs = promo.discountUzs;
        promoCodeId = promo.promoCodeId;
      }
      const cashPaidUzs = Math.max(0, subtotalUzs - coinsAppliedUzs - discountUzs);

      const birthDate =
        dto.birthDate !== undefined ? new Date(`${dto.birthDate}T00:00:00.000Z`) : undefined;

      await tx.user.update({
        where: { id: userId },
        data: {
          phone: dto.deliveryPhone ?? undefined,
          firstName: dto.deliveryFirstName ?? undefined,
          lastName: dto.deliveryLastName ?? undefined,
          ...(birthDate !== undefined ? { birthDate } : {}),
        },
      });

      const order = await tx.order.create({
        data: {
          userId,
          subtotalUzs,
          totalUzs: subtotalUzs,
          coinsAppliedUzs,
          cashPaidUzs,
          discountUzs,
          promoCodeId,
          deliveryPhone: dto.deliveryPhone ?? null,
          deliveryFirstName: dto.deliveryFirstName ?? null,
          deliveryLastName: dto.deliveryLastName ?? null,
          deliveryLatitude: dto.deliveryLatitude ?? null,
          deliveryLongitude: dto.deliveryLongitude ?? null,
        },
      });

      await this.coinsService.debitCheckoutSpend(tx, userId, order.id, coinsAppliedUzs);
      const userCart = await tx.cart.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }

      /** Gram-tracked inventory: aggregate demand per product (multiple lines can reference same SKU). */
      const gramsNeededByProduct = new Map<string, number>();
      for (const line of lines) {
        const p = byId.get(line.productId)!;
        const resolved = resolveProductUnitPrice(p.priceUzs, p.sizes, presetById, line.sizeId);
        const g = (resolved.gramsSnapshot ?? 0) * line.quantity;
        if (p.stockGrams !== null && p.stockGrams !== undefined) {
          if (g <= 0) {
            throw new BadRequestException(
              `Product "${p.title}" tracks inventory by volume; choose a valid size`,
            );
          }
          gramsNeededByProduct.set(
            line.productId,
            (gramsNeededByProduct.get(line.productId) ?? 0) + g,
          );
        }
      }

      for (const [pid, need] of gramsNeededByProduct) {
        const p = byId.get(pid)!;
        if (p.stockGrams! < need) {
          throw new BadRequestException(`Insufficient volume for ${p.title}`);
        }
        const updated = await tx.product.updateMany({
          where: { id: pid, stockGrams: { gte: need } },
          data: { stockGrams: { decrement: need } },
        });
        if (updated.count !== 1) {
          throw new BadRequestException(`Insufficient volume for ${p.title}`);
        }
      }

      const items: OrderItem[] = [];
      for (const line of lines) {
        const product: Product = byId.get(line.productId)!;
        const resolved = resolveProductUnitPrice(product.priceUzs, product.sizes, presetById, line.sizeId);
        const gramsForLine = (resolved.gramsSnapshot ?? 0) * line.quantity;

        const item = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            quantity: line.quantity,
            unitPriceUzs: resolved.unitPriceUzs,
            titleSnapshot: orderItemTitleSnapshot(product.title, resolved.sizeLabelSnapshot),
            sizeId: resolved.sizeIdForDb,
            sizeLabelSnapshot: resolved.sizeLabelSnapshot,
            gramsSnapshot: resolved.gramsSnapshot,
          },
        });
        await tx.stockMovement.create({
          data: {
            orderId: order.id,
            productId: product.id,
            delta: -line.quantity,
            deltaGrams: gramsForLine > 0 ? -gramsForLine : 0,
            reason: "ORDER_CREATE",
          },
        });
        items.push(item);
      }

      return { ...order, items };
    });
    await this.prisma.analyticsEvent.create({
      data: {
        eventType: "ORDER_CREATED",
        userId,
        sessionId: `user:${userId}`,
        orderId: created.id,
        properties: { subtotalUzs: created.subtotalUzs, coinsAppliedUzs: created.coinsAppliedUzs },
      },
    });
    if (dto.promoCode?.trim()) {
      const promo = await this.prisma.promoCode.findUnique({
        where: { code: dto.promoCode.trim().toUpperCase() },
        select: { id: true },
      });
      if (promo && created.discountUzs > 0) {
        await this.prisma.promoRedemption.create({
          data: {
            promoCodeId: promo.id,
            userId,
            orderId: created.id,
            discountUzs: created.discountUzs,
          },
        });
      }
    }
    await this.orderEvents.notifyOrdersChanged({
      reason: "created",
      orderId: created.id,
      userId,
      status: created.status,
      updatedAt: created.updatedAt.toISOString(),
    });

    const touchedProductIds = [
      ...new Set(created.items.map((i) => i.productId).filter((x): x is string => Boolean(x))),
    ];
    if (touchedProductIds.length > 0) {
      const stockRows = await this.prisma.product.findMany({
        where: { id: { in: touchedProductIds } },
        select: { id: true, stock: true, stockGrams: true },
      });
      for (const row of stockRows) {
        await this.orderEvents.notifyProductStockChanged(row.id, {
          stock: row.stock,
          stockGrams: row.stockGrams,
        });
      }
    }

    return created;
  }

  async listForUser(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<Order & { items: OrderItem[] }>> {
    const { page, pageSize, skip } = paginationParams(query);
    const where: Prisma.OrderWhereInput = { userId };
    const [total, rows] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: { items: true },
      }),
    ]);
    return toPaginatedResult(rows, total, page, pageSize);
  }

  async cancelForUser(userId: string, orderId: string): Promise<Order & { items: OrderItem[] }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    if (order.userId !== userId) {
      throw new ForbiddenException();
    }
    if (order.status !== "PENDING") {
      throw new BadRequestException("Only pending orders can be cancelled");
    }
    await this.updateStatus(orderId, "CANCELLED");
    return this.getForUser(userId, orderId);
  }

  async getForUser(userId: string, orderId: string): Promise<Order & { items: OrderItem[] }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    if (order.userId !== userId) {
      throw new ForbiddenException();
    }
    return order;
  }

  async listAllPaginated(query: AdminOrdersQueryDto): Promise<PaginatedResult<AdminOrderRow>> {
    const { page, pageSize, skip } = paginationParams(query);
    const where: Prisma.OrderWhereInput = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.createdFrom || query.createdTo) {
      where.createdAt = {};
      if (query.createdFrom) {
        where.createdAt.gte = new Date(`${query.createdFrom}T00:00:00.000Z`);
      }
      if (query.createdTo) {
        where.createdAt.lte = new Date(`${query.createdTo}T23:59:59.999Z`);
      }
    }

    const include = {
      items: true,
      user: {
        select: {
          id: true,
          telegramId: true,
          firstName: true,
          lastName: true,
          phone: true,
          birthDate: true,
        },
      },
    } as const;

    const [total, rows] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include,
      }),
    ]);
    return toPaginatedResult(rows as AdminOrderRow[], total, page, pageSize);
  }

  async getByIdForAdmin(orderId: string): Promise<AdminOrderRow | null> {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            telegramId: true,
            firstName: true,
            lastName: true,
            phone: true,
            birthDate: true,
          },
        },
      },
    });
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const prev = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { telegramId: true, locale: true } },
        items: {
          orderBy: { id: "asc" },
          include: { product: { select: { images: true } } },
        },
      },
    });
    if (!prev) {
      throw new NotFoundException("Order not found");
    }
    if (prev.status === status) {
      const { user: _u, items: _items, ...order } = prev;
      return order as Order;
    }

    const { order: updated, referralPayout } = await this.prisma.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id: orderId },
        data: { status },
      });
      if (status === "CANCELLED" && prev.status !== "CANCELLED") {
        await this.coinsService.refundOrderCoinsIfNeeded(tx, orderId);
        const movements = await tx.stockMovement.findMany({
          where: { orderId, reason: "ORDER_CREATE" },
        });
        for (const m of movements) {
          const data: Prisma.ProductUpdateInput = {};
          if (m.delta !== 0) {
            data.stock = { increment: -m.delta };
          }
          if (m.deltaGrams !== 0) {
            data.stockGrams = { increment: -m.deltaGrams };
          }
          if (Object.keys(data).length > 0) {
            await tx.product.update({ where: { id: m.productId }, data });
          }
          await tx.stockMovement.create({
            data: {
              orderId,
              productId: m.productId,
              delta: -m.delta,
              deltaGrams: -m.deltaGrams,
              reason: "ORDER_CANCEL",
            },
          });
        }
        await tx.promoRedemption.deleteMany({ where: { orderId } });
      }
      const payout = await this.coinsService.tryReferralPayoutOnOrderQualifying(tx, next, prev.status);
      return { order: next, referralPayout: payout };
    });

    if (referralPayout) {
      void this.telegramNotify.notifyCoinsCredit(
        referralPayout.telegramId,
        referralPayout.coins,
        referralPayout.locale,
        "referral",
      );
    }

    await this.orderEvents.notifyOrdersChanged({
      reason: "updated",
      orderId: updated.id,
      userId: updated.userId,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    });

    const productImageRaw = firstOrderLineProductImage(prev.items);

    await this.telegramNotify.notifyOrderStatusChanged(
      prev.user.telegramId,
      updated.id,
      updated.status,
      prev.user.locale,
      productImageRaw,
    );

    void this.userNotifications
      .create({
        userId: updated.userId,
        kind: "ORDER_STATUS",
        title:
          prev.user.locale === "ru"
            ? `Заказ #${updated.id.slice(-6)}`
            : `Buyurtma #${updated.id.slice(-6)}`,
        body:
          prev.user.locale === "ru"
            ? `Статус: ${updated.status}`
            : `Holat: ${updated.status}`,
        targetUrl: `/orders/${updated.id}`,
        metadata: { orderId: updated.id, status: updated.status },
      })
      .catch(() => undefined);

    return updated;
  }

  private async getById(orderId: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return order;
  }
}

function firstOrderLineProductImage(
  items: Array<{ product: { images: string[] } | null }>,
): string | undefined {
  for (const item of items) {
    const raw = item.product?.images?.[0];
    if (raw) {
      return raw;
    }
  }
  return undefined;
}

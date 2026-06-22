import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Order, OrderItem, OrderStatus, Prisma } from "@prisma/client";
import type { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { paginationParams, toPaginatedResult, type PaginatedResult } from "../common/pagination";
import { PrismaService } from "../prisma/prisma.service";
import { OrderEventsService } from "../realtime/order-events.service";
import { TelegramNotifyService } from "../telegram/telegram-notify.service";
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

type OrderLineInput = {
  productId: string;
  quantity: number;
};

type AddressSnapshot = {
  addressId: string | null;
  addressNameSnapshot: string;
  roadAddressSnapshot: string | null;
  jibunAddressSnapshot: string | null;
  buildingNameSnapshot: string | null;
  zoneNoSnapshot: string | null;
  detailAddressSnapshot: string;
  latitudeSnapshot: number | null;
  longitudeSnapshot: number | null;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderEvents: OrderEventsService,
    private readonly telegramNotify: TelegramNotifyService,
    private readonly userNotifications: UserNotificationsService,
  ) {}

  async createForUser(userId: string, dto: CreateOrderDto): Promise<Order & { items: OrderItem[] }> {
    const created = await this.prisma.$transaction(async (tx) => {
      const lines = await this.resolveOrderLines(tx, userId, dto.items ?? []);
      if (lines.length === 0) {
        throw new BadRequestException("Cart is empty");
      }
      const productIds = [...new Set(lines.map((line) => line.productId))];
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        include: { measurementUnit: true },
      });
      if (products.length !== productIds.length) {
        throw new NotFoundException("One or more products were not found");
      }
      const byId = new Map(products.map((p) => [p.id, p]));

      let subtotalKrw = 0;
      for (const line of lines) {
        const product = byId.get(line.productId)!;
        subtotalKrw += product.priceKrw * line.quantity;
      }

      const address = await this.resolveAddressSnapshot(tx, userId, dto);

      if (dto.deliveryPhone || dto.deliveryFirstName || dto.deliveryLastName) {
        await tx.user.update({
          where: { id: userId },
          data: {
            phone: dto.deliveryPhone ?? undefined,
            firstName: dto.deliveryFirstName ?? undefined,
            lastName: dto.deliveryLastName ?? undefined,
          },
        });
      }

      for (const line of lines) {
        const product = byId.get(line.productId)!;
        if (line.quantity > product.stockQuantity) {
          throw new BadRequestException(`Insufficient stock for ${product.title}`);
        }
        const updated = await tx.product.updateMany({
          where: { id: product.id, stockQuantity: { gte: line.quantity } },
          data: { stockQuantity: { decrement: line.quantity } },
        });
        if (updated.count !== 1) {
          throw new BadRequestException(`Insufficient stock for ${product.title}`);
        }
      }

      const order = await tx.order.create({
        data: {
          userId,
          subtotalKrw,
          totalKrw: subtotalKrw,
          discountKrw: 0,
          deliveryPhone: dto.deliveryPhone ?? null,
          deliveryFirstName: dto.deliveryFirstName ?? null,
          deliveryLastName: dto.deliveryLastName ?? null,
          ...address,
        },
      });

      const items: OrderItem[] = [];
      for (const line of lines) {
        const product = byId.get(line.productId)!;
        const item = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            quantity: line.quantity,
            unitPriceKrw: product.priceKrw,
            titleSnapshot: product.title,
            imageSnapshot: product.images[0] ?? null,
            unitNameSnapshot: product.measurementUnit.name,
            unitSymbolSnapshot: product.measurementUnit.symbol,
          },
        });
        await tx.inventoryMovement.create({
          data: {
            orderId: order.id,
            productId: product.id,
            delta: -line.quantity,
            reason: "ORDER_CREATE",
          },
        });
        items.push(item);
      }

      const cart = await tx.cart.findUnique({ where: { userId }, select: { id: true } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return { ...order, items };
    });

    await this.orderEvents.notifyOrdersChanged({
      reason: "created",
      orderId: created.id,
      userId,
      status: created.status,
      updatedAt: created.updatedAt.toISOString(),
    });

    await this.emitStockChanges(created.items);
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
        items: true,
      },
    });
    if (!prev) {
      throw new NotFoundException("Order not found");
    }
    if (prev.status === status) {
      const { user: _user, items: _items, ...order } = prev;
      return order as Order;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id: orderId },
        data: { status },
      });
      if (status === "CANCELLED" && prev.status !== "CANCELLED") {
        const movements = await tx.inventoryMovement.findMany({
          where: { orderId, reason: "ORDER_CREATE" },
        });
        for (const movement of movements) {
          await tx.product.update({
            where: { id: movement.productId },
            data: { stockQuantity: { increment: -movement.delta } },
          });
          await tx.inventoryMovement.create({
            data: {
              orderId,
              productId: movement.productId,
              delta: -movement.delta,
              reason: "ORDER_CANCEL",
            },
          });
        }
      }
      return next;
    });

    await this.orderEvents.notifyOrdersChanged({
      reason: "updated",
      orderId: updated.id,
      userId: updated.userId,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    });

    await this.telegramNotify.notifyOrderStatusChanged(
      prev.user.telegramId,
      updated.id,
      updated.status,
      prev.user.locale,
      prev.items[0]?.imageSnapshot,
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

    await this.emitStockChanges(prev.items);
    return updated;
  }

  private async resolveOrderLines(
    tx: Prisma.TransactionClient,
    userId: string,
    fallbackItems: OrderLineInput[],
  ): Promise<OrderLineInput[]> {
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    const source = cart?.items.length
      ? cart.items.map((item) => ({ productId: item.productId, quantity: item.qty }))
      : fallbackItems;
    const merged = new Map<string, OrderLineInput>();
    for (const line of source) {
      const prev = merged.get(line.productId);
      merged.set(line.productId, {
        productId: line.productId,
        quantity: (prev?.quantity ?? 0) + line.quantity,
      });
    }
    return [...merged.values()];
  }

  private async resolveAddressSnapshot(
    tx: Prisma.TransactionClient,
    userId: string,
    dto: CreateOrderDto,
  ): Promise<AddressSnapshot> {
    if (dto.addressId) {
      const address = await tx.userAddress.findUnique({ where: { id: dto.addressId } });
      if (!address || address.userId !== userId) {
        throw new BadRequestException("Selected address is invalid");
      }
      return {
        addressId: address.id,
        addressNameSnapshot: address.addressName,
        roadAddressSnapshot: address.roadAddressName,
        jibunAddressSnapshot: address.jibunAddressName,
        buildingNameSnapshot: address.buildingName,
        zoneNoSnapshot: address.zoneNo,
        detailAddressSnapshot: address.detailAddress,
        latitudeSnapshot: address.latitude,
        longitudeSnapshot: address.longitude,
      };
    }

    if (!dto.addressName?.trim() || !dto.detailAddress?.trim()) {
      throw new BadRequestException("A valid selected address and detail address are required");
    }
    return {
      addressId: null,
      addressNameSnapshot: dto.addressName.trim(),
      roadAddressSnapshot: dto.roadAddressName?.trim() || null,
      jibunAddressSnapshot: dto.jibunAddressName?.trim() || null,
      buildingNameSnapshot: dto.buildingName?.trim() || null,
      zoneNoSnapshot: dto.zoneNo?.trim() || null,
      detailAddressSnapshot: dto.detailAddress.trim(),
      latitudeSnapshot: dto.latitude ?? null,
      longitudeSnapshot: dto.longitude ?? null,
    };
  }

  private async emitStockChanges(items: OrderItem[]) {
    const productIds = [...new Set(items.map((item) => item.productId).filter((id): id is string => Boolean(id)))];
    if (productIds.length === 0) return;
    const rows = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, stockQuantity: true },
    });
    for (const row of rows) {
      await this.orderEvents.notifyProductStockChanged(row.id, {
        stockQuantity: row.stockQuantity,
      });
    }
  }
}

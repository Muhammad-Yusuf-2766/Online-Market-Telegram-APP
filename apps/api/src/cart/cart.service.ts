import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpsertCartItemDto } from "./dto/upsert-cart-item.dto";

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async getForUser(userId: string) {
    const cart = await this.ensureCart(userId);
    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      orderBy: { updatedAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            priceUzs: true,
            stock: true,
            images: true,
          },
        },
      },
    });
    return {
      id: cart.id,
      userId: cart.userId,
      updatedAt: cart.updatedAt,
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        sizeSlug: item.sizeSlug || null,
        qty: item.qty,
        updatedAt: item.updatedAt,
        product: item.product,
      })),
    };
  }

  async upsertItem(userId: string, dto: UpsertCartItemDto) {
    const cart = await this.ensureCart(userId);
    await this.prisma.cartItem.upsert({
      where: {
        cartId_productId_sizeSlug: {
          cartId: cart.id,
          productId: dto.productId,
          sizeSlug: dto.sizeSlug ?? "",
        },
      },
      create: {
        cartId: cart.id,
        productId: dto.productId,
        sizeSlug: dto.sizeSlug ?? "",
        qty: dto.qty,
      },
      update: {
        qty: dto.qty,
      },
    });
    return this.getForUser(userId);
  }

  async updateItemQty(userId: string, itemId: string, qty: number) {
    const cart = await this.ensureCart(userId);
    if (qty <= 0) {
      await this.prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
      return this.getForUser(userId);
    }
    await this.prisma.cartItem.updateMany({
      where: { id: itemId, cartId: cart.id },
      data: { qty },
    });
    return this.getForUser(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.ensureCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    return this.getForUser(userId);
  }

  async clear(userId: string) {
    const cart = await this.ensureCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { ok: true };
  }
}


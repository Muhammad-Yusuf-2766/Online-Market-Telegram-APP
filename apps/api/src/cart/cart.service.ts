import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
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
            priceKrw: true,
            stockQuantity: true,
            images: true,
            measurementUnit: { select: { id: true, name: true, symbol: true } },
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
        qty: item.qty,
        updatedAt: item.updatedAt,
        product: item.product,
      })),
    };
  }

  async upsertItem(userId: string, dto: UpsertCartItemDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, isActive: true },
      select: { id: true, stockQuantity: true },
    });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    if (dto.qty > product.stockQuantity) {
      throw new BadRequestException("Requested quantity exceeds available stock");
    }
    const cart = await this.ensureCart(userId);
    await this.prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: dto.productId,
        },
      },
      create: {
        cartId: cart.id,
        productId: dto.productId,
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
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: { select: { stockQuantity: true } } },
    });
    if (!item) {
      throw new NotFoundException("Cart item not found");
    }
    if (qty > item.product.stockQuantity) {
      throw new BadRequestException("Requested quantity exceeds available stock");
    }
    await this.prisma.cartItem.update({
      where: { id: itemId },
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

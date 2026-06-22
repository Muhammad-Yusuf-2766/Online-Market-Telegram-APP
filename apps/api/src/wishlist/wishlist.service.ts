import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  async toggle(userId: string, productId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) {
      await this.prisma.wishlist.delete({ where: { id: existing.id } });
      return { added: false };
    }
    await this.prisma.wishlist.create({ data: { userId, productId } });
    return { added: true };
  }

  async updatePrefs(
    userId: string,
    productId: string,
    body: { notifyBackInStock?: boolean; notifyPriceDrop?: boolean },
  ) {
    return this.prisma.wishlist.update({
      where: { userId_productId: { userId, productId } },
      data: {
        ...(body.notifyBackInStock !== undefined ? { notifyBackInStock: body.notifyBackInStock } : {}),
        ...(body.notifyPriceDrop !== undefined ? { notifyPriceDrop: body.notifyPriceDrop } : {}),
      },
    });
  }
}


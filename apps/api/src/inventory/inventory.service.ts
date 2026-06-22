import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async lowStock() {
    const candidates = await this.prisma.product.findMany({
      orderBy: [{ stockQuantity: "asc" }],
      take: 500,
      include: { category: true, measurementUnit: true },
    });
    return candidates
      .filter((p) => p.stockQuantity <= (p.lowStockThreshold ?? 0))
      .slice(0, 100);
  }

  async summary() {
    const [productCount, stockAgg, lowStockProducts] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.aggregate({ _sum: { stockQuantity: true } }),
      this.prisma.product.findMany({
        select: { stockQuantity: true, lowStockThreshold: true },
        take: 5000,
      }),
    ]);
    return {
      productCount,
      totalStockQuantity: stockAgg._sum.stockQuantity ?? 0,
      lowStockCount: lowStockProducts.filter((p) => p.stockQuantity <= (p.lowStockThreshold ?? 0)).length,
      outOfStockCount: lowStockProducts.filter((p) => p.stockQuantity === 0).length,
    };
  }

  async movements(page = 1, pageSize = 50) {
    const skip = (Math.max(1, page) - 1) * Math.max(1, pageSize);
    const take = Math.max(1, Math.min(100, pageSize));
    const [total, items] = await Promise.all([
      this.prisma.inventoryMovement.count(),
      this.prisma.inventoryMovement.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { product: { select: { title: true } } },
      }),
    ]);
    return { items, total, page, pageSize: take };
  }

  async adjust(productId: string, delta: number, reason: string) {
    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: { id: true, stockQuantity: true },
    });
    const next = product.stockQuantity + delta;
    if (next < 0) {
      throw new BadRequestException("stockQuantity cannot go below 0");
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: next },
      });
      await tx.inventoryMovement.create({
        data: { productId, delta, reason },
      });
    });
    return { stockQuantity: next };
  }
}

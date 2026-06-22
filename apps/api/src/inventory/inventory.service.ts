import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Low-stock list for gram-tracked inventory (parfum volume).
   * A product is "low" when stockGrams is set AND below lowStockGramsThreshold
   * (or threshold null + stockGrams = 0).
   */
  async lowStock() {
    const candidates = await this.prisma.product.findMany({
      where: { stockGrams: { not: null } },
      orderBy: [{ stockGrams: "asc" }],
      take: 500,
    });
    const filtered = candidates.filter((p) => {
      return (
        p.stockGrams !== null &&
        ((p.lowStockGramsThreshold !== null && p.stockGrams <= p.lowStockGramsThreshold) ||
          (p.lowStockGramsThreshold === null && p.stockGrams === 0))
      );
    });
    return filtered.slice(0, 100);
  }

  async summary() {
    const [
      productCount,
      stockGramsAgg,
      stockPiecesAgg,
      productsTrackedGrams,
      productsTrackedPieces,
      outOfStockGrams,
      outOfStockPieces,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.aggregate({ _sum: { stockGrams: true } }),
      this.prisma.product.aggregate({ _sum: { stock: true } }),
      this.prisma.product.count({ where: { stockGrams: { not: null } } }),
      this.prisma.product.count({ where: { stock: { not: null } } }),
      this.prisma.product.count({ where: { stockGrams: 0 } }),
      this.prisma.product.count({ where: { stock: 0 } }),
    ]);
    return {
      productCount,
      totalStockGrams: stockGramsAgg._sum.stockGrams ?? 0,
      totalStockPieces: stockPiecesAgg._sum.stock ?? 0,
      productsTrackedGrams,
      productsTrackedPieces,
      outOfStockGrams,
      outOfStockPieces,
    };
  }

  async movements(page = 1, pageSize = 50) {
    const skip = (Math.max(1, page) - 1) * Math.max(1, pageSize);
    const take = Math.max(1, Math.min(100, pageSize));
    const [total, items] = await Promise.all([
      this.prisma.stockMovement.count(),
      this.prisma.stockMovement.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { product: { select: { title: true } } },
      }),
    ]);
    return { items, total, page, pageSize: take };
  }

  /** Manually adjust gram-based inventory and write a movement entry. */
  async adjustGrams(productId: string, deltaGrams: number, reason: string) {
    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: { id: true, stockGrams: true },
    });
    const current = product.stockGrams ?? 0;
    const next = current + deltaGrams;
    if (next < 0) {
      throw new Error("stockGrams cannot go below 0");
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: { stockGrams: next },
      });
      await tx.stockMovement.create({
        data: { productId, delta: 0, deltaGrams, reason },
      });
    });
    return { stockGrams: next };
  }
}


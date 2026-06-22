import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  listPromoCodes() {
    return this.prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  }

  createPromoCode(body: {
    code: string;
    kind: "PERCENT" | "FIXED" | "FREE_SHIPPING" | "FIRST_ORDER";
    value: number;
    minOrderUzs?: number;
    startsAt?: string;
    endsAt?: string;
    usageLimit?: number;
    perUserLimit?: number;
  }) {
    return this.prisma.promoCode.create({
      data: {
        code: body.code.trim().toUpperCase(),
        kind: body.kind,
        value: body.value,
        minOrderUzs: body.minOrderUzs ?? null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        usageLimit: body.usageLimit ?? null,
        perUserLimit: body.perUserLimit ?? null,
      },
    });
  }

  async validate(code: string, subtotalUzs: number, userId?: string) {
    const row = await this.prisma.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (!row || !row.isActive) throw new BadRequestException("Promo code is invalid");
    const now = Date.now();
    if (row.startsAt && row.startsAt.getTime() > now) throw new BadRequestException("Promo not started");
    if (row.endsAt && row.endsAt.getTime() < now) throw new BadRequestException("Promo expired");
    if (row.minOrderUzs && subtotalUzs < row.minOrderUzs) throw new BadRequestException("Min order not reached");
    if (row.usageLimit) {
      const used = await this.prisma.promoRedemption.count({ where: { promoCodeId: row.id } });
      if (used >= row.usageLimit) throw new BadRequestException("Promo usage limit reached");
    }
    if (userId && row.perUserLimit) {
      const used = await this.prisma.promoRedemption.count({ where: { promoCodeId: row.id, userId } });
      if (used >= row.perUserLimit) throw new BadRequestException("Per-user promo limit reached");
    }
    const discountUzs =
      row.kind === "PERCENT"
        ? Math.floor((subtotalUzs * row.value) / 100)
        : row.kind === "FIXED"
          ? row.value
          : 0;
    return { promoCodeId: row.id, discountUzs: Math.max(0, Math.min(subtotalUzs, discountUzs)), promo: row };
  }
}


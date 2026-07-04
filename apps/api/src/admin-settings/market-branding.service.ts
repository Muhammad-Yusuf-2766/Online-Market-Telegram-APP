import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateMarketBrandingDto } from "./dto/update-market-branding.dto";

export type MarketBrandingDto = {
  marketName: string;
  marketSlogan: string;
  marketLogoUrl: string | null;
  deliveryPriceKrw: number;
  freeDeliveryThresholdKrw: number;
};

const DEFAULT_BRANDING: MarketBrandingDto = {
  marketName: "Ansor Market",
  marketSlogan: "Koreadagi halal mahsulotlar",
  marketLogoUrl: null,
  deliveryPriceKrw: 0,
  freeDeliveryThresholdKrw: 0,
};

@Injectable()
export class MarketBrandingService {
  constructor(private readonly prisma: PrismaService) {}

  async getBranding(): Promise<MarketBrandingDto> {
    const row = await this.prisma.marketBranding.findUnique({
      where: { id: "default" },
    });
    if (!row) return DEFAULT_BRANDING;
    return {
      marketName: row.marketName || DEFAULT_BRANDING.marketName,
      marketSlogan: row.marketSlogan || DEFAULT_BRANDING.marketSlogan,
      marketLogoUrl: row.marketLogoUrl || null,
      deliveryPriceKrw: row.deliveryPriceKrw,
      freeDeliveryThresholdKrw: row.freeDeliveryThresholdKrw,
    };
  }

  async updateBranding(dto: UpdateMarketBrandingDto): Promise<MarketBrandingDto> {
    const data = {
      ...(dto.marketName !== undefined
        ? { marketName: dto.marketName.trim() || DEFAULT_BRANDING.marketName }
        : {}),
      ...(dto.marketSlogan !== undefined
        ? { marketSlogan: dto.marketSlogan.trim() || DEFAULT_BRANDING.marketSlogan }
        : {}),
      ...(dto.marketLogoUrl !== undefined
        ? { marketLogoUrl: dto.marketLogoUrl?.trim() || null }
        : {}),
      ...(dto.deliveryPriceKrw !== undefined
        ? { deliveryPriceKrw: Math.max(0, dto.deliveryPriceKrw) }
        : {}),
      ...(dto.freeDeliveryThresholdKrw !== undefined
        ? { freeDeliveryThresholdKrw: Math.max(0, dto.freeDeliveryThresholdKrw) }
        : {}),
    };

    const row = await this.prisma.marketBranding.upsert({
      where: { id: "default" },
      create: { id: "default", ...data },
      update: data,
    });

    return {
      marketName: row.marketName,
      marketSlogan: row.marketSlogan,
      marketLogoUrl: row.marketLogoUrl,
      deliveryPriceKrw: row.deliveryPriceKrw,
      freeDeliveryThresholdKrw: row.freeDeliveryThresholdKrw,
    };
  }
}

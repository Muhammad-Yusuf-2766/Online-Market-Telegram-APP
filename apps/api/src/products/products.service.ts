import { Injectable, NotFoundException } from "@nestjs/common";
import {
  Prisma,
  ProductGender,
  type Product,
  type ProductSizePreset,
} from "@prisma/client";
import { paginationParams, toPaginatedResult, type PaginatedResult } from "../common/pagination";
import { PrismaService } from "../prisma/prisma.service";
import { OrderEventsService } from "../realtime/order-events.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { ProductListQueryDto, ProductListSort } from "./dto/product-list-query.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import {
  expandSizesForResponse,
  listingPriceFromSizeLines,
  normalizeSizeLines,
  parseStoredSizeLines,
  type PublicSizeLine,
} from "./product-sizes.util";

export type PublicProduct = {
  id: string;
  title: string;
  description: string;
  priceUzs: number;
  sizes: PublicSizeLine[] | null;
  images: string[];
  stock: number | null;
  stockGrams: number | null;
  lowStockGramsThreshold: number | null;
  ratingAvg: number | null;
  ratingCount: number;
  categoryId: string | null;
  brandId: string | null;
  familyId: string | null;
  gender: ProductGender;
  notesTop: string[];
  notesHeart: string[];
  notesBase: string[];
  isBestseller: boolean;
  isNewArrival: boolean;
  releaseYear: number | null;
  oldPriceUzs: number | null;
  discountPercent: number | null;
  lowStockThreshold: number | null;
  /** When stockGrams is set, max sellable units per size id (preset slug) = floor(stockGrams / grams). */
  maxUnitsBySizeId: Record<string, number> | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderEvents: OrderEventsService,
  ) {}

  private async presetMap(): Promise<Map<string, ProductSizePreset>> {
    const rows = await this.prisma.productSizePreset.findMany();
    return new Map(rows.map((r) => [r.id, r]));
  }

  private maxUnitsBySizeId(
    stockGrams: number | null,
    expanded: PublicSizeLine[] | null,
  ): Record<string, number> | null {
    if (stockGrams === null || expanded === null || expanded.length === 0) {
      return null;
    }
    const out: Record<string, number> = {};
    for (const s of expanded) {
      if (s.grams > 0) {
        out[s.id] = Math.floor(stockGrams / s.grams);
      }
    }
    return Object.keys(out).length > 0 ? out : null;
  }

  private toPublicProduct(p: Product, map: Map<string, ProductSizePreset>): PublicProduct {
    const stored = parseStoredSizeLines(p.sizes);
    const expanded = expandSizesForResponse(stored, map);
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      priceUzs: p.priceUzs,
      sizes: expanded,
      images: p.images,
      stock: p.stock,
      stockGrams: p.stockGrams,
      maxUnitsBySizeId: this.maxUnitsBySizeId(p.stockGrams, expanded),
      lowStockGramsThreshold: p.lowStockGramsThreshold,
      ratingAvg: p.ratingAvg,
      ratingCount: p.ratingCount,
      categoryId: p.categoryId,
      brandId: p.brandId,
      familyId: p.familyId,
      gender: p.gender,
      notesTop: p.notesTop,
      notesHeart: p.notesHeart,
      notesBase: p.notesBase,
      isBestseller: p.isBestseller,
      isNewArrival: p.isNewArrival,
      releaseYear: p.releaseYear,
      oldPriceUzs: p.oldPriceUzs,
      discountPercent: p.discountPercent,
      lowStockThreshold: p.lowStockThreshold,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  private textSearchWhere(q?: string): Prisma.ProductWhereInput | undefined {
    const trimmed = q?.trim();
    if (!trimmed) return undefined;
    return {
      OR: [
        { title: { contains: trimmed, mode: "insensitive" } },
        { description: { contains: trimmed, mode: "insensitive" } },
      ],
    };
  }

  private ilikePattern(trimmed: string): string {
    const safe = trimmed
      .slice(0, 200)
      .replace(/\\/g, "\\\\")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_");
    return `%${safe}%`;
  }

  private idsCsv(raw: string | undefined): string[] | undefined {
    if (!raw) return undefined;
    const ids = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return ids.length > 0 ? ids : undefined;
  }

  async findAll(query: ProductListQueryDto): Promise<PaginatedResult<PublicProduct>> {
    const { page, pageSize, skip } = paginationParams(query);
    const sort = query.sort ?? ProductListSort.NEWEST;
    const map = await this.presetMap();
    const where: Prisma.ProductWhereInput = this.textSearchWhere(query.q) ?? {};
    if (query.categorySlug?.trim()) where.category = { slug: query.categorySlug.trim() };
    if (query.brandSlug?.trim()) where.brand = { slug: query.brandSlug.trim() };
    if (query.gender) where.gender = query.gender;
    if (query.familySlug?.trim()) where.family = { slug: query.familySlug.trim() };

    const brandIds = this.idsCsv(query.brandIds);
    if (brandIds) where.brandId = { in: brandIds };
    const categoryIds = this.idsCsv(query.categoryIds);
    if (categoryIds) where.categoryId = { in: categoryIds };
    const familyIds = this.idsCsv(query.familyIds);
    if (familyIds) where.familyId = { in: familyIds };

    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      where.priceUzs = {};
      if (query.priceMin !== undefined) where.priceUzs.gte = query.priceMin;
      if (query.priceMax !== undefined) where.priceUzs.lte = query.priceMax;
    }
    if (query.bestseller === true) where.isBestseller = true;
    if (query.newArrival === true) where.isNewArrival = true;

    const ands: Prisma.ProductWhereInput[] = [];
    if (query.discounted === true) {
      ands.push({
        OR: [{ discountPercent: { gt: 0 } }, { oldPriceUzs: { not: null } }],
      });
    }
    if (query.inStockOnly === true) {
      ands.push({
        OR: [{ stockGrams: { gt: 0 } }, { stockGrams: null }],
      });
    }
    if (ands.length > 0) {
      where.AND = ands;
    }

    if (sort === ProductListSort.RATING_DESC || sort === ProductListSort.RATING_ASC) {
      const trimmedQ = query.q?.trim();
      const pattern = trimmedQ ? this.ilikePattern(trimmedQ) : null;
      const wherePart =
        pattern !== null
          ? Prisma.sql`WHERE (p.title ILIKE ${pattern} ESCAPE '\\' OR p.description ILIKE ${pattern} ESCAPE '\\')`
          : Prisma.empty;
      const orderPart =
        sort === ProductListSort.RATING_DESC
          ? Prisma.sql`ORDER BY CASE WHEN p."ratingCount" = 0 THEN 0 ELSE 1 END DESC, p."ratingAvg" DESC NULLS LAST, p."createdAt" DESC`
          : Prisma.sql`ORDER BY CASE WHEN p."ratingCount" = 0 THEN 0 ELSE 1 END DESC, p."ratingAvg" ASC NULLS LAST, p."createdAt" DESC`;

      const [countRows, idRows] = await Promise.all([
        this.prisma.$queryRaw<{ c: bigint }[]>`
          SELECT COUNT(*)::bigint AS c FROM "Product" p ${wherePart}
        `,
        this.prisma.$queryRaw<{ id: string }[]>`
          SELECT p.id FROM "Product" p
          ${wherePart}
          ${orderPart}
          LIMIT ${pageSize} OFFSET ${skip}
        `,
      ]);
      const total = Number(countRows[0]?.c ?? 0);
      const orderedIds = idRows.map((r) => r.id);
      if (orderedIds.length === 0) {
        return toPaginatedResult([], total, page, pageSize);
      }
      const rows = await this.prisma.product.findMany({ where: { id: { in: orderedIds } } });
      const byId = new Map(rows.map((r) => [r.id, r]));
      const ordered = orderedIds.map((id) => byId.get(id)).filter((r): r is Product => Boolean(r));
      const items = ordered.map((p) => this.toPublicProduct(p, map));
      return toPaginatedResult(items, total, page, pageSize);
    }

    const orderBy =
      sort === ProductListSort.PRICE_ASC
        ? [{ priceUzs: "asc" as const }, { createdAt: "desc" as const }]
        : sort === ProductListSort.PRICE_DESC
          ? [{ priceUzs: "desc" as const }, { createdAt: "desc" as const }]
          : sort === ProductListSort.TITLE_ASC
            ? [{ title: "asc" as const }, { createdAt: "desc" as const }]
            : sort === ProductListSort.TITLE_DESC
              ? [{ title: "desc" as const }, { createdAt: "desc" as const }]
                : sort === ProductListSort.BESTSELLING
                  ? [{ ratingCount: "desc" as const }, { createdAt: "desc" as const }]
              : [{ createdAt: "desc" as const }];

    const [total, rows] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
    ]);
    const items = rows.map((p) => this.toPublicProduct(p, map));
    return toPaginatedResult(items, total, page, pageSize);
  }

  async findOne(id: string): Promise<PublicProduct> {
    const map = await this.presetMap();
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return this.toPublicProduct(product, map);
  }

  async highlights(): Promise<{
    bestseller: PublicProduct[];
    newArrivals: PublicProduct[];
    discounted: PublicProduct[];
  }> {
    const map = await this.presetMap();
    const [bestseller, newArrivals, discounted] = await Promise.all([
      this.prisma.product.findMany({ where: { isBestseller: true }, orderBy: { updatedAt: "desc" }, take: 12 }),
      this.prisma.product.findMany({ where: { isNewArrival: true }, orderBy: { createdAt: "desc" }, take: 12 }),
      this.prisma.product.findMany({
        where: { OR: [{ discountPercent: { gt: 0 } }, { oldPriceUzs: { not: null } }] },
        orderBy: { updatedAt: "desc" },
        take: 12,
      }),
    ]);
    return {
      bestseller: bestseller.map((p) => this.toPublicProduct(p, map)),
      newArrivals: newArrivals.map((p) => this.toPublicProduct(p, map)),
      discounted: discounted.map((p) => this.toPublicProduct(p, map)),
    };
  }

  async similar(id: string): Promise<PublicProduct[]> {
    const map = await this.presetMap();
    const base = await this.prisma.product.findUnique({ where: { id } });
    if (!base) return [];
    const rows = await this.prisma.product.findMany({
      where: {
        id: { not: id },
        OR: [
          base.brandId ? { brandId: base.brandId } : undefined,
          base.familyId ? { familyId: base.familyId } : undefined,
          base.categoryId ? { categoryId: base.categoryId } : undefined,
        ].filter(Boolean) as Prisma.ProductWhereInput[],
      },
      orderBy: [{ ratingCount: "desc" }, { createdAt: "desc" }],
      take: 16,
    });
    return rows.map((p) => this.toPublicProduct(p, map));
  }

  async frequentlyBoughtTogether(id: string): Promise<PublicProduct[]> {
    const map = await this.presetMap();
    const lines = await this.prisma.orderItem.findMany({
      where: { productId: id },
      select: { orderId: true },
      take: 500,
    });
    if (lines.length === 0) return [];
    const orderIds = lines.map((l) => l.orderId);
    const siblings = await this.prisma.orderItem.findMany({
      where: { orderId: { in: orderIds }, productId: { not: null } },
      select: { productId: true },
    });
    const score = new Map<string, number>();
    for (const row of siblings) {
      if (!row.productId) continue;
      if (row.productId === id) continue;
      score.set(row.productId, (score.get(row.productId) ?? 0) + 1);
    }
    const ids = [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k]) => k);
    const products = await this.prisma.product.findMany({ where: { id: { in: ids } } });
    const byId = new Map(products.map((p) => [p.id, p]));
    return ids.map((pid) => byId.get(pid)).filter((p): p is Product => Boolean(p)).map((p) => this.toPublicProduct(p, map));
  }

  async create(dto: CreateProductDto): Promise<PublicProduct> {
    const presetById = await this.presetMap();
    let listingPrice = dto.priceUzs;
    let sizesJson: Prisma.InputJsonValue | undefined;
    if (dto.sizes && dto.sizes.length > 0) {
      const normalized = normalizeSizeLines(dto.sizes, presetById);
      listingPrice = listingPriceFromSizeLines(normalized, presetById);
      sizesJson = normalized as unknown as Prisma.InputJsonValue;
    }

    const data: Prisma.ProductCreateInput = {
      title: dto.title,
      description: dto.description ?? "",
      priceUzs: listingPrice,
      images: dto.images ?? [],
      stock: dto.stock ?? null,
      stockGrams: dto.stockGrams ?? null,
      lowStockGramsThreshold: dto.lowStockGramsThreshold ?? null,
      gender: (dto.gender as ProductGender | undefined) ?? ProductGender.UNISEX,
      notesTop: dto.notesTop ?? [],
      notesHeart: dto.notesHeart ?? [],
      notesBase: dto.notesBase ?? [],
      isBestseller: dto.isBestseller ?? false,
      isNewArrival: dto.isNewArrival ?? false,
      releaseYear: dto.releaseYear ?? null,
      oldPriceUzs: dto.oldPriceUzs ?? null,
      discountPercent: dto.discountPercent ?? null,
      lowStockThreshold: dto.lowStockThreshold ?? null,
    };
    if (sizesJson !== undefined) {
      data.sizes = sizesJson;
    }
    if (dto.categoryId) {
      data.category = { connect: { id: dto.categoryId } };
    }
    if (dto.brandId) {
      data.brand = { connect: { id: dto.brandId } };
    }
    if (dto.familyId) {
      data.family = { connect: { id: dto.familyId } };
    }

    const created = await this.prisma.product.create({ data });
    const map = await this.presetMap();
    await this.orderEvents.notifyProductStockChanged(created.id, {
      stock: created.stock,
      stockGrams: created.stockGrams,
    });
    return this.toPublicProduct(created, map);
  }

  async update(id: string, dto: UpdateProductDto): Promise<PublicProduct> {
    await this.findRaw(id);
    const presetById = await this.presetMap();
    const data: Prisma.ProductUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.images !== undefined) {
      data.images = dto.images;
    }
    if (dto.stock !== undefined) {
      data.stock = dto.stock;
    }
    if (dto.sizes !== undefined) {
      if (dto.sizes.length === 0) {
        data.sizes = Prisma.DbNull;
        if (dto.priceUzs !== undefined) {
          data.priceUzs = dto.priceUzs;
        }
      } else {
        const normalized = normalizeSizeLines(dto.sizes, presetById);
        data.sizes = normalized as unknown as Prisma.InputJsonValue;
        data.priceUzs = listingPriceFromSizeLines(normalized, presetById);
      }
    } else if (dto.priceUzs !== undefined) {
      data.priceUzs = dto.priceUzs;
    }
    if (dto.categoryId !== undefined) {
      data.category = dto.categoryId ? { connect: { id: dto.categoryId } } : { disconnect: true };
    }
    if (dto.brandId !== undefined) {
      data.brand = dto.brandId ? { connect: { id: dto.brandId } } : { disconnect: true };
    }
    if (dto.familyId !== undefined) {
      data.family = dto.familyId ? { connect: { id: dto.familyId } } : { disconnect: true };
    }
    if (dto.gender !== undefined) {
      data.gender = dto.gender as ProductGender;
    }
    if (dto.notesTop !== undefined) {
      data.notesTop = dto.notesTop;
    }
    if (dto.notesHeart !== undefined) {
      data.notesHeart = dto.notesHeart;
    }
    if (dto.notesBase !== undefined) {
      data.notesBase = dto.notesBase;
    }
    if (dto.isBestseller !== undefined) {
      data.isBestseller = dto.isBestseller;
    }
    if (dto.isNewArrival !== undefined) {
      data.isNewArrival = dto.isNewArrival;
    }
    if (dto.releaseYear !== undefined) {
      data.releaseYear = dto.releaseYear;
    }
    if (dto.oldPriceUzs !== undefined) {
      data.oldPriceUzs = dto.oldPriceUzs;
    }
    if (dto.discountPercent !== undefined) {
      data.discountPercent = dto.discountPercent;
    }
    if (dto.lowStockThreshold !== undefined) {
      data.lowStockThreshold = dto.lowStockThreshold;
    }
    if (dto.stockGrams !== undefined) {
      data.stockGrams = dto.stockGrams;
    }
    if (dto.lowStockGramsThreshold !== undefined) {
      data.lowStockGramsThreshold = dto.lowStockGramsThreshold;
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data,
    });
    const map = await this.presetMap();
    if (dto.stock !== undefined || dto.stockGrams !== undefined) {
      await this.orderEvents.notifyProductStockChanged(updated.id, {
        stock: updated.stock,
        stockGrams: updated.stockGrams,
      });
    }
    return this.toPublicProduct(updated, map);
  }

  async remove(id: string): Promise<void> {
    await this.findRaw(id);
    await this.prisma.product.delete({ where: { id } });
  }

  /** Raw Prisma row (e.g. for internal use). */
  async findRaw(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }
}

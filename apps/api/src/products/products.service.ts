import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type Product } from "@prisma/client";
import { paginationParams, toPaginatedResult, type PaginatedResult } from "../common/pagination";
import { PrismaService } from "../prisma/prisma.service";
import { OrderEventsService } from "../realtime/order-events.service";
import { StorageService } from "../storage/storage.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { ProductListQueryDto, ProductListSort } from "./dto/product-list-query.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

export type PublicProduct = Product & {
  category?: { id: string; slug: string; name: string };
  measurementUnit?: { id: string; slug: string; name: string; symbol: string; allowDecimal: boolean };
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderEvents: OrderEventsService,
    private readonly storage: StorageService,
  ) {}

  private idsCsv(raw: string | undefined): string[] | undefined {
    if (!raw) return undefined;
    const ids = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return ids.length > 0 ? ids : undefined;
  }

  private whereFromQuery(query: ProductListQueryDto): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};
    if (!query.includeInactive) {
      where.isActive = true;
    }
    const q = query.q?.trim();
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }
    if (query.categorySlug?.trim()) {
      where.category = { slug: query.categorySlug.trim() };
    }
    const categoryIds = this.idsCsv(query.categoryIds);
    if (categoryIds) {
      where.categoryId = { in: categoryIds };
    }
    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      where.priceKrw = {};
      if (query.priceMin !== undefined) where.priceKrw.gte = query.priceMin;
      if (query.priceMax !== undefined) where.priceKrw.lte = query.priceMax;
    }
    if (query.bestseller === true) where.isBestSeller = true;
    if (query.onSale === true) where.isOnSale = true;
    if (query.inStockOnly === true) where.stockQuantity = { gt: 0 };
    return where;
  }

  async findAll(query: ProductListQueryDto): Promise<PaginatedResult<PublicProduct>> {
    const { page, pageSize, skip } = paginationParams(query);
    const sort = query.sort ?? ProductListSort.NEWEST;
    const where = this.whereFromQuery(query);
    const orderBy =
      sort === ProductListSort.PRICE_ASC
        ? [{ priceKrw: "asc" as const }, { createdAt: "desc" as const }]
        : sort === ProductListSort.PRICE_DESC
          ? [{ priceKrw: "desc" as const }, { createdAt: "desc" as const }]
          : sort === ProductListSort.TITLE_ASC
            ? [{ title: "asc" as const }, { createdAt: "desc" as const }]
            : sort === ProductListSort.TITLE_DESC
              ? [{ title: "desc" as const }, { createdAt: "desc" as const }]
              : sort === ProductListSort.RATING_ASC
                ? [{ ratingAvg: "asc" as const }, { createdAt: "desc" as const }]
                : sort === ProductListSort.RATING_DESC
                  ? [{ ratingAvg: "desc" as const }, { createdAt: "desc" as const }]
                  : sort === ProductListSort.BESTSELLING
                    ? [{ isBestSeller: "desc" as const }, { ratingCount: "desc" as const }]
                    : [{ createdAt: "desc" as const }];

    const [total, rows] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          category: { select: { id: true, slug: true, name: true } },
          measurementUnit: {
            select: { id: true, slug: true, name: true, symbol: true, allowDecimal: true },
          },
        },
      }),
    ]);
    return toPaginatedResult(rows, total, page, pageSize);
  }

  async findSection(
    section: "sale" | "bestseller",
    query: ProductListQueryDto,
  ): Promise<PaginatedResult<PublicProduct>> {
    return this.findAll({
      ...query,
      onSale: section === "sale" ? true : query.onSale,
      bestseller: section === "bestseller" ? true : query.bestseller,
    });
  }

  async findOne(id: string): Promise<PublicProduct> {
    const product = await this.prisma.product.findFirst({
      where: { id, isActive: true },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        measurementUnit: {
          select: { id: true, slug: true, name: true, symbol: true, allowDecimal: true },
        },
      },
    });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<PublicProduct> {
    this.assertImages(dto.images);
    const created = await this.prisma.product.create({
      data: {
        title: dto.title,
        description: dto.description ?? "",
        priceKrw: dto.priceKrw,
        oldPriceKrw: dto.oldPriceKrw ?? null,
        discountPercent: dto.discountPercent ?? null,
        isOnSale: dto.isOnSale ?? false,
        isBestSeller: dto.isBestSeller ?? false,
        stockQuantity: dto.stockQuantity,
        lowStockThreshold: dto.lowStockThreshold ?? null,
        images: dto.images ?? [],
        isActive: dto.isActive ?? true,
        category: { connect: { id: dto.categoryId } },
        measurementUnit: { connect: { id: dto.measurementUnitId } },
      },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        measurementUnit: {
          select: { id: true, slug: true, name: true, symbol: true, allowDecimal: true },
        },
      },
    });
    await this.orderEvents.notifyProductStockChanged(created.id, { stockQuantity: created.stockQuantity });
    return created;
  }

  async update(id: string, dto: UpdateProductDto): Promise<PublicProduct> {
    const existing = await this.findRaw(id);
    this.assertImages(dto.images);
    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.priceKrw !== undefined ? { priceKrw: dto.priceKrw } : {}),
        ...(dto.oldPriceKrw !== undefined ? { oldPriceKrw: dto.oldPriceKrw } : {}),
        ...(dto.discountPercent !== undefined ? { discountPercent: dto.discountPercent } : {}),
        ...(dto.isOnSale !== undefined ? { isOnSale: dto.isOnSale } : {}),
        ...(dto.isBestSeller !== undefined ? { isBestSeller: dto.isBestSeller } : {}),
        ...(dto.stockQuantity !== undefined ? { stockQuantity: dto.stockQuantity } : {}),
        ...(dto.lowStockThreshold !== undefined ? { lowStockThreshold: dto.lowStockThreshold } : {}),
        ...(dto.images !== undefined ? { images: dto.images } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.categoryId !== undefined ? { category: { connect: { id: dto.categoryId } } } : {}),
        ...(dto.measurementUnitId !== undefined
          ? { measurementUnit: { connect: { id: dto.measurementUnitId } } }
          : {}),
      },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        measurementUnit: {
          select: { id: true, slug: true, name: true, symbol: true, allowDecimal: true },
        },
      },
    });
    if (dto.stockQuantity !== undefined) {
      await this.orderEvents.notifyProductStockChanged(updated.id, {
        stockQuantity: updated.stockQuantity,
      });
    }
    if (dto.images !== undefined) {
      await this.deleteRemovedLocalImages(existing.images, dto.images);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const product = await this.findRaw(id);
    await this.prisma.product.delete({ where: { id } });
    await this.deleteLocalImages(product.images);
  }

  async findRaw(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }

  private assertImages(images: string[] | undefined): void {
    if (images && images.length > 2) {
      throw new BadRequestException("Products can have at most 2 images");
    }
  }

  private async deleteRemovedLocalImages(previous: string[], next: string[]): Promise<void> {
    const retained = new Set(next);
    await this.deleteLocalImages(previous.filter((image) => !retained.has(image)));
  }

  private async deleteLocalImages(images: string[]): Promise<void> {
    for (const image of images) {
      await this.storage.deleteUploadedFileIfExists(image);
    }
  }
}

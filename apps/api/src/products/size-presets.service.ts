import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type ProductSizePreset } from "@prisma/client";
import type { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { paginationParams, toPaginatedResult, type PaginatedResult } from "../common/pagination";
import { PrismaService } from "../prisma/prisma.service";

export type CreateSizePresetDto = { slug: string; label: string; grams: number; sortOrder?: number };
export type UpdateSizePresetDto = Partial<CreateSizePresetDto>;

@Injectable()
export class SizePresetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPaginated(query: PaginationQueryDto): Promise<PaginatedResult<ProductSizePreset>> {
    const { page, pageSize, skip } = paginationParams(query);
    const [total, items] = await Promise.all([
      this.prisma.productSizePreset.count(),
      this.prisma.productSizePreset.findMany({
        orderBy: [{ sortOrder: "asc" }, { grams: "asc" }],
        skip,
        take: pageSize,
      }),
    ]);
    return toPaginatedResult(items, total, page, pageSize);
  }

  async create(dto: CreateSizePresetDto): Promise<ProductSizePreset> {
    const slug = dto.slug.trim();
    const label = dto.label.trim();
    if (!slug || !label || dto.grams < 1) {
      throw new BadRequestException("Invalid preset");
    }
    return this.prisma.productSizePreset.create({
      data: {
        slug,
        label,
        grams: dto.grams,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateSizePresetDto): Promise<ProductSizePreset> {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.slug !== undefined) data.slug = dto.slug.trim();
    if (dto.label !== undefined) data.label = dto.label.trim();
    if (dto.grams !== undefined) data.grams = dto.grams;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    try {
      return await this.prisma.productSizePreset.update({
        where: { id },
        data: data as { slug?: string; label?: string; grams?: number; sortOrder?: number },
      });
    } catch {
      throw new BadRequestException("Could not update preset (duplicate slug?)");
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    const products = await this.prisma.product.findMany({
      where: { sizes: { not: Prisma.DbNull } },
      select: { sizes: true },
    });
    for (const p of products) {
      const raw = p.sizes;
      if (raw === null) continue;
      const text = JSON.stringify(raw);
      if (text.includes(id)) {
        throw new BadRequestException("Preset is used by a product; remove it from products first.");
      }
    }
    await this.prisma.productSizePreset.delete({ where: { id } });
  }

  private async findOne(id: string): Promise<ProductSizePreset> {
    const row = await this.prisma.productSizePreset.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException("Preset not found");
    }
    return row;
  }
}

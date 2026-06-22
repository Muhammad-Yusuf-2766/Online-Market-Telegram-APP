import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMeasurementUnitDto } from "./dto/create-measurement-unit.dto";
import { UpdateMeasurementUnitDto } from "./dto/update-measurement-unit.dto";

@Injectable()
export class MeasurementUnitsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.measurementUnit.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  create(dto: CreateMeasurementUnitDto) {
    return this.prisma.measurementUnit.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        symbol: dto.symbol,
        sortOrder: dto.sortOrder ?? 0,
        allowDecimal: dto.allowDecimal ?? false,
      },
    });
  }

  update(id: string, dto: UpdateMeasurementUnitDto) {
    return this.prisma.measurementUnit.update({
      where: { id },
      data: {
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.symbol !== undefined ? { symbol: dto.symbol } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.allowDecimal !== undefined ? { allowDecimal: dto.allowDecimal } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.prisma.measurementUnit.delete({ where: { id } });
    return { ok: true as const };
  }
}

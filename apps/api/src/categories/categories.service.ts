import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  }

  create(body: { slug: string; name: string; parentId?: string; sortOrder?: number }) {
    return this.prisma.category.create({
      data: {
        slug: body.slug.trim().toLowerCase(),
        name: body.name.trim(),
        parentId: body.parentId ?? null,
        sortOrder: body.sortOrder ?? 0,
      },
    });
  }

  update(id: string, body: Partial<{ slug: string; name: string; parentId: string | null; sortOrder: number }>) {
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(body.slug !== undefined ? { slug: body.slug.trim().toLowerCase() } : {}),
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.parentId !== undefined ? { parentId: body.parentId } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.prisma.category.delete({ where: { id } });
    return { ok: true as const };
  }
}

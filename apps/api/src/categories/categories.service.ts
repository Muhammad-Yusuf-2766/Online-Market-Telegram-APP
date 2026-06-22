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
}


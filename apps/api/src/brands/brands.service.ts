import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.brand.findMany({ orderBy: { name: "asc" } });
  }

  create(body: { slug: string; name: string; logoUrl?: string }) {
    return this.prisma.brand.create({
      data: {
        slug: body.slug.trim().toLowerCase(),
        name: body.name.trim(),
        logoUrl: body.logoUrl ?? null,
      },
    });
  }
}


import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FragranceFamiliesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.fragranceFamily.findMany({ orderBy: { name: "asc" } });
  }

  create(body: { slug: string; name: string }) {
    return this.prisma.fragranceFamily.create({
      data: {
        slug: body.slug.trim().toLowerCase(),
        name: body.name.trim(),
      },
    });
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  listActive() {
    const now = new Date();
    return this.prisma.banner.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  listAll() {
    return this.prisma.banner.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  create(body: {
    imageUrl: string;
    title?: string;
    linkUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
    startsAt?: string;
    endsAt?: string;
  }) {
    return this.prisma.banner.create({
      data: {
        imageUrl: body.imageUrl,
        title: body.title ?? null,
        linkUrl: body.linkUrl ?? null,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
      },
    });
  }

  async update(
    id: string,
    body: Partial<{
      imageUrl: string;
      title: string | null;
      linkUrl: string | null;
      sortOrder: number;
      isActive: boolean;
      startsAt: string | null;
      endsAt: string | null;
    }>,
  ) {
    await this.ensureExists(id);
    return this.prisma.banner.update({
      where: { id },
      data: {
        ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.linkUrl !== undefined ? { linkUrl: body.linkUrl } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.startsAt !== undefined
          ? { startsAt: body.startsAt ? new Date(body.startsAt) : null }
          : {}),
        ...(body.endsAt !== undefined
          ? { endsAt: body.endsAt ? new Date(body.endsAt) : null }
          : {}),
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.banner.delete({ where: { id } });
    return { ok: true as const };
  }

  private async ensureExists(id: string) {
    const row = await this.prisma.banner.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Banner not found");
  }
}

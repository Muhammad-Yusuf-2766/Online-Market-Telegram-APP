import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { userWhereFromSegmentDefinition } from "./segment-definition";

@Injectable()
export class SegmentsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.userSegment.findMany({ orderBy: { createdAt: "desc" } });
  }

  create(body: { name: string; definition: Prisma.InputJsonValue }) {
    return this.prisma.userSegment.create({
      data: { name: body.name.trim(), definition: body.definition },
    });
  }

  /**
   * Replaces all memberships from segment.definition (see segment-definition.ts).
   */
  async syncMembersFromDefinition(segmentId: string): Promise<{ synced: number }> {
    const segment = await this.prisma.userSegment.findUnique({ where: { id: segmentId } });
    if (!segment) {
      throw new NotFoundException("Segment not found");
    }

    let where: Prisma.UserWhereInput;
    try {
      where = userWhereFromSegmentDefinition(segment.definition);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid segment definition";
      throw new BadRequestException(msg);
    }

    const users = await this.prisma.user.findMany({ where, select: { id: true } });
    const ids = users.map((u) => u.id);

    await this.prisma.$transaction(async (tx) => {
      await tx.userSegmentMembership.deleteMany({ where: { segmentId } });
      if (ids.length > 0) {
        await tx.userSegmentMembership.createMany({
          data: ids.map((userId) => ({ segmentId, userId })),
        });
      }
      await tx.userSegment.update({
        where: { id: segmentId },
        data: { userCountCached: ids.length, recomputedAt: new Date() },
      });
    });

    return { synced: ids.length };
  }

  /** Add users without removing existing members (deduped). */
  async addMembers(segmentId: string, userIds: string[]): Promise<{ added: number }> {
    const segment = await this.prisma.userSegment.findUnique({ where: { id: segmentId } });
    if (!segment) {
      throw new NotFoundException("Segment not found");
    }

    const unique = [...new Set(userIds.filter(Boolean))];
    if (unique.length === 0) {
      return { added: 0 };
    }

    const before = await this.prisma.userSegmentMembership.count({ where: { segmentId } });

    await this.prisma.userSegmentMembership.createMany({
      data: unique.map((userId) => ({ segmentId, userId })),
      skipDuplicates: true,
    });

    const count = await this.prisma.userSegmentMembership.count({ where: { segmentId } });
    const added = count - before;
    await this.prisma.userSegment.update({
      where: { id: segmentId },
      data: { userCountCached: count, recomputedAt: new Date() },
    });

    return { added };
  }
}


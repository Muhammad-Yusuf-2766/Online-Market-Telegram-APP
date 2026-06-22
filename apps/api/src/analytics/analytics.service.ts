import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { TrackAnalyticsEventDto } from "./dto/track-analytics-event.dto";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(events: TrackAnalyticsEventDto[], user: User | null, userAgent?: string): Promise<number> {
    if (events.length === 0) return 0;
    const now = new Date();
    const payload = events.map((event) => ({
      eventType: event.eventType,
      sessionId: event.sessionId,
      userId: user?.id ?? null,
      productId: event.productId ?? null,
      orderId: event.orderId ?? null,
      searchQuery: event.searchQuery ?? null,
      properties: event.properties ? (event.properties as Prisma.InputJsonValue) : undefined,
      tmaPlatform: event.tmaPlatform ?? null,
      userAgent: userAgent ?? null,
      createdAt: now,
    }));
    const result = await this.prisma.analyticsEvent.createMany({ data: payload });
    return result.count;
  }
}

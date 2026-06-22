import { Body, Controller, Headers, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import type { Request } from "express";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { AnalyticsService } from "./analytics.service";
import { TrackAnalyticsEventsBatchDto } from "./dto/track-analytics-event.dto";

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post("events/anonymous")
  @ApiOperation({ summary: "Track anonymous product/app events (batched)" })
  @ApiOkResponse({ schema: { example: { tracked: 3 } } })
  async trackAnonymous(
    @Body() body: TrackAnalyticsEventsBatchDto,
    @Headers("user-agent") userAgent?: string,
  ): Promise<{ tracked: number }> {
    const tracked = await this.analytics.track(body.events, null, userAgent);
    return { tracked };
  }

  @Post("events")
  @UseGuards(JwtUserGuard)
  @ApiBearerAuth("user-jwt")
  @ApiOperation({ summary: "Track authenticated user events (batched)" })
  @ApiOkResponse({ schema: { example: { tracked: 3 } } })
  async trackAuthenticated(
    @Body() body: TrackAnalyticsEventsBatchDto,
    @Req() req: Request & { user: User },
    @Headers("user-agent") userAgent?: string,
  ): Promise<{ tracked: number }> {
    const tracked = await this.analytics.track(body.events, req.user, userAgent);
    return { tracked };
  }
}

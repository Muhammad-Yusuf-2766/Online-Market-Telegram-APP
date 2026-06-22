import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RecommendationsService } from "./recommendations.service";

@ApiTags("recommendations")
@Controller("recommendations")
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Get("products/:id/similar")
  similar(@Param("id") id: string) {
    return this.recommendations.similar(id);
  }

  @Get("products/:id/frequently-bought-together")
  frequentlyBoughtTogether(@Param("id") id: string) {
    return this.recommendations.frequentlyBoughtTogether(id);
  }

  @Get("me/recently-viewed")
  @ApiBearerAuth("user-jwt")
  @UseGuards(JwtUserGuard)
  recentlyViewed(@CurrentUser() user: User) {
    return this.recommendations.recentlyViewed(user.id);
  }
}


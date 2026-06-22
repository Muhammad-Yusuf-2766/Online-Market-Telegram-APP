import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { PromotionsService } from "./promotions.service";

@ApiTags("promotions")
@Controller("promo-codes")
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get("admin")
  @ApiBearerAuth("admin-jwt")
  @UseGuards(JwtAdminGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.promotions.view)
  list() {
    return this.promotions.listPromoCodes();
  }

  @Post("admin")
  @ApiBearerAuth("admin-jwt")
  @UseGuards(JwtAdminGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.promotions.manage)
  create(
    @Body()
    body: {
      code: string;
      kind: "PERCENT" | "FIXED" | "FREE_SHIPPING" | "FIRST_ORDER";
      value: number;
      minOrderUzs?: number;
      startsAt?: string;
      endsAt?: string;
      usageLimit?: number;
      perUserLimit?: number;
    },
  ) {
    return this.promotions.createPromoCode(body);
  }

  @Post("validate")
  @ApiBearerAuth("user-jwt")
  @UseGuards(JwtUserGuard)
  validate(
    @CurrentUser() user: User,
    @Body() body: { code: string; subtotalUzs: number },
  ) {
    return this.promotions.validate(body.code, body.subtotalUzs, user.id);
  }
}


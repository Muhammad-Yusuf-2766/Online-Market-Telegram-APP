import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import { BrandsService } from "./brands.service";

@ApiTags("brands")
@Controller("brands")
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  list() {
    return this.brands.list();
  }

  @Post("admin")
  @ApiBearerAuth("admin-jwt")
  @UseGuards(JwtAdminGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.brands.manage)
  create(@Body() body: { slug: string; name: string; logoUrl?: string }) {
    return this.brands.create(body);
  }
}


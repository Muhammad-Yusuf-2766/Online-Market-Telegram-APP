import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import { FragranceFamiliesService } from "./fragrance-families.service";

@ApiTags("fragrance-families")
@Controller("fragrance-families")
export class FragranceFamiliesController {
  constructor(private readonly families: FragranceFamiliesService) {}

  @Get()
  list() {
    return this.families.list();
  }

  @Post("admin")
  @ApiBearerAuth("admin-jwt")
  @UseGuards(JwtAdminGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.products.manage)
  create(@Body() body: { slug: string; name: string }) {
    return this.families.create(body);
  }
}

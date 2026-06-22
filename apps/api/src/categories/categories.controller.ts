import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import { CategoriesService } from "./categories.service";

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list() {
    return this.categories.list();
  }

  @Post("admin")
  @ApiBearerAuth("admin-jwt")
  @UseGuards(JwtAdminGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.categories.manage)
  create(@Body() body: { slug: string; name: string; parentId?: string; sortOrder?: number }) {
    return this.categories.create(body);
  }
}


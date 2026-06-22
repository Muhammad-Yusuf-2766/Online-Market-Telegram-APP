import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import { BannersService } from "./banners.service";

@ApiTags("admin-banners")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller("admin/banners")
export class AdminBannersController {
  constructor(private readonly banners: BannersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.banners.view)
  list() {
    return this.banners.listAll();
  }

  @Post()
  @RequirePermissions(PERMISSIONS.banners.manage)
  create(
    @Body()
    body: {
      imageUrl: string;
      title?: string;
      linkUrl?: string;
      sortOrder?: number;
      isActive?: boolean;
      startsAt?: string;
      endsAt?: string;
    },
  ) {
    return this.banners.create(body);
  }

  @Patch(":id")
  @RequirePermissions(PERMISSIONS.banners.manage)
  update(
    @Param("id") id: string,
    @Body()
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
    return this.banners.update(id, body);
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.banners.manage)
  remove(@Param("id") id: string) {
    return this.banners.remove(id);
  }
}

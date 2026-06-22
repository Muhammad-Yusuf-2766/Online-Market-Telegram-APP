import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import { InventoryService } from "./inventory.service";

@ApiTags("inventory")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller("admin/inventory")
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get("low-stock")
  @RequirePermissions(PERMISSIONS.inventory.view)
  lowStock() {
    return this.inventory.lowStock();
  }

  @Get("summary")
  @RequirePermissions(PERMISSIONS.inventory.view)
  summary() {
    return this.inventory.summary();
  }

  @Get("movements")
  @RequirePermissions(PERMISSIONS.inventory.view)
  movements(
    @Query("page") pageRaw?: string,
    @Query("pageSize") pageSizeRaw?: string,
  ) {
    const page = Number(pageRaw ?? "1");
    const pageSize = Number(pageSizeRaw ?? "50");
    return this.inventory.movements(page, pageSize);
  }

  @Post(":productId/grams")
  @RequirePermissions(PERMISSIONS.inventory.manage)
  async adjustGrams(
    @Param("productId") productId: string,
    @Body() body: { deltaGrams: number; reason?: string },
  ) {
    if (!Number.isFinite(body?.deltaGrams) || body.deltaGrams === 0) {
      throw new BadRequestException("deltaGrams must be a non-zero integer");
    }
    return this.inventory.adjustGrams(
      productId,
      Math.trunc(body.deltaGrams),
      (body.reason ?? "ADMIN_ADJUST").slice(0, 80),
    );
  }
}


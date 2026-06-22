import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { InventoryService } from "./inventory.service";

@ApiTags("inventory")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard)
@Controller("admin/inventory")
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get("low-stock")
  lowStock() {
    return this.inventory.lowStock();
  }

  @Get("summary")
  summary() {
    return this.inventory.summary();
  }

  @Get("movements")
  movements(@Query("page") pageRaw?: string, @Query("pageSize") pageSizeRaw?: string) {
    const page = Number(pageRaw ?? "1");
    const pageSize = Number(pageSizeRaw ?? "50");
    return this.inventory.movements(page, pageSize);
  }

  @Post(":productId/adjust")
  async adjust(
    @Param("productId") productId: string,
    @Body() body: { delta: number; reason?: string },
  ) {
    if (!Number.isFinite(body?.delta) || body.delta === 0) {
      throw new BadRequestException("delta must be a non-zero integer");
    }
    return this.inventory.adjust(
      productId,
      Math.trunc(body.delta),
      (body.reason ?? "ADMIN_ADJUSTMENT").slice(0, 80),
    );
  }
}

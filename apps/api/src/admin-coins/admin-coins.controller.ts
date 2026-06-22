import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AdminCoinGift } from "@prisma/client";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { CurrentAdmin } from "../common/decorators/current-admin.decorator";
import type { AdminUserWithPermissions } from "../common/rbac/admin-user-with-permissions";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { CoinLedgerQueryDto } from "./dto/coin-ledger-query.dto";
import type { PaginatedResult } from "../common/pagination";
import { AdminAdjustCoinsDto } from "./dto/admin-adjust-coins.dto";
import { AdminGiftCoinsDto } from "./dto/admin-gift-coins.dto";
import { AdminCoinsService, type AdminCoinGiftRow } from "./admin-coins.service";

@ApiTags("admin-coins")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller("admin")
export class AdminCoinsController {
  constructor(private readonly adminCoins: AdminCoinsService) {}

  @Post("users/:userId/coins/gift")
  @RequirePermissions(PERMISSIONS.coinGifts.manage)
  @ApiOperation({ summary: "Gift coins with message metadata (Telegram + ledger)" })
  @ApiOkResponse()
  async gift(
    @CurrentAdmin() admin: AdminUserWithPermissions,
    @Param("userId") userId: string,
    @Body() body: AdminGiftCoinsDto,
  ): Promise<AdminCoinGift> {
    return this.adminCoins.giftCoins({
      adminId: admin.id,
      targetUserId: userId,
      title: body.title,
      description: body.description ?? "",
      imageUrl: body.imageUrl ?? "",
      coins: body.coins,
    });
  }

  @Post("users/:userId/coins/adjust")
  @RequirePermissions(PERMISSIONS.users.coinsManage)
  @ApiOperation({ summary: "Adjust user coin balance (requires admin password)" })
  @ApiOkResponse()
  async adjust(
    @CurrentAdmin() admin: AdminUserWithPermissions,
    @Param("userId") userId: string,
    @Body() body: AdminAdjustCoinsDto,
  ): Promise<{ newBalance: number }> {
    return this.adminCoins.adjustBalance({
      adminUser: admin,
      targetUserId: userId,
      password: body.password,
      deltaUzs: body.deltaUzs,
      note: body.note,
    });
  }

  @Get("coin-gifts")
  @RequirePermissions(PERMISSIONS.coinGifts.view)
  @ApiOperation({ summary: "Paginated admin coin gift history" })
  async listGifts(@Query() query: PaginationQueryDto): Promise<PaginatedResult<AdminCoinGiftRow>> {
    return this.adminCoins.listGiftsPaginated(query);
  }

  @Get("coin-ledger")
  @RequirePermissions(PERMISSIONS.coinLedger.view)
  @ApiOperation({ summary: "Paginated coin ledger (optional userId filter)" })
  async listLedger(
    @Query() query: CoinLedgerQueryDto,
  ): Promise<PaginatedResult<{ id: string; userId: string; delta: number; kind: string; metadata: unknown; createdAt: Date }>> {
    return this.adminCoins.listLedgerPaginated(query);
  }
}

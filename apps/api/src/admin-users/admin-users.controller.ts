import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserTier, type User } from "@prisma/client";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import type { PaginatedResult } from "../common/pagination";
import type { ReferralTreeNode } from "../users/users.service";
import { AdminUsersService } from "./admin-users.service";

@ApiTags("admin-users")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller("admin/users")
export class AdminUsersController {
  constructor(private readonly adminUsers: AdminUsersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.users.view)
  @ApiOperation({ summary: "List Telegram users (admin, paginated, search + tier filter)" })
  @ApiOkResponse({ description: "Paginated users" })
  async list(
    @Query() query: PaginationQueryDto,
    @Query("q") q?: string,
    @Query("tier") tierRaw?: string,
  ): Promise<PaginatedResult<User>> {
    const validTiers = Object.values(UserTier) as string[];
    const tier =
      tierRaw && validTiers.includes(tierRaw) ? (tierRaw as UserTier) : undefined;
    return this.adminUsers.findAllPaginated({ ...query, q, tier });
  }

  @Get(":userId/referral-tree")
  @RequirePermissions(PERMISSIONS.users.view)
  @ApiOperation({ summary: "Nested referral tree for a user (admin)" })
  @ApiOkResponse({ description: "Referral tree root node" })
  async referralTree(
    @Param("userId") userId: string,
    @Query("maxDepth", new DefaultValuePipe(5), ParseIntPipe) maxDepth: number,
  ): Promise<ReferralTreeNode> {
    return this.adminUsers.getReferralTree(userId, maxDepth);
  }

  @Get(":userId/details")
  @RequirePermissions(PERMISSIONS.users.view)
  @ApiOperation({ summary: "Customer 360 profile and KPIs" })
  @ApiOkResponse()
  async details(@Param("userId") userId: string) {
    return this.adminUsers.getUser360(userId);
  }
}

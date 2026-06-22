import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import {
  AdminStatsService,
  type DashboardOverviewResult,
  type DashboardStatsResult,
  type InsightsAovLtvResult,
  type InsightsFunnelResult,
  type InsightsSearchTermResult,
  type InsightsTopProductResult,
} from "./admin-stats.service";
import { DashboardStatsQueryDto } from "./dto/dashboard-stats-query.dto";

@ApiTags("admin-stats")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller("admin/stats")
export class AdminStatsController {
  constructor(private readonly stats: AdminStatsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.dashboard.view)
  @ApiOperation({ summary: "Dashboard KPIs and daily series for the selected UTC date range" })
  @ApiOkResponse({ description: "Totals and per-day orders / new users" })
  async dashboard(@Query() query: DashboardStatsQueryDto): Promise<DashboardStatsResult> {
    return this.stats.getDashboardStats(query.from, query.to);
  }

  @Get("insights/funnel")
  @RequirePermissions(PERMISSIONS.insights.view)
  @ApiOperation({ summary: "Conversion funnel in date range" })
  @ApiOkResponse()
  async funnel(@Query() query: DashboardStatsQueryDto): Promise<InsightsFunnelResult> {
    return this.stats.getFunnel(query.from, query.to);
  }

  @Get("insights/aov-ltv")
  @RequirePermissions(PERMISSIONS.insights.view)
  @ApiOperation({ summary: "AOV / LTV / repeat purchase metrics in date range" })
  @ApiOkResponse()
  async aovLtv(@Query() query: DashboardStatsQueryDto): Promise<InsightsAovLtvResult> {
    return this.stats.getAovLtv(query.from, query.to);
  }

  @Get("insights/top-products")
  @RequirePermissions(PERMISSIONS.insights.view)
  @ApiOperation({ summary: "Top products by views/sales/revenue in date range" })
  @ApiOkResponse()
  async topProducts(
    @Query() query: DashboardStatsQueryDto & { metric?: "views" | "sales" | "revenue" },
  ): Promise<InsightsTopProductResult[]> {
    return this.stats.getTopProducts(query.from, query.to, query.metric ?? "views");
  }

  @Get("insights/search-terms")
  @RequirePermissions(PERMISSIONS.insights.view)
  @ApiOperation({ summary: "Most searched terms with zero-results counters" })
  @ApiOkResponse()
  async searchTerms(@Query() query: DashboardStatsQueryDto): Promise<InsightsSearchTermResult[]> {
    return this.stats.getSearchTerms(query.from, query.to);
  }

  @Get("overview")
  @RequirePermissions(PERMISSIONS.dashboard.view)
  @ApiOperation({ summary: "Snapshot KPIs across users, orders, catalog, inventory" })
  @ApiOkResponse()
  async overview(): Promise<DashboardOverviewResult> {
    return this.stats.getOverview();
  }
}

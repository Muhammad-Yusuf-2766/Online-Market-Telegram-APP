import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import {
  AdminStatsService,
  type DashboardOverviewResult,
  type DashboardStatsResult,
} from "./admin-stats.service";
import { DashboardStatsQueryDto } from "./dto/dashboard-stats-query.dto";

@ApiTags("admin-stats")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard)
@Controller("admin/stats")
export class AdminStatsController {
  constructor(private readonly stats: AdminStatsService) {}

  @Get()
  @ApiOperation({ summary: "Dashboard KPIs and daily series for the selected UTC date range" })
  @ApiOkResponse({ description: "Totals and per-day orders / new users" })
  async dashboard(@Query() query: DashboardStatsQueryDto): Promise<DashboardStatsResult> {
    return this.stats.getDashboardStats(query.from, query.to);
  }

  @Get("dashboard")
  @ApiOperation({ summary: "Dashboard KPIs and daily series for the selected UTC date range" })
  @ApiOkResponse({ description: "Totals and per-day orders / new users" })
  async dashboardAlias(@Query() query: DashboardStatsQueryDto): Promise<DashboardStatsResult> {
    return this.stats.getDashboardStats(query.from, query.to);
  }

  @Get("overview")
  @ApiOperation({ summary: "Snapshot KPIs across users, orders, catalog, inventory" })
  @ApiOkResponse()
  async overview(): Promise<DashboardOverviewResult> {
    return this.stats.getOverview();
  }
}

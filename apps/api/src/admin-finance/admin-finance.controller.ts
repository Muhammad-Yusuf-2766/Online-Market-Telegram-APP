import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import { AdminFinanceService, type FinanceReportResult } from "./admin-finance.service";
import { FinanceReportQueryDto } from "./dto/finance-report-query.dto";

@ApiTags("admin-finance")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller("admin/finance")
export class AdminFinanceController {
  constructor(private readonly finance: AdminFinanceService) {}

  @Get("report")
  @RequirePermissions(PERMISSIONS.finance.view)
  @ApiOperation({ summary: "Finance report with KPIs, breakdowns, and coin economy" })
  @ApiOkResponse()
  async report(@Query() query: FinanceReportQueryDto): Promise<FinanceReportResult> {
    return this.finance.getReport(query.from, query.to, query.compare ?? false);
  }

  @Get("report.csv")
  @RequirePermissions(PERMISSIONS.finance.export)
  @ApiOperation({ summary: "Export daily finance series as CSV" })
  @ApiProduces("text/csv")
  async reportCsv(@Query() query: FinanceReportQueryDto, @Res() res: Response): Promise<void> {
    const { filename, content } = await this.finance.getSeriesCsv(query.from, query.to);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(content);
  }

  @Get("orders.csv")
  @RequirePermissions(PERMISSIONS.finance.export)
  @ApiOperation({ summary: "Export orders in range as CSV" })
  @ApiProduces("text/csv")
  async ordersCsv(@Query() query: FinanceReportQueryDto, @Res() res: Response): Promise<void> {
    const { filename, content } = await this.finance.getOrdersCsv(query.from, query.to);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(content);
  }
}

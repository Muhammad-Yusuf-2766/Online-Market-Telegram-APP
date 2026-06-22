import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { AdminFinanceService, type FinanceReportResult } from "./admin-finance.service";
import { FinanceReportQueryDto } from "./dto/finance-report-query.dto";

@ApiTags("admin-finance")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard)
@Controller("admin/finance")
export class AdminFinanceController {
  constructor(private readonly finance: AdminFinanceService) {}

  @Get("report")
  @ApiOperation({ summary: "Ansor Market finance report" })
  @ApiOkResponse()
  async report(@Query() query: FinanceReportQueryDto): Promise<FinanceReportResult> {
    return this.finance.getReport(query.from, query.to);
  }
}

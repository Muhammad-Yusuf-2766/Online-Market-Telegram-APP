import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import type { PaginatedResult } from "../common/pagination";
import { AdminProductFeedbackQueryDto } from "./dto/admin-product-feedback-query.dto";
import { PatchProductFeedbackStatusDto } from "./dto/patch-product-feedback-status.dto";
import {
  ProductFeedbackService,
  type AdminProductFeedbackRow,
} from "./product-feedback.service";

@ApiTags("admin-product-feedback")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard)
@Controller("admin/product-feedback")
export class AdminProductFeedbackController {
  constructor(private readonly productFeedback: ProductFeedbackService) {}

  @Get()
  @ApiOperation({ summary: "List product feedback for moderation" })
  @ApiOkResponse({ description: "Paginated feedback" })
  async list(@Query() query: AdminProductFeedbackQueryDto): Promise<PaginatedResult<AdminProductFeedbackRow>> {
    return this.productFeedback.adminList(query);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Approve or reject feedback" })
  @ApiOkResponse({ description: "Updated feedback" })
  async setStatus(
    @Param("id") id: string,
    @Body() body: PatchProductFeedbackStatusDto,
  ): Promise<AdminProductFeedbackRow> {
    return this.productFeedback.adminSetStatus(id, body);
  }
}

import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import type { PaginatedResult } from "../common/pagination";
import { AdminProductFeedbackQueryDto } from "./dto/admin-product-feedback-query.dto";
import { PatchProductFeedbackStatusDto } from "./dto/patch-product-feedback-status.dto";
import {
  ProductFeedbackService,
  type AdminProductFeedbackRow,
} from "./product-feedback.service";

@ApiTags("admin-product-feedback")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller("admin/product-feedback")
export class AdminProductFeedbackController {
  constructor(private readonly productFeedback: ProductFeedbackService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.productFeedback.view)
  @ApiOperation({ summary: "List product feedback for moderation" })
  @ApiOkResponse({ description: "Paginated feedback" })
  async list(@Query() query: AdminProductFeedbackQueryDto): Promise<PaginatedResult<AdminProductFeedbackRow>> {
    return this.productFeedback.adminList(query);
  }

  @Patch(":id")
  @RequirePermissions(PERMISSIONS.productFeedback.manage)
  @ApiOperation({ summary: "Approve or reject feedback" })
  @ApiOkResponse({ description: "Updated feedback" })
  async setStatus(
    @Param("id") id: string,
    @Body() body: PatchProductFeedbackStatusDto,
  ): Promise<AdminProductFeedbackRow> {
    return this.productFeedback.adminSetStatus(id, body);
  }
}

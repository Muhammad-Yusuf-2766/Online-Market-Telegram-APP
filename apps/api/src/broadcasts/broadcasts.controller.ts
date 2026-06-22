import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import type { PaginatedResult } from "../common/pagination";
import { BroadcastsService } from "./broadcasts.service";

@ApiTags("broadcasts")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller("admin/broadcasts")
export class BroadcastsController {
  constructor(private readonly broadcasts: BroadcastsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.broadcasts.view)
  @ApiOperation({ summary: "List broadcasts (paginated, newest first)" })
  @ApiOkResponse({ description: "Paginated broadcast rows" })
  list(@Query() query: PaginationQueryDto): Promise<PaginatedResult<unknown>> {
    return this.broadcasts.listPaginated(query);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.broadcasts.manage)
  create(
    @Body()
    body: {
      title: string;
      bodyUz: string;
      bodyRu: string;
      segmentId: string;
      imageUrl?: string;
      coinGiftAmount?: number;
      promoCodeId?: string;
      scheduledFor?: string;
    },
  ) {
    return this.broadcasts.create(body);
  }

  @Post(":id/send")
  @RequirePermissions(PERMISSIONS.broadcasts.manage)
  sendNow(@Param("id") id: string) {
    return this.broadcasts.sendNow(id);
  }
}


import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import type { PaginatedResult } from "../common/pagination";
import { BroadcastsService } from "./broadcasts.service";

@ApiTags("broadcasts")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard)
@Controller("admin/broadcasts")
export class BroadcastsController {
  constructor(private readonly broadcasts: BroadcastsService) {}

  @Get()
  @ApiOperation({ summary: "List broadcasts" })
  @ApiOkResponse({ description: "Paginated broadcast rows" })
  list(@Query() query: PaginationQueryDto): Promise<PaginatedResult<unknown>> {
    return this.broadcasts.listPaginated(query);
  }

  @Post()
  create(
    @Body()
    body: {
      title: string;
      body: string;
      imageUrl?: string;
      targetUrl?: string;
    },
  ) {
    return this.broadcasts.create(body);
  }

  @Post(":id/send")
  sendNow(@Param("id") id: string) {
    return this.broadcasts.sendNow(id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete broadcast" })
  remove(@Param("id") id: string) {
    return this.broadcasts.remove(id);
  }
}

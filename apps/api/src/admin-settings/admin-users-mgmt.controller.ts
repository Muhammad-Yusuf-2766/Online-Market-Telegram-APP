import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AdminUser } from "@prisma/client";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { CurrentAdmin } from "../common/decorators/current-admin.decorator";
import { SearchablePaginationQueryDto } from "../common/dto/searchable-pagination-query.dto";
import { AdminUsersMgmtService } from "./admin-users-mgmt.service";
import { CreateAdminUserDto } from "./dto/create-admin-user.dto";
import { UpdateAdminUserDto } from "./dto/update-admin-user.dto";

@ApiTags("admin-settings")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard)
@Controller("admin/settings/admin-users")
export class AdminUsersMgmtController {
  constructor(private readonly service: AdminUsersMgmtService) {}

  @Get()
  @ApiOperation({ summary: "List Super Admin users" })
  list(@Query() query: SearchablePaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get Super Admin user" })
  getOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create Super Admin user" })
  create(@Body() body: CreateAdminUserDto) {
    return this.service.create(body);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update Super Admin user" })
  update(@Param("id") id: string, @Body() body: UpdateAdminUserDto) {
    return this.service.update(id, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete Super Admin user" })
  remove(@Param("id") id: string, @CurrentAdmin() admin: AdminUser) {
    return this.service.remove(id, admin.id);
  }
}

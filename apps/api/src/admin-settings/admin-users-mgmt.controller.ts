import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { CurrentAdmin } from "../common/decorators/current-admin.decorator";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import type { AdminUserWithPermissions } from "../common/rbac/admin-user-with-permissions";
import { AdminUsersMgmtService } from "./admin-users-mgmt.service";
import { CreateAdminUserDto } from "./dto/create-admin-user.dto";
import { SetPermissionsDto } from "./dto/set-permissions.dto";
import { UpdateAdminUserDto } from "./dto/update-admin-user.dto";

@ApiTags("admin-settings")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller("admin/settings/admin-users")
export class AdminUsersMgmtController {
  constructor(private readonly service: AdminUsersMgmtService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.settings.users.view)
  @ApiOperation({ summary: "List admin panel users" })
  list(@Query() query: PaginationQueryDto, @Query("q") q?: string) {
    return this.service.findAll(query, q);
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.settings.users.view)
  @ApiOperation({ summary: "Get admin panel user" })
  getOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.settings.users.manage)
  @ApiOperation({ summary: "Create admin panel user" })
  create(@Body() body: CreateAdminUserDto) {
    return this.service.create(body);
  }

  @Patch(":id")
  @RequirePermissions(PERMISSIONS.settings.users.manage)
  @ApiOperation({ summary: "Update admin panel user" })
  update(@Param("id") id: string, @Body() body: UpdateAdminUserDto) {
    return this.service.update(id, body);
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.settings.users.manage)
  @ApiOperation({ summary: "Delete admin panel user" })
  remove(@Param("id") id: string, @CurrentAdmin() admin: AdminUserWithPermissions) {
    return this.service.remove(id, admin.id);
  }

  @Put(":id/permissions")
  @RequirePermissions(PERMISSIONS.settings.users.manage)
  @ApiOperation({ summary: "Replace direct permissions for admin user" })
  setPermissions(@Param("id") id: string, @Body() body: SetPermissionsDto) {
    return this.service.setPermissions(id, body);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import { CreatePermissionDto } from "./dto/create-permission.dto";
import { UpdatePermissionDto } from "./dto/update-permission.dto";
import { PermissionsService } from "./permissions.service";

@ApiTags("admin-settings")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller("admin/settings/permissions")
export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.settings.permissions.view)
  @ApiOperation({ summary: "List permissions" })
  list() {
    return this.service.findAll();
  }

  @Post()
  @RequirePermissions(PERMISSIONS.settings.permissions.manage)
  @ApiOperation({ summary: "Create permission" })
  create(@Body() body: CreatePermissionDto) {
    return this.service.create(body);
  }

  @Patch(":id")
  @RequirePermissions(PERMISSIONS.settings.permissions.manage)
  @ApiOperation({ summary: "Update permission" })
  update(@Param("id") id: string, @Body() body: UpdatePermissionDto) {
    return this.service.update(id, body);
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.settings.permissions.manage)
  @ApiOperation({ summary: "Delete permission" })
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}

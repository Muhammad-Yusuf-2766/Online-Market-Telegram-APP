import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import { CreateRoleDto } from "./dto/create-role.dto";
import { SetPermissionsDto } from "./dto/set-permissions.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { RolesService } from "./roles.service";

@ApiTags("admin-settings")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller("admin/settings/roles")
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.settings.roles.view)
  @ApiOperation({ summary: "List roles" })
  list() {
    return this.service.findAll();
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.settings.roles.view)
  @ApiOperation({ summary: "Get role with permissions" })
  getOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.settings.roles.manage)
  @ApiOperation({ summary: "Create role" })
  create(@Body() body: CreateRoleDto) {
    return this.service.create(body);
  }

  @Patch(":id")
  @RequirePermissions(PERMISSIONS.settings.roles.manage)
  @ApiOperation({ summary: "Update role" })
  update(@Param("id") id: string, @Body() body: UpdateRoleDto) {
    return this.service.update(id, body);
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.settings.roles.manage)
  @ApiOperation({ summary: "Delete role" })
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Put(":id/permissions")
  @RequirePermissions(PERMISSIONS.settings.roles.manage)
  @ApiOperation({ summary: "Replace role permissions" })
  setPermissions(@Param("id") id: string, @Body() body: SetPermissionsDto) {
    return this.service.setPermissions(id, body);
  }
}

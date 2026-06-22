import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import { SegmentsService } from "./segments.service";

@ApiTags("segments")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller("admin/segments")
export class SegmentsController {
  constructor(private readonly segments: SegmentsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.segments.view)
  list() {
    return this.segments.list();
  }

  @Post()
  @RequirePermissions(PERMISSIONS.segments.manage)
  create(@Body() body: { name: string; definition: Record<string, unknown> }) {
    return this.segments.create({
      name: body.name,
      definition: body.definition as Prisma.InputJsonValue,
    });
  }

  /** Rebuild UserSegmentMembership from definition (replaces previous members). */
  @Post(":id/sync-members")
  @RequirePermissions(PERMISSIONS.segments.manage)
  syncMembers(@Param("id") id: string) {
    return this.segments.syncMembersFromDefinition(id);
  }

  @Post(":id/members")
  @RequirePermissions(PERMISSIONS.segments.manage)
  addMembers(@Param("id") id: string, @Body() body: { userIds: string[] }) {
    return this.segments.addMembers(id, body.userIds ?? []);
  }
}


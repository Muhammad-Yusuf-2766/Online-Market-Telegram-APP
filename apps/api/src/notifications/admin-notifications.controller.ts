import { Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { CurrentAdmin } from "../common/decorators/current-admin.decorator";
import type { AdminUserWithPermissions } from "../common/rbac/admin-user-with-permissions";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import { ListNotificationsQueryDto } from "./dto/list-notifications-query.dto";
import {
  NotificationsService,
  type AdminNotificationListItem,
} from "./notifications.service";

@ApiTags("admin-notifications")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller("admin/notifications")
export class AdminNotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.notifications.view)
  @ApiOperation({ summary: "List notifications for the current admin" })
  @ApiOkResponse({ description: "Most recent notifications with per-admin read state" })
  async list(
    @CurrentAdmin() admin: AdminUserWithPermissions,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<AdminNotificationListItem[]> {
    return this.notifications.listForAdmin(admin.id, query.limit ?? 50);
  }

  @Patch(":id/read")
  @RequirePermissions(PERMISSIONS.notifications.view)
  @ApiOperation({ summary: "Mark one notification as read" })
  @ApiOkResponse({ description: "Marked" })
  async markRead(
    @CurrentAdmin() admin: AdminUserWithPermissions,
    @Param("id") id: string,
  ): Promise<{ ok: true }> {
    return this.notifications.markRead(admin.id, id);
  }

  @Post("read-all")
  @RequirePermissions(PERMISSIONS.notifications.view)
  @ApiOperation({ summary: "Mark all notifications as read" })
  @ApiOkResponse({ description: "Count of new read records created" })
  async markAllRead(@CurrentAdmin() admin: AdminUserWithPermissions): Promise<{ marked: number }> {
    return this.notifications.markAllRead(admin.id);
  }
}

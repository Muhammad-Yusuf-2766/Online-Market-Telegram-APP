import { Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AdminUser } from "@prisma/client";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { CurrentAdmin } from "../common/decorators/current-admin.decorator";
import { ListNotificationsQueryDto } from "./dto/list-notifications-query.dto";
import {
  NotificationsService,
  type AdminNotificationListItem,
} from "./notifications.service";

@ApiTags("admin-notifications")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard)
@Controller("admin/notifications")
export class AdminNotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "List notifications for the current admin" })
  @ApiOkResponse({ description: "Most recent notifications with per-admin read state" })
  async list(
    @CurrentAdmin() admin: AdminUser,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<AdminNotificationListItem[]> {
    return this.notifications.listForAdmin(admin.id, query.limit ?? 50);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark one notification as read" })
  @ApiOkResponse({ description: "Marked" })
  async markRead(
    @CurrentAdmin() admin: AdminUser,
    @Param("id") id: string,
  ): Promise<{ ok: true }> {
    return this.notifications.markRead(admin.id, id);
  }

  @Post("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  @ApiOkResponse({ description: "Count of new read records created" })
  async markAllRead(@CurrentAdmin() admin: AdminUser): Promise<{ marked: number }> {
    return this.notifications.markAllRead(admin.id);
  }
}

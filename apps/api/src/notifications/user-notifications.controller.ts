import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import type { User } from "@prisma/client";
import { UserNotificationsService } from "./user-notifications.service";

@ApiTags("user-notifications")
@ApiBearerAuth("user-jwt")
@UseGuards(JwtUserGuard)
@Controller("users/me/notifications")
export class UserNotificationsController {
  constructor(private readonly notifications: UserNotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Paginated in-app notifications for current user" })
  @ApiOkResponse({ description: "Notifications with unreadCount" })
  list(@CurrentUser() user: User, @Query() query: PaginationQueryDto) {
    return this.notifications.listForUser(user.id, query);
  }

  @Post(":id/read")
  markRead(@CurrentUser() user: User, @Param("id") id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Post("read-all")
  markAllRead(@CurrentUser() user: User) {
    return this.notifications.markAllRead(user.id);
  }
}

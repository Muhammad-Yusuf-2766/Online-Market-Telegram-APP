import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { AuthModule } from "../auth/auth.module";
import { AdminNotificationsController } from "./admin-notifications.controller";
import { NotificationsService } from "./notifications.service";
import { UserNotificationsController } from "./user-notifications.controller";
import { UserNotificationsService } from "./user-notifications.service";

@Module({
  imports: [AdminAuthModule, AuthModule],
  controllers: [AdminNotificationsController, UserNotificationsController],
  providers: [NotificationsService, UserNotificationsService],
  exports: [NotificationsService, UserNotificationsService],
})
export class NotificationsModule {}

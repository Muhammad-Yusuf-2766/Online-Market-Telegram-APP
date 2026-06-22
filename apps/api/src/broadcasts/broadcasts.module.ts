import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { TelegramNotifyModule } from "../telegram/telegram-notify.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { BroadcastsController } from "./broadcasts.controller";
import { BroadcastsService } from "./broadcasts.service";

@Module({
  imports: [AdminAuthModule, TelegramNotifyModule, NotificationsModule],
  controllers: [BroadcastsController],
  providers: [BroadcastsService],
})
export class BroadcastsModule {}

import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { SegmentsModule } from "../segments/segments.module";
import { TelegramNotifyModule } from "../telegram/telegram-notify.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { BroadcastsController } from "./broadcasts.controller";
import { BroadcastsService } from "./broadcasts.service";

@Module({
  imports: [AdminAuthModule, SegmentsModule, TelegramNotifyModule, NotificationsModule],
  controllers: [BroadcastsController],
  providers: [BroadcastsService],
})
export class BroadcastsModule {}


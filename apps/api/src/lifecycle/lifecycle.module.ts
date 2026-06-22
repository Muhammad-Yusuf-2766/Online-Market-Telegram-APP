import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { TelegramNotifyModule } from "../telegram/telegram-notify.module";
import { LifecycleService } from "./lifecycle.service";

@Module({
  imports: [ScheduleModule.forRoot(), TelegramNotifyModule],
  providers: [LifecycleService],
})
export class LifecycleModule {}


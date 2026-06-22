import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TelegramNotifyModule } from "../telegram/telegram-notify.module";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [AuthModule, TelegramNotifyModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

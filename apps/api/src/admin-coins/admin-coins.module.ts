import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { TelegramNotifyModule } from "../telegram/telegram-notify.module";
import { AdminCoinsController } from "./admin-coins.controller";
import { AdminCoinsService } from "./admin-coins.service";

@Module({
  imports: [PrismaModule, AdminAuthModule, TelegramNotifyModule],
  controllers: [AdminCoinsController],
  providers: [AdminCoinsService],
  exports: [AdminCoinsService],
})
export class AdminCoinsModule {}

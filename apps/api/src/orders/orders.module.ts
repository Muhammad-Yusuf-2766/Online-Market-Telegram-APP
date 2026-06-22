import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { AuthModule } from "../auth/auth.module";
import { CoinsModule } from "../coins/coins.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { TelegramNotifyModule } from "../telegram/telegram-notify.module";
import { PromotionsModule } from "../promotions/promotions.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AdminOrdersController } from "./admin-orders.controller";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [
    AuthModule,
    AdminAuthModule,
    RealtimeModule,
    TelegramNotifyModule,
    CoinsModule,
    PromotionsModule,
    NotificationsModule,
  ],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

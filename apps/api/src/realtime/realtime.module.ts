import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AdminOrdersGateway } from "./admin-orders.gateway";
import { OrderEventsService } from "./order-events.service";
import { UserOrdersGateway } from "./user-orders.gateway";

@Module({
  imports: [AdminAuthModule, AuthModule, NotificationsModule],
  providers: [AdminOrdersGateway, UserOrdersGateway, OrderEventsService],
  exports: [OrderEventsService],
})
export class RealtimeModule {}

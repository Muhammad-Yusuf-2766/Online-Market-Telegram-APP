import { Injectable, Logger } from "@nestjs/common";
import { NotificationsService } from "../notifications/notifications.service";
import { AdminOrdersGateway } from "./admin-orders.gateway";
import type { OrdersChangedPayload } from "./order-events.types";
import { UserOrdersGateway } from "./user-orders.gateway";

@Injectable()
export class OrderEventsService {
  private readonly log = new Logger(OrderEventsService.name);

  constructor(
    private readonly gateway: AdminOrdersGateway,
    private readonly userGateway: UserOrdersGateway,
    private readonly notifications: NotificationsService,
  ) {}

  async notifyOrdersChanged(payload: OrdersChangedPayload): Promise<void> {
    this.gateway.notifyOrdersChanged(payload);
    this.userGateway.emitOrderEvent(payload.userId, {
      orderId: payload.orderId,
      status: payload.status,
      updatedAt: payload.updatedAt,
      reason: payload.reason,
    });
    try {
      const notification = await this.notifications.createFromOrderReason(
        payload.orderId,
        payload.reason,
      );
      this.gateway.emitNotificationNew({
        id: notification.id,
        kind: notification.kind,
        orderId: notification.orderId,
        createdAt: notification.createdAt.toISOString(),
      });
    } catch (err) {
      this.log.warn(
        `Admin notification not persisted (${payload.reason} order ${payload.orderId}). Run prisma migrations if tables are missing.`,
        err instanceof Error ? err.stack : err,
      );
    }
  }

  async notifyProductStockChanged(
    productId: string,
    payload: { stockQuantity: number },
  ): Promise<void> {
    this.userGateway.emitProductStock({ productId, stockQuantity: payload.stockQuantity });
  }
}

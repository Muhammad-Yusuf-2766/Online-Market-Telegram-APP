import { Test } from "@nestjs/testing";
import { NotificationsService } from "../notifications/notifications.service";
import { AdminOrdersGateway } from "./admin-orders.gateway";
import { UserOrdersGateway } from "./user-orders.gateway";
import { OrderEventsService } from "./order-events.service";

describe("OrderEventsService", () => {
  let service: OrderEventsService;
  let adminGateway: {
    notifyOrdersChanged: jest.Mock;
    emitNotificationNew: jest.Mock;
  };
  let userGateway: {
    emitOrderEvent: jest.Mock;
    emitProductStock: jest.Mock;
  };
  let notifications: { createFromOrderReason: jest.Mock };

  beforeEach(async () => {
    adminGateway = {
      notifyOrdersChanged: jest.fn(),
      emitNotificationNew: jest.fn(),
    };
    userGateway = {
      emitOrderEvent: jest.fn(),
      emitProductStock: jest.fn(),
    };
    notifications = {
      createFromOrderReason: jest.fn().mockResolvedValue({
        id: "an1",
        kind: "ORDER_UPDATED",
        orderId: "ord1",
        createdAt: new Date("2024-06-01T12:00:00.000Z"),
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderEventsService,
        { provide: AdminOrdersGateway, useValue: adminGateway },
        { provide: UserOrdersGateway, useValue: userGateway },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();
    service = moduleRef.get(OrderEventsService);
  });

  it("notifyOrdersChanged fans out to gateways and persists admin notification", async () => {
    await service.notifyOrdersChanged({
      orderId: "ord1",
      userId: "user1",
      status: "CONFIRMED",
      updatedAt: "2024-01-01T00:00:00.000Z",
      reason: "updated",
    });

    expect(adminGateway.notifyOrdersChanged).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "ord1", userId: "user1" }),
    );
    expect(userGateway.emitOrderEvent).toHaveBeenCalledWith("user1", {
      orderId: "ord1",
      status: "CONFIRMED",
      updatedAt: "2024-01-01T00:00:00.000Z",
      reason: "updated",
    });
    expect(notifications.createFromOrderReason).toHaveBeenCalledWith("ord1", "updated");
    expect(adminGateway.emitNotificationNew).toHaveBeenCalledWith({
      id: "an1",
      kind: "ORDER_UPDATED",
      orderId: "ord1",
      createdAt: "2024-06-01T12:00:00.000Z",
    });
  });

  it("notifyOrdersChanged continues when admin notification fails", async () => {
    notifications.createFromOrderReason.mockRejectedValue(new Error("db down"));
    await service.notifyOrdersChanged({
      orderId: "ord2",
      userId: "user2",
      status: "PENDING",
      updatedAt: "2024-01-02T00:00:00.000Z",
      reason: "created",
    });
    expect(adminGateway.notifyOrdersChanged).toHaveBeenCalled();
    expect(userGateway.emitOrderEvent).toHaveBeenCalled();
    expect(adminGateway.emitNotificationNew).not.toHaveBeenCalled();
  });

  it("notifyProductStockChanged forwards payload to user gateway", async () => {
    await service.notifyProductStockChanged("prod-1", { stock: 3, stockGrams: null });
    expect(userGateway.emitProductStock).toHaveBeenCalledWith({
      productId: "prod-1",
      stock: 3,
      stockGrams: null,
    });
  });
});

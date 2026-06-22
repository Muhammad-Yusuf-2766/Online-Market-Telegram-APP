import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { Test } from "@nestjs/testing";
import { CoinsService } from "../coins/coins.service";
import { UserNotificationsService } from "../notifications/user-notifications.service";
import { PromotionsService } from "../promotions/promotions.service";
import { PrismaService } from "../prisma/prisma.service";
import { OrderEventsService } from "../realtime/order-events.service";
import { TelegramNotifyService } from "../telegram/telegram-notify.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { OrdersService } from "./orders.service";

describe("OrdersService", () => {
  let service: OrdersService;
  let prisma: PrismaMock;
  let coinsService: jest.Mocked<
    Pick<CoinsService, "debitCheckoutSpend" | "refundOrderCoinsIfNeeded" | "tryReferralPayoutOnOrderQualifying">
  >;
  let promotions: jest.Mocked<Pick<PromotionsService, "validate">>;
  let orderEvents: jest.Mocked<Pick<OrderEventsService, "notifyOrdersChanged" | "notifyProductStockChanged">>;
  let telegramNotify: jest.Mocked<Pick<TelegramNotifyService, "notifyOrderStatusChanged" | "notifyCoinsCredit">>;
  let userNotifications: jest.Mocked<Pick<UserNotificationsService, "create">>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    coinsService = {
      debitCheckoutSpend: jest.fn().mockResolvedValue(undefined),
      refundOrderCoinsIfNeeded: jest.fn().mockResolvedValue(undefined),
      tryReferralPayoutOnOrderQualifying: jest.fn().mockResolvedValue(null),
    };
    promotions = { validate: jest.fn() };
    orderEvents = {
      notifyOrdersChanged: jest.fn().mockResolvedValue(undefined),
      notifyProductStockChanged: jest.fn().mockResolvedValue(undefined),
    };
    telegramNotify = {
      notifyOrderStatusChanged: jest.fn().mockResolvedValue(undefined),
      notifyCoinsCredit: jest.fn().mockResolvedValue(undefined),
    };
    userNotifications = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    prisma.$transaction.mockImplementation(async (fn: (tx: PrismaMock) => Promise<unknown>) => fn(prisma));

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: OrderEventsService, useValue: orderEvents },
        { provide: TelegramNotifyService, useValue: telegramNotify },
        { provide: CoinsService, useValue: coinsService },
        { provide: PromotionsService, useValue: promotions },
        { provide: UserNotificationsService, useValue: userNotifications },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  describe("createForUser", () => {
    it("requires latitude and longitude together", async () => {
      await expect(
        service.createForUser("u1", {
          items: [{ productId: "p1", quantity: 1 }],
          deliveryLatitude: 41.3,
        } as never),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("throws when one or more products cannot be loaded", async () => {
      prisma.product.findMany.mockResolvedValueOnce([
        {
          id: "p1",
          title: "A",
          priceUzs: 1000,
          sizes: null,
          stockGrams: null,
          stock: 10,
        },
      ] as never);

      await expect(
        service.createForUser("u1", {
          items: [
            { productId: "p1", quantity: 1 },
            { productId: "missing", quantity: 1 },
          ],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("creates order lines and notifies realtime listeners", async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: "p1",
          title: "Perfume",
          priceUzs: 8000,
          sizes: null,
          stockGrams: null,
          stock: 5,
        },
      ] as never);
      prisma.productSizePreset.findMany.mockResolvedValue([]);
      prisma.user.findUniqueOrThrow.mockResolvedValue({ coinBalance: 0 } as never);
      prisma.user.update.mockResolvedValue({} as never);
      prisma.order.create.mockResolvedValue({
        id: "order-1",
        userId: "u1",
        status: OrderStatus.PENDING,
        subtotalUzs: 8000,
        totalUzs: 8000,
        coinsAppliedUzs: 0,
        cashPaidUzs: 8000,
        discountUzs: 0,
        promoCodeId: null,
        updatedAt: new Date(),
      } as never);
      prisma.cart.findUnique.mockResolvedValue(null);
      prisma.orderItem.create.mockResolvedValue({
        id: "oi1",
        orderId: "order-1",
        productId: "p1",
        quantity: 1,
        unitPriceUzs: 8000,
        titleSnapshot: "Perfume",
      } as never);
      prisma.stockMovement.create.mockResolvedValue({} as never);
      prisma.analyticsEvent.create.mockResolvedValue({} as never);
      prisma.product.findMany.mockResolvedValueOnce([
        {
          id: "p1",
          title: "Perfume",
          priceUzs: 8000,
          sizes: null,
          stockGrams: null,
          stock: 5,
        },
      ] as never).mockResolvedValueOnce([{ id: "p1", stock: 4, stockGrams: null }] as never);

      const created = await service.createForUser("u1", {
        items: [{ productId: "p1", quantity: 1 }],
      });

      expect(created.id).toBe("order-1");
      expect(coinsService.debitCheckoutSpend).toHaveBeenCalled();
      expect(prisma.analyticsEvent.create).toHaveBeenCalled();
      expect(orderEvents.notifyOrdersChanged).toHaveBeenCalledWith(
        expect.objectContaining({ reason: "created", orderId: "order-1" }),
      );
      expect(orderEvents.notifyProductStockChanged).toHaveBeenCalledWith(
        "p1",
        expect.objectContaining({ stock: 4 }),
      );
    });
  });

  describe("cancelForUser", () => {
    it("throws when order does not exist", async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.cancelForUser("u1", "missing")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws when order belongs to another user", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: "o1",
        userId: "other",
        status: OrderStatus.PENDING,
        items: [],
      } as never);

      await expect(service.cancelForUser("u1", "o1")).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("throws when order is not pending", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: "o1",
        userId: "u1",
        status: OrderStatus.CONFIRMED,
        items: [],
      } as never);

      await expect(service.cancelForUser("u1", "o1")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("delegates cancellation to updateStatus", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: "o1",
        userId: "u1",
        status: OrderStatus.PENDING,
        items: [],
      } as never);

      const updatedOrder = {
        id: "o1",
        userId: "u1",
        status: OrderStatus.CANCELLED,
      };
      jest.spyOn(service, "updateStatus").mockResolvedValue(updatedOrder as never);
      jest.spyOn(service, "getForUser").mockResolvedValue({ ...updatedOrder, items: [] } as never);

      const result = await service.cancelForUser("u1", "o1");

      expect(service.updateStatus).toHaveBeenCalledWith("o1", OrderStatus.CANCELLED);
      expect(service.getForUser).toHaveBeenCalledWith("u1", "o1");
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });
  });

  describe("updateStatus", () => {
    it("throws when order cannot be found", async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus("missing", OrderStatus.CONFIRMED)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("returns immediately when status is unchanged", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: "o1",
        userId: "u1",
        status: OrderStatus.SHIPPED,
        updatedAt: new Date(),
        user: { telegramId: "tg", locale: "en" },
        items: [{ product: { images: [] } }],
      } as never);

      const order = await service.updateStatus("o1", OrderStatus.SHIPPED);

      expect(order.status).toBe(OrderStatus.SHIPPED);
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(telegramNotify.notifyOrderStatusChanged).not.toHaveBeenCalled();
    });

    it("runs workflow when transitioning statuses", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: "o1",
        userId: "u1",
        status: OrderStatus.PENDING,
        updatedAt: new Date(),
        user: { telegramId: "tg", locale: "ru" },
        items: [{ product: { images: ["img.png"] } }],
      } as never);

      prisma.order.update.mockResolvedValue({
        id: "o1",
        userId: "u1",
        status: OrderStatus.CONFIRMED,
        updatedAt: new Date(),
      } as never);

      const updated = await service.updateStatus("o1", OrderStatus.CONFIRMED);

      expect(updated.status).toBe(OrderStatus.CONFIRMED);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(coinsService.tryReferralPayoutOnOrderQualifying).toHaveBeenCalled();
      expect(orderEvents.notifyOrdersChanged).toHaveBeenCalled();
      expect(telegramNotify.notifyOrderStatusChanged).toHaveBeenCalledWith(
        "tg",
        "o1",
        OrderStatus.CONFIRMED,
        "ru",
        "img.png",
      );
      expect(userNotifications.create).toHaveBeenCalled();
    });
  });
});

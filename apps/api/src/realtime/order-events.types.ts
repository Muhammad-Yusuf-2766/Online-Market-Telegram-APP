import type { OrderStatus } from "@prisma/client";

export type OrdersChangedPayload = {
  reason: "created" | "updated";
  orderId: string;
  userId: string;
  status: OrderStatus;
  updatedAt: string;
};

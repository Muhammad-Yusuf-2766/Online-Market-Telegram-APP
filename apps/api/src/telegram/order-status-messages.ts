import type { OrderStatus } from "@prisma/client";
import type { AppLocale } from "../common/locale.util";

/** Visual status cue in chat (Telegram messages cannot use custom text colors). */
const STATUS_EMOJI: Record<OrderStatus, string> = {
  PENDING: "🟡",
  CONFIRMED: "🔵",
  SHIPPED: "🟣",
  DELIVERED: "🟢",
  CANCELLED: "🔴",
};

const STATUS_LABEL: Record<AppLocale, Record<OrderStatus, string>> = {
  ru: {
    PENDING: "Ожидает обработки",
    CONFIRMED: "Подтверждён",
    SHIPPED: "Отправлен",
    DELIVERED: "Доставлен",
    CANCELLED: "Отменён",
  },
  uz: {
    PENDING: "Kutilmoqda",
    CONFIRMED: "Tasdiqlangan",
    SHIPPED: "Yo‘lda",
    DELIVERED: "Yetkazilgan",
    CANCELLED: "Bekor qilingan",
  },
};

const COPY: Record<AppLocale, { title: string; orderLine: string; newStatusLine: string; openOrder: string }> = {
  ru: {
    title: "Статус заказа обновлён",
    orderLine: "Заказ:",
    newStatusLine: "Новый статус:",
    openOrder: "Открыть заказ",
  },
  uz: {
    title: "Buyurtma holati yangilandi",
    orderLine: "Buyurtma:",
    newStatusLine: "Yangi holat:",
    openOrder: "Buyurtmani ochish",
  },
};

export function buildOrderStatusNotifyContent(
  locale: AppLocale,
  orderId: string,
  status: OrderStatus,
): { textLines: string[]; openOrderLabel: string } {
  const c = COPY[locale];
  const statusLabel = STATUS_LABEL[locale][status];
  const emoji = STATUS_EMOJI[status];
  return {
    textLines: [
      c.title,
      "",
      `${c.orderLine} ${orderId}`,
      `${c.newStatusLine} ${emoji} ${statusLabel}`,
    ],
    openOrderLabel: c.openOrder,
  };
}

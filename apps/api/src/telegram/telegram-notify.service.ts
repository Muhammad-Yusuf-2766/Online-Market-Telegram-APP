import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { OrderStatus } from "@prisma/client";
import { buildOrderStatusNotifyContent } from "./order-status-messages";
import { resolveTelegramImageUrl } from "./resolve-telegram-image-url";

@Injectable()
export class TelegramNotifyService {
  private readonly log = new Logger(TelegramNotifyService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Public HTTPS base URL of the Mini App (same URL as in BotFather Web App settings).
   * Must use HTTPS for Telegram `web_app` buttons (localhost ok only for narrow bot-api testing).
   */
  private orderDetailUrl(orderId: string): string | undefined {
    const raw = this.config.get<string>("TELEGRAM_WEB_APP_URL")?.trim();
    if (!raw) {
      return undefined;
    }
    const base = raw.replace(/\/$/, "");
    return `${base}/orders/${encodeURIComponent(orderId)}`;
  }

  /**
   * Sends an Uzbek status message with optional product photo (`sendPhoto`) and Mini App button.
   * `productImageRaw` is the first image from DB (URL or MinIO key).
   */
  async notifyOrderStatusChanged(
    telegramId: string,
    orderId: string,
    status: OrderStatus,
    _userLocale: string | null | undefined,
    productImageRaw?: string | null,
  ): Promise<void> {
    const token = this.config.get<string>("TELEGRAM_BOT_TOKEN");
    if (!token) {
      this.log.debug("TELEGRAM_BOT_TOKEN not set; skip Telegram order notification");
      return;
    }

    const { textLines, openOrderLabel } = buildOrderStatusNotifyContent("uz", orderId, status);

    const detailUrl = this.orderDetailUrl(orderId);
    const lines = [...textLines];
    if (detailUrl) {
      lines.push("", `<a href="${escapeHtmlAttr(detailUrl)}">${escapeHtmlText(openOrderLabel)}</a>`);
    }

    const bodyText = lines.join("\n");
    const replyMarkup =
      detailUrl ?
        {
          inline_keyboard: [[{ text: openOrderLabel, web_app: { url: detailUrl } }]],
        }
      : undefined;

    if (!detailUrl) {
      this.log.debug(
        "TELEGRAM_WEB_APP_URL not set; order notification has no order link (set TELEGRAM_WEB_APP_URL for links)",
      );
    }

    const photoUrl = resolveTelegramImageUrl(productImageRaw ?? undefined, this.config);

    try {
      if (photoUrl && /^https?:\/\//i.test(photoUrl)) {
        const photoPayload: Record<string, unknown> = {
          chat_id: telegramId,
          photo: photoUrl,
          caption: bodyText,
          ...(detailUrl ? { parse_mode: "HTML", reply_markup: replyMarkup } : {}),
        };
        const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(photoPayload),
        });
        if (res.ok) {
          return;
        }
        const errBody = await res.text();
        this.log.warn(`Telegram sendPhoto failed (${photoUrl.slice(0, 80)}…): ${res.status} ${errBody}`);
      }

      const payload: Record<string, unknown> = {
        chat_id: telegramId,
        text: bodyText,
      };

      if (detailUrl) {
        payload.parse_mode = "HTML";
        payload.reply_markup = replyMarkup;
      }

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.text();
        this.log.warn(`Telegram sendMessage failed: ${res.status} ${body}`);
      }
    } catch (err) {
      this.log.warn(
        `Telegram notify error for order ${orderId}`,
        err instanceof Error ? err.stack : err,
      );
    }
  }

  async sendPlainText(telegramId: string, text: string): Promise<void> {
    const token = this.config.get<string>("TELEGRAM_BOT_TOKEN");
    if (!token) return;
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: telegramId, text }),
      });
      if (!res.ok) {
        const body = await res.text();
        this.log.warn(`Telegram plain message failed: ${res.status} ${body}`);
      }
    } catch (error) {
      this.log.warn("Telegram plain message error", error instanceof Error ? error.stack : String(error));
    }
  }
}

/** Escape for `href="…"`. */
function escapeHtmlAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

/** Escape for link text (Telegram HTML). */
function escapeHtmlText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

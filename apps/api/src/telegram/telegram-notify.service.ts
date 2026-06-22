import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { OrderStatus } from "@prisma/client";
import { normalizeUserLocale } from "../common/locale.util";
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
   * Sends a message in the user’s locale (`ru` | `uz`) with optional product photo
   * (`sendPhoto`) and Mini App button. `productImageRaw` is the first image from DB (URL or MinIO key).
   */
  async notifyOrderStatusChanged(
    telegramId: string,
    orderId: string,
    status: OrderStatus,
    userLocale: string | null | undefined,
    productImageRaw?: string | null,
  ): Promise<void> {
    const token = this.config.get<string>("TELEGRAM_BOT_TOKEN");
    if (!token) {
      this.log.debug("TELEGRAM_BOT_TOKEN not set; skip Telegram order notification");
      return;
    }

    const lang = normalizeUserLocale(userLocale);
    const { textLines, openOrderLabel } = buildOrderStatusNotifyContent(lang, orderId, status);

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

  async notifyCoinGift(
    telegramId: string,
    title: string,
    description: string,
    imageRaw: string | null | undefined,
    coins: number,
    userLocale: string | null | undefined,
  ): Promise<void> {
    const token = this.config.get<string>("TELEGRAM_BOT_TOKEN");
    if (!token) {
      this.log.debug("TELEGRAM_BOT_TOKEN not set; skip coin gift notification");
      return;
    }

    const lang = normalizeUserLocale(userLocale);
    const bodyLines =
      lang === "ru" ?
        [`🎁 <b>${escapeHtmlText(title)}</b>`, "", `+${coins} монет`, description ? escapeHtmlText(description) : ""]
      : [`🎁 <b>${escapeHtmlText(title)}</b>`, "", `+${coins} tangalar`, description ? escapeHtmlText(description) : ""];
    const bodyText = bodyLines.filter(Boolean).join("\n");

    const photoUrl = resolveTelegramImageUrl(imageRaw ?? undefined, this.config);

    try {
      if (photoUrl && /^https?:\/\//i.test(photoUrl)) {
        const photoPayload: Record<string, unknown> = {
          chat_id: telegramId,
          photo: photoUrl,
          caption: bodyText,
          parse_mode: "HTML",
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
        this.log.warn(`Telegram coin gift sendPhoto failed: ${res.status} ${errBody}`);
      }

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramId,
          text: bodyText,
          parse_mode: "HTML",
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        this.log.warn(`Telegram coin gift sendMessage failed: ${res.status} ${body}`);
      }
    } catch (err) {
      this.log.warn(`Telegram coin gift error`, err instanceof Error ? err.stack : err);
    }
  }

  /**
   * Sends a chat message when coins are credited (referral, profile bonuses, admin adjustment).
   */
  async notifyCoinsCredit(
    telegramId: string,
    delta: number,
    userLocale: string | null | undefined,
    kind: "referral" | "profile" | "adjust",
    profileReason?: string,
  ): Promise<void> {
    const token = this.config.get<string>("TELEGRAM_BOT_TOKEN");
    if (!token) {
      this.log.debug("TELEGRAM_BOT_TOKEN not set; skip coin credit notification");
      return;
    }
    if (delta === 0) {
      return;
    }

    const lang = normalizeUserLocale(userLocale);
    const abs = Math.abs(delta);
    const sign = delta > 0 ? "+" : "−";

    let bodyText: string;
    if (kind === "referral") {
      bodyText =
        lang === "ru" ?
          `🪙 <b>${sign}${abs}</b> монет за реферала (первый подтверждённый заказ друга).`
        : `🪙 <b>${sign}${abs}</b> tanga — referal (do‘stning birinchi tasdiqlangan buyurtmasi).`;
    } else if (kind === "adjust") {
      bodyText =
        delta > 0 ?
          lang === "ru" ?
            `🪙 На баланс начислено <b>+${abs}</b> монет (корректировка).`
          : `🪙 Balansga <b>+${abs}</b> tanga qo‘shildi (tuzatish).`
        : lang === "ru" ?
          `🪙 С баланса списано <b>${abs}</b> монет (корректировка).`
        : `🪙 Balansdan <b>${abs}</b> tanga yechildi (tuzatish).`;
    } else {
      const reason = profileReason ?? "";
      if (reason === "fullProfile") {
        bodyText =
          lang === "ru" ?
            `🎉 Полный профиль! <b>+${abs}</b> монет.`
          : `🎉 To‘liq profil! <b>+${abs}</b> tanga.`;
      } else if (reason === "lastName") {
        bodyText =
          lang === "ru" ?
            `🪙 Бонус за фамилию в профиле: <b>+${abs}</b> монет.`
          : `🪙 Familiya uchun bonus: <b>+${abs}</b> tanga.`;
      } else if (reason === "birthDate") {
        bodyText =
          lang === "ru" ?
            `🪙 Бонус за день рождения: <b>+${abs}</b> монет.`
          : `🪙 Tug‘ilgan kun uchun bonus: <b>+${abs}</b> tanga.`;
      } else if (reason === "gender") {
        bodyText =
          lang === "ru" ?
            `🪙 Бонус за указание пола: <b>+${abs}</b> монет.`
          : `🪙 Jins uchun bonus: <b>+${abs}</b> tanga.`;
      } else {
        bodyText =
          lang === "ru" ?
            `🪙 Бонус за профиль: <b>+${abs}</b> монет.`
          : `🪙 Profil bonusi: <b>+${abs}</b> tanga.`;
      }
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramId,
          text: bodyText,
          parse_mode: "HTML",
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        this.log.warn(`Telegram coin credit sendMessage failed: ${res.status} ${body}`);
      }
    } catch (err) {
      this.log.warn(`Telegram coin credit error`, err instanceof Error ? err.stack : err);
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

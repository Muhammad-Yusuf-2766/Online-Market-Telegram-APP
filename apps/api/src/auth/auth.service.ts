import { createHmac, timingSafeEqual } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { User } from "@prisma/client";
import { normalizeUserLocale } from "../common/locale.util";
import { PrismaService } from "../prisma/prisma.service";

type TelegramWebAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  async authenticateTelegram(initDataRaw: string): Promise<{ accessToken: string; expiresIn: number; user: User }> {
    const botToken = this.config.get<string>("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      throw new UnauthorizedException("Telegram bot token is not configured");
    }

    const params = this.parseInitData(initDataRaw);
    const receivedHash = params.get("hash");
    if (!receivedHash) {
      throw new UnauthorizedException("Missing hash in initData");
    }

    const dataCheckString = this.buildDataCheckString(params);
    const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
    const computed = createHmac("sha256", secretKey).update(dataCheckString).digest();

    const received = Buffer.from(receivedHash, "hex");
    if (received.length !== computed.length || !timingSafeEqual(received, computed)) {
      throw new UnauthorizedException("Invalid Telegram initData signature");
    }

    const authDateRaw = params.get("auth_date");
    const authDate = authDateRaw ? Number(authDateRaw) * 1000 : 0;
    const maxAgeSec = Number(this.config.get<string>("TELEGRAM_INIT_DATA_MAX_AGE_SEC") ?? 86400);
    if (authDate && Date.now() - authDate > maxAgeSec * 1000) {
      throw new UnauthorizedException("Telegram initData is too old");
    }

    const userJson = params.get("user");
    if (!userJson) {
      throw new UnauthorizedException("Missing user in initData");
    }

    let tgUser: TelegramWebAppUser;
    try {
      tgUser = JSON.parse(userJson) as TelegramWebAppUser;
    } catch {
      throw new UnauthorizedException("Invalid user payload in initData");
    }

    const telegramId = String(tgUser.id);
    const locale = normalizeUserLocale(tgUser.language_code);
    const user = await this.prisma.user.upsert({
      where: { telegramId },
      create: {
        telegramId,
        telegramUsername: tgUser.username ?? null,
        firstName: tgUser.first_name ?? null,
        lastName: tgUser.last_name ?? null,
        locale,
      },
      update: {
        telegramUsername: tgUser.username ?? null,
        firstName: tgUser.first_name ?? null,
        lastName: tgUser.last_name ?? null,
        locale,
      },
    });

    const freshUser = await this.prisma.user.findUniqueOrThrow({ where: { telegramId } });

    const expiresIn = this.parseExpiresIn(this.config.get<string>("JWT_EXPIRES_IN") ?? "7d");
    const accessToken = await this.jwt.signAsync({
      sub: freshUser.id,
      typ: "user",
    });

    return { accessToken, expiresIn, user: freshUser };
  }

  private parseInitData(raw: string): Map<string, string> {
    const map = new Map<string, string>();
    const searchParams = new URLSearchParams(raw);
    for (const [key, value] of searchParams.entries()) {
      map.set(key, value);
    }
    return map;
  }

  private buildDataCheckString(params: Map<string, string>): string {
    const pairs = [...params.entries()]
      .filter(([k]) => k !== "hash")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`);
    return pairs.join("\n");
  }

  /** Parses `7d`, `24h`, `3600` (seconds) into seconds for API consumers. */
  private parseExpiresIn(value: string): number {
    const m = /^(\d+)([smhd])$/i.exec(value.trim());
    if (m) {
      const n = Number(m[1]);
      const u = m[2].toLowerCase();
      const mult = u === "s" ? 1 : u === "m" ? 60 : u === "h" ? 3600 : 86400;
      return n * mult;
    }
    const asNum = Number(value);
    if (!Number.isNaN(asNum) && asNum > 0) {
      return asNum;
    }
    return 604800;
  }
}

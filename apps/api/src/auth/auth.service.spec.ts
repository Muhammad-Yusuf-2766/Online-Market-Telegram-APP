import { createHmac } from "node:crypto";
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { AuthService } from "./auth.service";

const BOT_TOKEN = "test-bot-token";

function buildInitData(user: object, extra: Record<string, string> = {}): string {
  const authDate = String(Math.floor(Date.now() / 1000));
  const params = new URLSearchParams({
    auth_date: authDate,
    user: JSON.stringify(user),
    ...extra,
  });
  const pairs = [...params.entries()]
    .filter(([k]) => k !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`);
  const dataCheckString = pairs.join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

describe("AuthService", () => {
  let service: AuthService;
  let prisma: PrismaMock;
  let jwt: jest.Mocked<Pick<JwtService, "signAsync">>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    jwt = { signAsync: jest.fn().mockResolvedValue("jwt-token") };
    const config = {
      get: jest.fn((key: string) => {
        if (key === "TELEGRAM_BOT_TOKEN") return BOT_TOKEN;
        if (key === "TELEGRAM_INIT_DATA_MAX_AGE_SEC") return "86400";
        if (key === "JWT_EXPIRES_IN") return "7d";
        return undefined;
      }),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it("rejects initData without hash", async () => {
    await expect(service.authenticateTelegram("auth_date=1&user=%7B%22id%22%3A1%7D")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("authenticates valid Telegram initData and issues JWT", async () => {
    const initData = buildInitData({ id: 12345, first_name: "Test", language_code: "ru" });
    const user = {
      id: "user-1",
      telegramId: "12345",
      locale: "ru",
    };
    prisma.user.upsert.mockResolvedValue(user as never);
    prisma.user.findUniqueOrThrow.mockResolvedValue(user as never);

    const result = await service.authenticateTelegram(initData);

    expect(result.accessToken).toBe("jwt-token");
    expect(result.user.telegramId).toBe("12345");
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: "user-1", typ: "user" });
  });

  it("applies referral start_param on first touch", async () => {
    const initData = buildInitData({ id: 99 }, { start_param: "ref_ABC123" });
    prisma.user.upsert.mockResolvedValue({ id: "user-99", telegramId: "99" } as never);
    prisma.user.findUniqueOrThrow.mockResolvedValue({ id: "user-99", telegramId: "99" } as never);
    prisma.user.findUnique.mockResolvedValue({ id: "referrer-1", telegramId: "1" } as never);
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    await service.authenticateTelegram(initData);

    expect(prisma.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-99", referredByUserId: null },
        data: { referredByUserId: "referrer-1" },
      }),
    );
  });
});

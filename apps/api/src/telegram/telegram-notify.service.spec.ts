import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { TelegramNotifyService } from "./telegram-notify.service";

describe("TelegramNotifyService", () => {
  let service: TelegramNotifyService;
  let config: { get: jest.Mock };

  const origFetch = global.fetch;

  beforeEach(async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => "",
    });

    config = {
      get: jest.fn((key: string) => {
        if (key === "TELEGRAM_BOT_TOKEN") return "fake-token";
        if (key === "TELEGRAM_WEB_APP_URL") return "https://app.example.com";
        return undefined;
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [TelegramNotifyService, { provide: ConfigService, useValue: config }],
    }).compile();
    service = moduleRef.get(TelegramNotifyService);
  });

  afterEach(() => {
    global.fetch = origFetch;
  });

  it("sendPlainText returns early without token", async () => {
    config.get.mockImplementation(() => undefined);
    const fresh = await Test.createTestingModule({
      providers: [TelegramNotifyService, { provide: ConfigService, useValue: config }],
    }).compile();
    const svc = fresh.get(TelegramNotifyService);
    await svc.sendPlainText("123", "hello");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sendPlainText posts to Telegram sendMessage", async () => {
    await service.sendPlainText("999", "Hello world");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.telegram.org/botfake-token/sendMessage",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: "999", text: "Hello world" }),
      }),
    );
  });

  it("notifyOrderStatusChanged skips network when token missing", async () => {
    config.get.mockImplementation(() => undefined);
    const fresh = await Test.createTestingModule({
      providers: [TelegramNotifyService, { provide: ConfigService, useValue: config }],
    }).compile();
    const svc = fresh.get(TelegramNotifyService);
    await svc.notifyOrderStatusChanged("tg", "ord-x", "PENDING", "uz", null);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("notifyOrderStatusChanged sends sendMessage for text-only path", async () => {
    await service.notifyOrderStatusChanged("tg1", "ord-1", "CONFIRMED", "uz", null);
    const calls = jest.mocked(global.fetch).mock.calls;
    const sendMessage = calls.find((c) => String(c[0]).includes("sendMessage"));
    expect(sendMessage).toBeDefined();
    const body = JSON.parse((sendMessage![1] as RequestInit).body as string);
    expect(body.chat_id).toBe("tg1");
    expect(body.text).toContain("ord-1");
  });

  it("notifyCoinsCredit returns early when delta is zero", async () => {
    await service.notifyCoinsCredit("tg1", 0, "uz", "referral");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

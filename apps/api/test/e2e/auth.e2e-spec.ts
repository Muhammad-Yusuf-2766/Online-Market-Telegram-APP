import request from "supertest";
import { closeTestingApp, createTestingApp, resetTestingDb, type TestingApp } from "../setup/app-factory";

describe("Auth (e2e)", () => {
  let ctx: TestingApp;

  beforeAll(async () => {
    ctx = await createTestingApp();
  });

  beforeEach(async () => {
    await resetTestingDb(ctx.prisma);
  });

  afterAll(async () => {
    await closeTestingApp(ctx);
  });

  it("POST /auth/telegram creates user and returns JWT", async () => {
    const res = await request(ctx.app.getHttpServer())
      .post("/auth/telegram")
      .send({ initDataRaw: "tg-e2e-user-42" })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.telegramId).toBe("tg-e2e-user-42");

    const userCount = await ctx.prisma.user.count({ where: { telegramId: "tg-e2e-user-42" } });
    expect(userCount).toBe(1);
  });

  it("POST /auth/telegram is idempotent for same telegram id", async () => {
    await request(ctx.app.getHttpServer())
      .post("/auth/telegram")
      .send({ initDataRaw: "tg-e2e-dup" })
      .expect(201);
    await request(ctx.app.getHttpServer())
      .post("/auth/telegram")
      .send({ initDataRaw: "tg-e2e-dup" })
      .expect(201);

    expect(await ctx.prisma.user.count({ where: { telegramId: "tg-e2e-dup" } })).toBe(1);
  });
});

import request from "supertest";
import { closeTestingApp, createTestingApp, resetTestingDb, type TestingApp } from "../setup/app-factory";

describe("Health (e2e)", () => {
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

  it("GET /health returns 200 when database is up", async () => {
    const res = await request(ctx.app.getHttpServer()).get("/health").expect(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.info.database.status).toBe("up");
  });
});

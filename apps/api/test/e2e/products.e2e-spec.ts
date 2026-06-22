import request from "supertest";
import { closeTestingApp, createTestingApp, resetTestingDb, type TestingApp } from "../setup/app-factory";
import { seedE2eProduct } from "../setup/e2e-fixtures";

describe("Products (e2e)", () => {
  let ctx: TestingApp;

  beforeAll(async () => {
    ctx = await createTestingApp();
  });

  beforeEach(async () => {
    await resetTestingDb(ctx.prisma);
    await seedE2eProduct(ctx.prisma);
  });

  afterAll(async () => {
    await closeTestingApp(ctx);
  });

  it("GET /products lists catalog", async () => {
    const res = await request(ctx.app.getHttpServer()).get("/products").expect(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].title).toBe("E2E Test Perfume");
  });

  it("GET /products/:id returns product detail", async () => {
    const list = await request(ctx.app.getHttpServer()).get("/products").expect(200);
    const id = list.body.items[0].id;
    const detail = await request(ctx.app.getHttpServer()).get(`/products/${id}`).expect(200);
    expect(detail.body.id).toBe(id);
  });
});

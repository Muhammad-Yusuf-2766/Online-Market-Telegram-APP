import request from "supertest";
import { authHeader, signUserJwt } from "../setup/auth-helpers";
import { closeTestingApp, createTestingApp, resetTestingDb, type TestingApp } from "../setup/app-factory";
import { seedE2eProduct, seedE2eUser } from "../setup/e2e-fixtures";

describe("Orders (e2e)", () => {
  let ctx: TestingApp;
  let userToken: string;
  let productId: string;

  beforeAll(async () => {
    ctx = await createTestingApp();
  });

  beforeEach(async () => {
    await resetTestingDb(ctx.prisma);
    const user = await seedE2eUser(ctx.prisma);
    const product = await seedE2eProduct(ctx.prisma);
    productId = product.id;
    userToken = await signUserJwt(ctx.app, user.id);
  });

  afterAll(async () => {
    await closeTestingApp(ctx);
  });

  it("creates order and lists it for user", async () => {
    const server = ctx.app.getHttpServer();

    const created = await request(server)
      .post("/orders")
      .set(authHeader(userToken))
      .send({
        items: [{ productId, quantity: 1 }],
        deliveryPhone: "+998901234567",
        deliveryFirstName: "E2E",
        deliveryLastName: "Buyer",
        deliveryLatitude: 41.3,
        deliveryLongitude: 69.2,
      })
      .expect(201);

    expect(created.body.status).toBe("PENDING");
    expect(created.body.items).toHaveLength(1);

    const list = await request(server).get("/orders").set(authHeader(userToken)).expect(200);
    expect(list.body.total).toBeGreaterThanOrEqual(1);
  });

  it("cancels pending order", async () => {
    const server = ctx.app.getHttpServer();
    const created = await request(server)
      .post("/orders")
      .set(authHeader(userToken))
      .send({
        items: [{ productId, quantity: 1 }],
        deliveryPhone: "+998901234567",
        deliveryLatitude: 41.3,
        deliveryLongitude: 69.2,
      })
      .expect(201);

    const cancelled = await request(server)
      .post(`/orders/${created.body.id}/cancel`)
      .set(authHeader(userToken))
      .expect(201);

    expect(cancelled.body.status).toBe("CANCELLED");
  });
});

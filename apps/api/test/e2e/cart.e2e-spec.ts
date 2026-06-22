import request from "supertest";
import { authHeader, signUserJwt } from "../setup/auth-helpers";
import { closeTestingApp, createTestingApp, resetTestingDb, type TestingApp } from "../setup/app-factory";
import { seedE2eProduct, seedE2eUser } from "../setup/e2e-fixtures";

describe("Cart (e2e)", () => {
  let ctx: TestingApp;
  let userToken: string;
  let userId: string;
  let productId: string;

  beforeAll(async () => {
    ctx = await createTestingApp();
  });

  beforeEach(async () => {
    await resetTestingDb(ctx.prisma);
    const user = await seedE2eUser(ctx.prisma);
    const product = await seedE2eProduct(ctx.prisma);
    userId = user.id;
    productId = product.id;
    userToken = await signUserJwt(ctx.app, userId);
  });

  afterAll(async () => {
    await closeTestingApp(ctx);
  });

  it("full cart CRUD flow", async () => {
    const server = ctx.app.getHttpServer();

    const empty = await request(server).get("/cart").set(authHeader(userToken)).expect(200);
    expect(empty.body.items).toEqual([]);

    const withItem = await request(server)
      .post("/cart/items")
      .set(authHeader(userToken))
      .send({ productId, qty: 2 })
      .expect(201);
    expect(withItem.body.items).toHaveLength(1);
    const itemId = withItem.body.items[0].id;

    await request(server)
      .patch(`/cart/items/${itemId}`)
      .set(authHeader(userToken))
      .send({ qty: 3 })
      .expect(200);

    await request(server).delete(`/cart/items/${itemId}`).set(authHeader(userToken)).expect(200);

    await request(server).post("/cart/clear").set(authHeader(userToken)).expect(201);
  });
});

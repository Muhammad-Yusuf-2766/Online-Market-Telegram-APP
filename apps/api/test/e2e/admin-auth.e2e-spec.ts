import request from "supertest";
import { authHeader, signUserJwt } from "../setup/auth-helpers";
import { closeTestingApp, createTestingApp, resetTestingDb, type TestingApp } from "../setup/app-factory";
import { seedE2eAdmin, seedE2eUser } from "../setup/e2e-fixtures";

describe("AdminAuth (e2e)", () => {
  let ctx: TestingApp;

  beforeAll(async () => {
    ctx = await createTestingApp();
  });

  beforeEach(async () => {
    await resetTestingDb(ctx.prisma);
    await seedE2eAdmin(ctx.prisma);
  });

  afterAll(async () => {
    await closeTestingApp(ctx);
  });

  it("POST /admin/auth/login returns admin JWT", async () => {
    const res = await request(ctx.app.getHttpServer())
      .post("/admin/auth/login")
      .send({ email: "e2e-admin@test.local", password: "test-admin-pass" })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.expiresIn).toBeGreaterThan(0);
  });

  it("POST /admin/auth/login returns 401 for bad password", async () => {
    await request(ctx.app.getHttpServer())
      .post("/admin/auth/login")
      .send({ email: "e2e-admin@test.local", password: "wrong" })
      .expect(401);
  });

  it("GET /admin/auth/me rejects user JWT", async () => {
    const user = await seedE2eUser(ctx.prisma);
    const userToken = await signUserJwt(ctx.app, user.id);
    await request(ctx.app.getHttpServer()).get("/admin/auth/me").set(authHeader(userToken)).expect(401);
  });

  it("GET /admin/auth/me accepts admin JWT", async () => {
    const login = await request(ctx.app.getHttpServer())
      .post("/admin/auth/login")
      .send({ email: "e2e-admin@test.local", password: "test-admin-pass" })
      .expect(201);

    const me = await request(ctx.app.getHttpServer())
      .get("/admin/auth/me")
      .set(authHeader(login.body.accessToken))
      .expect(200);

    expect(me.body.email).toBe("e2e-admin@test.local");
  });
});

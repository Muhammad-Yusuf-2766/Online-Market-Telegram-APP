import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { AdminAuthService } from "./admin-auth.service";

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe("AdminAuthService", () => {
  let service: AdminAuthService;
  let prisma: PrismaMock;
  let jwt: jest.Mocked<Pick<JwtService, "signAsync">>;
  let config: jest.Mocked<Pick<ConfigService, "get">>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    jwt = { signAsync: jest.fn().mockResolvedValue("jwt-token") };
    config = { get: jest.fn().mockReturnValue("1d") };
    bcryptMock.compare.mockResolvedValue(false as never);

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminAuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = moduleRef.get(AdminAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("throws when admin user is missing", async () => {
      prisma.adminUser.findUnique.mockResolvedValue(null);
      await expect(service.login("a@b.com", "secret")).rejects.toMatchObject({
        response: expect.objectContaining({
          message: "Invalid credentials",
        }),
      });
    });

    it("throws when admin is inactive", async () => {
      prisma.adminUser.findUnique.mockResolvedValue({
        id: "1",
        email: "a@b.com",
        passwordHash: "hash",
        isActive: false,
      } as never);
      await expect(service.login("a@b.com", "secret")).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("throws when password does not match", async () => {
      prisma.adminUser.findUnique.mockResolvedValue({
        id: "1",
        email: "a@b.com",
        passwordHash: "hash",
        isActive: true,
      } as never);
      bcryptMock.compare.mockResolvedValue(false as never);
      await expect(service.login("a@b.com", "wrong")).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("returns token and expiry on success", async () => {
      prisma.adminUser.findUnique.mockResolvedValue({
        id: "adm-1",
        email: "a@b.com",
        passwordHash: "hash",
        isActive: true,
      } as never);
      bcryptMock.compare.mockResolvedValue(true as never);
      config.get.mockReturnValue("2h");

      const result = await service.login("A@B.COM", "secret");

      expect(prisma.adminUser.findUnique).toHaveBeenCalledWith({
        where: { email: "a@b.com" },
      });
      expect(jwt.signAsync).toHaveBeenCalledWith({ sub: "adm-1", typ: "admin" });
      expect(result).toEqual({ accessToken: "jwt-token", expiresIn: 7200 });
    });
  });

  describe("getMe", () => {
    it("throws when admin is missing", async () => {
      prisma.adminUser.findUnique.mockResolvedValue(null);
      await expect(service.getMe("x")).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("throws when admin is inactive", async () => {
      prisma.adminUser.findUnique.mockResolvedValue({
        id: "1",
        email: "a@b.com",
        isActive: false,
        role: null,
        directPermissions: [],
      } as never);
      await expect(service.getMe("1")).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("returns mapped payload when active", async () => {
      prisma.adminUser.findUnique.mockResolvedValue({
        id: "1",
        email: "a@b.com",
        fullName: "Ada",
        isActive: true,
        role: {
          id: "r1",
          key: "ops",
          name: "Ops",
          isSuperAdmin: false,
          permissions: [{ permission: { key: "orders.read" } }],
        },
        directPermissions: [{ permission: { key: "debug.tools" } }],
      } as never);

      const me = await service.getMe("1");

      expect(me).toMatchObject({
        id: "1",
        email: "a@b.com",
        permissions: ["debug.tools", "orders.read"],
      });
    });
  });
});

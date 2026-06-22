import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AdminAuthService } from "../admin-auth/admin-auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { AdminUsersMgmtService } from "./admin-users-mgmt.service";

describe("AdminUsersMgmtService", () => {
  let service: AdminUsersMgmtService;
  let prisma: PrismaMock;
  let adminAuth: jest.Mocked<Pick<AdminAuthService, "hashPassword">>;

  const hydratedAdmin = {
    id: "a1",
    email: "a@b.com",
    fullName: "Ada",
    isActive: true,
    role: null,
    directPermissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = createPrismaMock();
    adminAuth = { hashPassword: jest.fn().mockResolvedValue("hashed-password") };
    prisma.$transaction.mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminUsersMgmtService,
        { provide: PrismaService, useValue: prisma },
        { provide: AdminAuthService, useValue: adminAuth },
      ],
    }).compile();

    service = moduleRef.get(AdminUsersMgmtService);

    jest.spyOn(service, "findOne").mockResolvedValue(hydratedAdmin as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("findAll", () => {
    it("returns paginated admins", async () => {
      jest.restoreAllMocks();
      prisma.adminUser.findMany.mockResolvedValue([
        {
          id: "a1",
          email: "e@e.com",
          fullName: "E",
          isActive: true,
          role: { id: "r", key: "k", name: "R", isSuperAdmin: false },
          _count: { directPermissions: 1 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as never);
      prisma.adminUser.count.mockResolvedValue(1);

      const page = await service.findAll({ page: 1, pageSize: 10 });

      expect(page.items).toHaveLength(1);
      expect(page.items[0].directPermissionCount).toBe(1);
      expect(page.total).toBe(1);
    });

    it("builds search filter when q provided", async () => {
      jest.restoreAllMocks();
      prisma.adminUser.findMany.mockResolvedValue([]);
      prisma.adminUser.count.mockResolvedValue(0);

      await service.findAll({ page: 1, pageSize: 10 }, " ada ");

      expect(prisma.adminUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { email: expect.any(Object) },
              { fullName: expect.any(Object) },
            ],
          },
        }),
      );
    });
  });

  describe("create", () => {
    it("throws when email already registered", async () => {
      prisma.adminUser.findUnique.mockResolvedValue({ id: "x" } as never);

      await expect(
        service.create({
          email: "Dup@dup.com",
          password: "secret",
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(adminAuth.hashPassword).not.toHaveBeenCalled();
    });

    it("hashes password and persists admin", async () => {
      prisma.adminUser.findUnique.mockResolvedValueOnce(null);
      prisma.role.findUnique.mockResolvedValue({ id: "r1" } as never);
      prisma.adminUser.create.mockResolvedValue({ id: "new-admin" } as never);

      await service.create({
        email: "NEW@X.COM",
        password: "secret",
        roleId: "r1",
      });

      expect(adminAuth.hashPassword).toHaveBeenCalledWith("secret");
      expect(prisma.adminUser.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "new@x.com",
          passwordHash: "hashed-password",
          roleId: "r1",
        }),
      });
    });
  });

  describe("remove", () => {
    it("blocks deleting yourself", async () => {
      await expect(service.remove("same", "same")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws when admin missing", async () => {
      prisma.adminUser.findUnique.mockResolvedValue(null);

      await expect(service.remove("missing", "current")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("blocks deleting last active super admin", async () => {
      prisma.adminUser.findUnique.mockResolvedValue({
        id: "a1",
        role: { isSuperAdmin: true },
      } as never);
      prisma.adminUser.count.mockResolvedValue(1);

      await expect(service.remove("a1", "other")).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("setPermissions", () => {
    it("throws when permission ids invalid", async () => {
      prisma.adminUser.findUnique.mockResolvedValue({ id: "a1" } as never);
      prisma.permission.findMany.mockResolvedValue([{ id: "p1" }] as never);

      await expect(service.setPermissions("a1", { permissionIds: ["p1", "ghost"] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});

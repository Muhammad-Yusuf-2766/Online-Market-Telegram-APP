import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { RolesService } from "./roles.service";

describe("RolesService", () => {
  let service: RolesService;
  let prisma: PrismaMock;

  const roleRow = {
    id: "r1",
    key: "support",
    name: "Support",
    description: null,
    isSystem: false,
    isSuperAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [{ permission: { id: "p1", key: "a", name: "A", description: null, isSystem: true } }],
    _count: { adminUsers: 2 },
  };

  beforeEach(async () => {
    prisma = createPrismaMock();
    prisma.$transaction.mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [RolesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(RolesService);
  });

  describe("findOne", () => {
    it("throws when role does not exist", async () => {
      prisma.role.findUnique.mockResolvedValue(null);
      await expect(service.findOne("missing")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("returns mapped role details", async () => {
      prisma.role.findUnique.mockResolvedValue(roleRow as never);

      const role = await service.findOne("r1");

      expect(role.permissions).toHaveLength(1);
      expect(role.memberCount).toBe(2);
    });
  });

  describe("create", () => {
    it("throws on duplicate key", async () => {
      prisma.role.findUnique.mockResolvedValue({ id: "x" } as never);
      await expect(service.create({ key: "dup", name: "Dup" })).rejects.toBeInstanceOf(ConflictException);
    });

    it("creates then returns hydrated role", async () => {
      prisma.role.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(roleRow as never);
      prisma.role.create.mockResolvedValue({ id: "new-role" } as never);

      const created = await service.create({ key: "NEW", name: "New role", description: "d" });

      expect(prisma.role.create).toHaveBeenCalled();
      expect(created.id).toBe("r1");
    });
  });

  describe("remove", () => {
    it("throws when role still has members", async () => {
      prisma.role.findUnique.mockResolvedValue({
        id: "r1",
        isSystem: false,
        _count: { adminUsers: 3 },
      } as never);

      await expect(service.remove("r1")).rejects.toBeInstanceOf(ConflictException);
    });

    it("throws when deleting system role", async () => {
      prisma.role.findUnique.mockResolvedValue({
        id: "r1",
        isSystem: true,
        _count: { adminUsers: 0 },
      } as never);

      await expect(service.remove("r1")).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("setPermissions", () => {
    it("rejects updates for super-admin role", async () => {
      prisma.role.findUnique.mockResolvedValue({
        id: "r1",
        isSuperAdmin: true,
      } as never);

      await expect(service.setPermissions("r1", { permissionIds: ["p1"] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("throws when permission id list is invalid", async () => {
      prisma.role.findUnique.mockResolvedValue({
        id: "r1",
        isSuperAdmin: false,
      } as never);
      prisma.permission.findMany.mockResolvedValue([{ id: "p1" }] as never);

      await expect(service.setPermissions("r1", { permissionIds: ["p1", "missing"] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});

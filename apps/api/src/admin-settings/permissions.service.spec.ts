import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { PermissionsService } from "./permissions.service";

describe("PermissionsService", () => {
  let service: PermissionsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [PermissionsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(PermissionsService);
  });

  describe("create", () => {
    it("throws when key already exists", async () => {
      prisma.permission.findUnique.mockResolvedValue({ id: "p1", key: "orders.read" } as never);
      await expect(
        service.create({ key: "orders.read", name: "Read orders", description: "" }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.permission.create).not.toHaveBeenCalled();
    });

    it("creates permission with normalized key", async () => {
      prisma.permission.findUnique.mockResolvedValue(null);
      prisma.permission.create.mockResolvedValue({ id: "new", key: "custom.perm" } as never);

      const row = await service.create({
        key: "CUSTOM.PERM",
        name: "Custom",
        description: "desc",
      });

      expect(prisma.permission.create).toHaveBeenCalledWith({
        data: {
          key: "custom.perm",
          name: "Custom",
          description: "desc",
          isSystem: false,
        },
      });
      expect(row.id).toBe("new");
    });
  });

  describe("update", () => {
    it("throws when permission missing", async () => {
      prisma.permission.findUnique.mockResolvedValue(null);
      await expect(service.update("x", { name: "n" })).rejects.toBeInstanceOf(NotFoundException);
    });

    it("blocks changing key on system permission", async () => {
      prisma.permission.findUnique.mockResolvedValue({
        id: "sys",
        key: "system.a",
        isSystem: true,
      } as never);
      await expect(service.update("sys", { key: "other" })).rejects.toBeInstanceOf(BadRequestException);
    });

    it("updates fields when allowed", async () => {
      prisma.permission.findUnique.mockResolvedValue({
        id: "p1",
        key: "a.b",
        isSystem: false,
      } as never);
      prisma.permission.update.mockResolvedValue({ id: "p1", key: "a.b", name: "New" } as never);

      const row = await service.update("p1", { name: "New" });

      expect(prisma.permission.update).toHaveBeenCalled();
      expect(row.name).toBe("New");
    });
  });

  describe("remove", () => {
    it("throws when deleting system permission", async () => {
      prisma.permission.findUnique.mockResolvedValue({ id: "s", isSystem: true } as never);
      await expect(service.remove("s")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("deletes non-system permission", async () => {
      prisma.permission.findUnique.mockResolvedValue({ id: "p1", isSystem: false } as never);
      prisma.permission.delete.mockResolvedValue({} as never);

      const result = await service.remove("p1");

      expect(result).toEqual({ ok: true });
      expect(prisma.permission.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
    });
  });
});

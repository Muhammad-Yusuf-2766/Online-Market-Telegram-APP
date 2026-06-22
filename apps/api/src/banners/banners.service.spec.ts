import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { BannersService } from "./banners.service";

describe("BannersService", () => {
  let service: BannersService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [BannersService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(BannersService);
  });

  it("listActive filters by schedule windows and isActive", async () => {
    prisma.banner.findMany.mockResolvedValue([]);
    await service.listActive();
    expect(prisma.banner.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          AND: expect.any(Array),
        }),
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
    );
  });

  it("create applies defaults for optional fields", async () => {
    prisma.banner.create.mockResolvedValue({ id: "b1" } as never);
    await service.create({ imageUrl: "https://img" });
    expect(prisma.banner.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        imageUrl: "https://img",
        title: null,
        linkUrl: null,
        sortOrder: 0,
        isActive: true,
        startsAt: null,
        endsAt: null,
      }),
    });
  });

  it("update throws when banner does not exist", async () => {
    prisma.banner.findUnique.mockResolvedValue(null);
    await expect(service.update("missing", { title: "x" })).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.banner.update).not.toHaveBeenCalled();
  });

  it("remove deletes after ensureExists", async () => {
    prisma.banner.findUnique.mockResolvedValue({ id: "b1" } as never);
    prisma.banner.delete.mockResolvedValue({} as never);
    await expect(service.remove("b1")).resolves.toEqual({ ok: true });
    expect(prisma.banner.delete).toHaveBeenCalledWith({ where: { id: "b1" } });
  });
});

import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { SizePresetsService } from "./size-presets.service";

describe("SizePresetsService", () => {
  let service: SizePresetsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [SizePresetsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(SizePresetsService);
  });

  it("create rejects invalid preset", async () => {
    await expect(service.create({ slug: "", label: "", grams: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("remove throws when preset not found", async () => {
    prisma.productSizePreset.findUnique.mockResolvedValue(null);
    await expect(service.remove("missing")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("findAllPaginated returns paginated presets", async () => {
    prisma.productSizePreset.count.mockResolvedValue(2);
    prisma.productSizePreset.findMany.mockResolvedValue([{ id: "p1" }, { id: "p2" }] as never);
    const result = await service.findAllPaginated({ page: 1, pageSize: 10 });
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
  });
});

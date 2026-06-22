import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { FragranceFamiliesService } from "./fragrance-families.service";

describe("FragranceFamiliesService", () => {
  let service: FragranceFamiliesService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [FragranceFamiliesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(FragranceFamiliesService);
  });

  it("lists families", async () => {
    prisma.fragranceFamily.findMany.mockResolvedValue([]);
    await service.list();
    expect(prisma.fragranceFamily.findMany).toHaveBeenCalled();
  });

  it("creates family with normalized slug", async () => {
    prisma.fragranceFamily.create.mockResolvedValue({ id: "f1" } as never);
    await service.create({ slug: " Woody ", name: " Woody " });
    expect(prisma.fragranceFamily.create).toHaveBeenCalledWith({
      data: { slug: "woody", name: "Woody" },
    });
  });
});

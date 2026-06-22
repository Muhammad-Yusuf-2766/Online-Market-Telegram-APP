import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { BrandsService } from "./brands.service";

describe("BrandsService", () => {
  let service: BrandsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [BrandsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(BrandsService);
  });

  it("lists brands", async () => {
    prisma.brand.findMany.mockResolvedValue([]);
    await service.list();
    expect(prisma.brand.findMany).toHaveBeenCalledWith({ orderBy: { name: "asc" } });
  });

  it("creates brand with normalized slug", async () => {
    prisma.brand.create.mockResolvedValue({ id: "b1" } as never);
    await service.create({ slug: " Dior ", name: " Dior " });
    expect(prisma.brand.create).toHaveBeenCalledWith({
      data: { slug: "dior", name: "Dior", logoUrl: null },
    });
  });
});

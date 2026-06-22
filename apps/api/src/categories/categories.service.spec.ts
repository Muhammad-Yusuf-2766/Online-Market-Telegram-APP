import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { CategoriesService } from "./categories.service";

describe("CategoriesService", () => {
  let service: CategoriesService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [CategoriesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(CategoriesService);
  });

  it("lists categories ordered", async () => {
    prisma.category.findMany.mockResolvedValue([]);
    await service.list();
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  });

  it("creates category with normalized slug", async () => {
    prisma.category.create.mockResolvedValue({ id: "c1" } as never);
    await service.create({ slug: "  Perfumes ", name: "  Perfumes " });
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: { slug: "perfumes", name: "Perfumes", parentId: null, sortOrder: 0 },
    });
  });
});

import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { WishlistService } from "./wishlist.service";

describe("WishlistService", () => {
  let service: WishlistService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [WishlistService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(WishlistService);
  });

  it("lists wishlist for user", async () => {
    prisma.wishlist.findMany.mockResolvedValue([]);
    await service.list("user-1");
    expect(prisma.wishlist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } }),
    );
  });

  it("toggle removes existing item", async () => {
    prisma.wishlist.findUnique.mockResolvedValue({ id: "w1" } as never);
    prisma.wishlist.delete.mockResolvedValue({} as never);
    const result = await service.toggle("user-1", "prod-1");
    expect(result).toEqual({ added: false });
    expect(prisma.wishlist.delete).toHaveBeenCalled();
  });

  it("toggle adds new item", async () => {
    prisma.wishlist.findUnique.mockResolvedValue(null);
    prisma.wishlist.create.mockResolvedValue({} as never);
    const result = await service.toggle("user-1", "prod-1");
    expect(result).toEqual({ added: true });
    expect(prisma.wishlist.create).toHaveBeenCalled();
  });
});

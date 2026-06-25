import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { CartService } from "./cart.service";

describe("CartService", () => {
  let service: CartService;
  let prisma: PrismaMock;

  const cart = { id: "cart-1", userId: "user-1", updatedAt: new Date() };

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [CartService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(CartService);
    prisma.cart.upsert.mockResolvedValue(cart as never);
    prisma.cartItem.findMany.mockResolvedValue([]);
  });

  it("getForUser ensures cart and maps items", async () => {
    const result = await service.getForUser("user-1");
    expect(result.userId).toBe("user-1");
    expect(result.items).toEqual([]);
  });

  it("upsertItem updates cart line", async () => {
    prisma.product.findFirst.mockResolvedValue({ id: "p1", stockQuantity: 10 } as never);
    prisma.cartItem.upsert.mockResolvedValue({} as never);
    await service.upsertItem("user-1", { productId: "p1", qty: 2 });
    expect(prisma.product.findFirst).toHaveBeenCalledWith({
      where: { id: "p1", isActive: true },
      select: { id: true, stockQuantity: true },
    });
    expect(prisma.cartItem.upsert).toHaveBeenCalled();
  });

  it("updateItemQty deletes item when qty <= 0", async () => {
    prisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });
    await service.updateItemQty("user-1", "item-1", 0);
    expect(prisma.cartItem.deleteMany).toHaveBeenCalled();
  });

  it("clear removes all cart items", async () => {
    prisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });
    const result = await service.clear("user-1");
    expect(result).toEqual({ ok: true });
  });

  it("removeItem deletes line and returns refreshed cart", async () => {
    prisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });

    const result = await service.removeItem("user-1", "item-99");

    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { id: "item-99", cartId: cart.id },
    });
    expect(result.items).toEqual([]);
  });
});

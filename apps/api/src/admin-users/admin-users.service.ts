import { Injectable, NotFoundException } from "@nestjs/common";
import type { Order, OrderItem, Prisma, Product, User, UserAddress, Wishlist } from "@prisma/client";
import type { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { paginationParams, toPaginatedResult, type PaginatedResult } from "../common/pagination";
import { PrismaService } from "../prisma/prisma.service";

export type AdminCustomerRow = User & {
  addresses: UserAddress[];
  _count: {
    addresses: number;
    orders: number;
    wishlistItems: number;
  };
};

type CustomerOrder = Order & {
  items: OrderItem[];
};

type WishlistWithProduct = Wishlist & {
  product: Pick<Product, "id" | "title" | "priceKrw" | "images">;
};

type CartItemWithProduct = {
  id: string;
  qty: number;
  product: Pick<Product, "id" | "title" | "priceKrw" | "images">;
};

export type AdminCustomerDetail = {
  user: User;
  addresses: UserAddress[];
  orders: CustomerOrder[];
  wishlistItems: WishlistWithProduct[];
  cartItems: CartItemWithProduct[];
  kpis: {
    orderCount: number;
    pendingOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalSpentKrw: number;
    averageOrderValueKrw: number;
    wishlistCount: number;
    cartItemCount: number;
    addressCount: number;
    reviewsCount: number;
    lastOrderAt: Date | null;
  };
};

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPaginated(
    query: PaginationQueryDto & { q?: string },
  ): Promise<PaginatedResult<AdminCustomerRow>> {
    const { page, pageSize, skip } = paginationParams(query);
    const terms = query.q?.trim().split(/\s+/).filter(Boolean) ?? [];
    const where: Prisma.UserWhereInput =
      terms.length > 0
        ? {
            AND: terms.map((term) => ({
              OR: [
                { telegramId: { contains: term } },
                { telegramUsername: { contains: term, mode: "insensitive" } },
                { firstName: { contains: term, mode: "insensitive" } },
                { lastName: { contains: term, mode: "insensitive" } },
                { phone: { contains: term } },
              ],
            })),
          }
        : {};
    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }], take: 3 },
          _count: {
            select: {
              addresses: true,
              orders: true,
              wishlistItems: true,
            },
          },
        },
      }),
    ]);
    return toPaginatedResult(items, total, page, pageSize);
  }

  async getUser360(userId: string): Promise<AdminCustomerDetail> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        },
        orders: {
          include: { items: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        wishlistItems: {
          include: { product: { select: { id: true, title: true, priceKrw: true, images: true } } },
          orderBy: { createdAt: "desc" },
          take: 100,
        },
        cart: {
          include: {
            items: {
              include: { product: { select: { id: true, title: true, priceKrw: true, images: true } } },
              orderBy: { createdAt: "desc" },
            },
          },
        },
        productFeedbacks: { select: { id: true } },
        _count: {
          select: {
            orders: true,
            wishlistItems: true,
            addresses: true,
            productFeedbacks: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException("User not found");
    const paidOrders = user.orders.filter((order) => order.status !== "CANCELLED");
    const totalSpentKrw = paidOrders.reduce((acc, order) => acc + order.totalKrw, 0);
    const pendingOrders = user.orders.filter((o) => o.status === "PENDING").length;
    const cancelledOrders = user.orders.filter((o) => o.status === "CANCELLED").length;
    const deliveredOrders = user.orders.filter((o) => o.status === "DELIVERED").length;
    const lastOrder = user.orders[0]?.createdAt ?? null;
    const {
      addresses,
      orders,
      wishlistItems,
      cart,
      productFeedbacks: _productFeedbacks,
      _count,
      ...userProfile
    } = user;

    return {
      user: userProfile,
      addresses,
      orders,
      wishlistItems,
      cartItems: cart?.items ?? [],
      kpis: {
        orderCount: _count.orders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        totalSpentKrw,
        averageOrderValueKrw: paidOrders.length > 0 ? Math.round(totalSpentKrw / paidOrders.length) : 0,
        wishlistCount: _count.wishlistItems,
        cartItemCount: cart?.items.length ?? 0,
        addressCount: _count.addresses,
        reviewsCount: _count.productFeedbacks,
        lastOrderAt: lastOrder,
      },
    };
  }
}

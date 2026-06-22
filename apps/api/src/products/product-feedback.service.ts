import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus, ProductFeedbackStatus, type User } from "@prisma/client";
import type { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { paginationParams, toPaginatedResult, type PaginatedResult } from "../common/pagination";
import { PrismaService } from "../prisma/prisma.service";
import type { AdminProductFeedbackQueryDto } from "./dto/admin-product-feedback-query.dto";
import type { CreateProductFeedbackDto } from "./dto/create-product-feedback.dto";
import type { PatchProductFeedbackStatusDto } from "./dto/patch-product-feedback-status.dto";

export type PublicProductFeedback = {
  id: string;
  stars: number;
  comment: string;
  createdAt: Date;
  authorDisplay: string;
};

export type ProductFeedbackSubmitEligibility = {
  canSubmit: boolean;
  reason:
    | "ORDER_DETAIL_REQUIRED"
    | "INVALID_ORDER_CONTEXT"
    | "ORDER_NOT_DELIVERED"
    | "ALREADY_PUBLISHED"
    | null;
};

export type AdminProductFeedbackRow = {
  id: string;
  productId: string;
  userId: string;
  stars: number;
  comment: string;
  status: ProductFeedbackStatus;
  createdAt: Date;
  updatedAt: Date;
  product: { id: string; title: string };
  user: {
    id: string;
    firstName: string | null;
    telegramUsername: string | null;
  };
};

@Injectable()
export class ProductFeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async recomputeProductRatings(productId: string): Promise<void> {
    const [agg, count] = await Promise.all([
      this.prisma.productFeedback.aggregate({
        where: { productId, status: ProductFeedbackStatus.APPROVED },
        _avg: { stars: true },
      }),
      this.prisma.productFeedback.count({
        where: { productId, status: ProductFeedbackStatus.APPROVED },
      }),
    ]);
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        ratingCount: count,
        ratingAvg: count === 0 ? null : agg._avg.stars,
      },
    });
  }

  async listPublic(
    productId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<PublicProductFeedback>> {
    await this.ensureProductExists(productId);
    const { page, pageSize, skip } = paginationParams(query);
    const where = { productId, status: ProductFeedbackStatus.APPROVED };
    const [total, rows] = await Promise.all([
      this.prisma.productFeedback.count({ where }),
      this.prisma.productFeedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: { user: { select: { firstName: true } } },
      }),
    ]);
    const items: PublicProductFeedback[] = rows.map((r) => ({
      id: r.id,
      stars: r.stars,
      comment: r.comment,
      createdAt: r.createdAt,
      authorDisplay: r.user.firstName?.trim() || "Customer",
    }));
    return toPaginatedResult(items, total, page, pageSize);
  }

  /**
   * Whether the user may POST feedback for this product from the given order (JWT mini-app).
   * Submit is only from order details: order must be **DELIVERED**, belong to the user,
   * include this product line, and not already have a published review for this product.
   */
  async getSubmitEligibility(
    user: User,
    productId: string,
    orderId: string,
  ): Promise<ProductFeedbackSubmitEligibility> {
    await this.ensureProductExists(productId);
    const trimmedOrderId = orderId?.trim();
    if (!trimmedOrderId) {
      return { canSubmit: false, reason: "ORDER_DETAIL_REQUIRED" };
    }
    const existing = await this.prisma.productFeedback.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });
    if (existing?.status === ProductFeedbackStatus.APPROVED) {
      return { canSubmit: false, reason: "ALREADY_PUBLISHED" };
    }
    const line = await this.evaluateOrderFeedbackLine(user.id, trimmedOrderId, productId);
    if (line === "invalid") {
      return { canSubmit: false, reason: "INVALID_ORDER_CONTEXT" };
    }
    if (line === "not_delivered") {
      return { canSubmit: false, reason: "ORDER_NOT_DELIVERED" };
    }
    return { canSubmit: true, reason: null };
  }

  async submit(
    user: User,
    productId: string,
    dto: CreateProductFeedbackDto,
  ): Promise<{ id: string; status: ProductFeedbackStatus }> {
    await this.ensureProductExists(productId);
    const existing = await this.prisma.productFeedback.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });
    if (existing?.status === ProductFeedbackStatus.APPROVED) {
      throw new ConflictException(
        "Published feedback cannot be changed; contact support if you need a correction.",
      );
    }
    await this.assertOrderFeedbackContext(user.id, dto.orderId.trim(), productId);
    const comment = dto.comment?.trim() ?? "";
    const row = await this.prisma.productFeedback.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: {
        userId: user.id,
        productId,
        stars: dto.stars,
        comment,
        status: ProductFeedbackStatus.PENDING,
      },
      update: {
        stars: dto.stars,
        comment,
        status: ProductFeedbackStatus.PENDING,
      },
    });
    return { id: row.id, status: row.status };
  }

  async adminList(
    query: AdminProductFeedbackQueryDto,
  ): Promise<PaginatedResult<AdminProductFeedbackRow>> {
    const { page, pageSize, skip } = paginationParams(query);
    const status = query.status ?? ProductFeedbackStatus.PENDING;
    const where = { status };
    const [total, rows] = await Promise.all([
      this.prisma.productFeedback.count({ where }),
      this.prisma.productFeedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          product: { select: { id: true, title: true } },
          user: {
            select: { id: true, firstName: true, telegramUsername: true },
          },
        },
      }),
    ]);
    const items: AdminProductFeedbackRow[] = rows.map((r) => ({
      id: r.id,
      productId: r.productId,
      userId: r.userId,
      stars: r.stars,
      comment: r.comment,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      product: r.product,
      user: r.user,
    }));
    return toPaginatedResult(items, total, page, pageSize);
  }

  async adminSetStatus(
    id: string,
    dto: PatchProductFeedbackStatusDto,
  ): Promise<AdminProductFeedbackRow> {
    const row = await this.prisma.productFeedback.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, title: true } },
        user: { select: { id: true, firstName: true, telegramUsername: true } },
      },
    });
    if (!row) {
      throw new NotFoundException("Feedback not found");
    }
    if (row.status === dto.status) {
      return {
        id: row.id,
        productId: row.productId,
        userId: row.userId,
        stars: row.stars,
        comment: row.comment,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        product: row.product,
        user: row.user,
      };
    }
    const updated = await this.prisma.productFeedback.update({
      where: { id },
      data: { status: dto.status },
      include: {
        product: { select: { id: true, title: true } },
        user: { select: { id: true, firstName: true, telegramUsername: true } },
      },
    });
    await this.recomputeProductRatings(row.productId);
    return {
      id: updated.id,
      productId: updated.productId,
      userId: updated.userId,
      stars: updated.stars,
      comment: updated.comment,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      product: updated.product,
      user: updated.user,
    };
  }

  private async ensureProductExists(productId: string): Promise<void> {
    const exists = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException("Product not found");
    }
  }

  /**
   * `ok` — user owns order, line matches, order is DELIVERED.
   * `not_delivered` — line exists but order is not delivered yet (or cancelled).
   * `invalid` — no line / wrong user / cancelled without recoverable line context.
   */
  private async evaluateOrderFeedbackLine(
    userId: string,
    orderId: string,
    productId: string,
  ): Promise<"ok" | "not_delivered" | "invalid"> {
    const item = await this.prisma.orderItem.findFirst({
      where: { orderId, productId },
      include: { order: { select: { userId: true, status: true } } },
    });
    if (!item || item.order.userId !== userId) {
      return "invalid";
    }
    if (item.order.status === OrderStatus.CANCELLED) {
      return "invalid";
    }
    if (item.order.status !== OrderStatus.DELIVERED) {
      return "not_delivered";
    }
    return "ok";
  }

  private async assertOrderFeedbackContext(
    userId: string,
    orderId: string,
    productId: string,
  ): Promise<void> {
    const line = await this.evaluateOrderFeedbackLine(userId, orderId, productId);
    if (line === "ok") {
      return;
    }
    if (line === "not_delivered") {
      throw new ForbiddenException(
        "Feedback is available after the order is marked as delivered.",
      );
    }
    throw new ForbiddenException(
      "Submit feedback only from order details for a product in that delivered order.",
    );
  }
}

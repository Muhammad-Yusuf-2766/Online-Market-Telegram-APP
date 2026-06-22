import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Order, OrderItem, User } from "@prisma/client";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import type { PaginatedResult } from "../common/pagination";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@ApiBearerAuth("user-jwt")
@UseGuards(JwtUserGuard)
@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @ApiOperation({ summary: "Place an order (updates profile from delivery fields)" })
  @ApiOkResponse({ description: "Created order with line items" })
  async create(@CurrentUser() user: User, @Body() body: CreateOrderDto): Promise<Order & { items: OrderItem[] }> {
    return this.orders.createForUser(user.id, body);
  }

  @Get()
  @ApiOperation({ summary: "List current user's orders (paginated)" })
  @ApiOkResponse({ description: "Paginated orders with items" })
  async list(
    @CurrentUser() user: User,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<Order & { items: OrderItem[] }>> {
    return this.orders.listForUser(user.id, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Order detail" })
  @ApiOkResponse({ description: "Order with items" })
  async get(@CurrentUser() user: User, @Param("id") id: string): Promise<Order & { items: OrderItem[] }> {
    return this.orders.getForUser(user.id, id);
  }

  @Post(":id/cancel")
  @ApiOperation({ summary: "Cancel a pending order (current user)" })
  @ApiOkResponse({ description: "Cancelled order with items" })
  async cancel(
    @CurrentUser() user: User,
    @Param("id") id: string,
  ): Promise<Order & { items: OrderItem[] }> {
    return this.orders.cancelForUser(user.id, id);
  }
}

import { Body, Controller, Get, NotFoundException, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Order } from "@prisma/client";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import type { PaginatedResult } from "../common/pagination";
import { AdminOrdersQueryDto } from "./dto/admin-orders-query.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { type AdminOrderRow, OrdersService } from "./orders.service";

@ApiTags("admin-orders")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard)
@Controller("admin/orders")
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: "List all orders (admin, paginated, filterable)" })
  @ApiOkResponse({ description: "Paginated orders with items and user profile data" })
  async list(@Query() query: AdminOrdersQueryDto): Promise<PaginatedResult<AdminOrderRow>> {
    return this.orders.listAllPaginated(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one order (admin)" })
  @ApiOkResponse({ description: "Order with items and user" })
  async getOne(@Param("id") id: string): Promise<AdminOrderRow> {
    const row = await this.orders.getByIdForAdmin(id);
    if (!row) {
      throw new NotFoundException("Order not found");
    }
    return row;
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update order status" })
  @ApiOkResponse({ description: "Updated order" })
  async updateStatus(@Param("id") id: string, @Body() body: UpdateOrderStatusDto): Promise<Order> {
    return this.orders.updateStatus(id, body.status);
  }
}

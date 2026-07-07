import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { SearchablePaginationQueryDto } from "../common/dto/searchable-pagination-query.dto";
import type { PaginatedResult } from "../common/pagination";
import {
  AdminUsersService,
  type AdminCustomerDetail,
  type AdminCustomerRow,
} from "./admin-users.service";

@ApiTags("admin-users")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard)
@Controller("admin/users")
export class AdminUsersController {
  constructor(private readonly adminUsers: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: "List Telegram users (admin, paginated, searchable)" })
  @ApiOkResponse({ description: "Paginated users" })
  async list(@Query() query: SearchablePaginationQueryDto): Promise<PaginatedResult<AdminCustomerRow>> {
    return this.adminUsers.findAllPaginated(query);
  }

  @Get(":userId/details")
  @ApiOperation({ summary: "Customer 360 profile and KPIs" })
  @ApiOkResponse()
  async details(@Param("userId") userId: string): Promise<AdminCustomerDetail> {
    return this.adminUsers.getUser360(userId);
  }
}

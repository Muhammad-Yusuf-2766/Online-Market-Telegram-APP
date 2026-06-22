import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import type { PaginatedResult } from "../common/pagination";
import { CreateProductDto } from "./dto/create-product.dto";
import { ProductListQueryDto } from "./dto/product-list-query.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService, type PublicProduct } from "./products.service";

@ApiTags("admin-products")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard)
@Controller("admin/products")
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: "List products for admin" })
  @ApiOkResponse({ description: "Paginated products" })
  async list(@Query() query: ProductListQueryDto): Promise<PaginatedResult<PublicProduct>> {
    return this.products.findAll({ ...query, includeInactive: true });
  }

  @Post()
  @ApiOperation({ summary: "Create product" })
  @ApiOkResponse({ description: "Created product" })
  async create(@Body() body: CreateProductDto): Promise<PublicProduct> {
    return this.products.create(body);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update product" })
  @ApiOkResponse({ description: "Updated product" })
  async update(@Param("id") id: string, @Body() body: UpdateProductDto): Promise<PublicProduct> {
    return this.products.update(id, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete product" })
  @ApiOkResponse({ description: "Deleted" })
  async remove(@Param("id") id: string): Promise<{ ok: true }> {
    await this.products.remove(id);
    return { ok: true };
  }
}

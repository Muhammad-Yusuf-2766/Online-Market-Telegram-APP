import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService, type PublicProduct } from "./products.service";

@ApiTags("admin-products")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller("admin/products")
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.products.manage)
  @ApiOperation({ summary: "Create product" })
  @ApiOkResponse({ description: "Created product" })
  async create(@Body() body: CreateProductDto): Promise<PublicProduct> {
    return this.products.create(body);
  }

  @Patch(":id")
  @RequirePermissions(PERMISSIONS.products.manage)
  @ApiOperation({ summary: "Update product" })
  @ApiOkResponse({ description: "Updated product" })
  async update(@Param("id") id: string, @Body() body: UpdateProductDto): Promise<PublicProduct> {
    return this.products.update(id, body);
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.products.manage)
  @ApiOperation({ summary: "Delete product" })
  @ApiOkResponse({ description: "Deleted" })
  async remove(@Param("id") id: string): Promise<{ ok: true }> {
    await this.products.remove(id);
    return { ok: true };
  }
}

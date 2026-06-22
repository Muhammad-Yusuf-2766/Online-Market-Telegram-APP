import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { PaginatedResult } from "../common/pagination";
import { ProductListQueryDto } from "./dto/product-list-query.dto";
import { ProductsService, type PublicProduct } from "./products.service";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: "List Ansor Market products" })
  @ApiOkResponse({ description: "Paginated products" })
  async list(@Query() query: ProductListQueryDto): Promise<PaginatedResult<PublicProduct>> {
    return this.products.findAll(query);
  }

  @Get("sections/sale")
  @ApiOperation({ summary: "Sale products section" })
  @ApiOkResponse({ description: "Paginated sale products" })
  async sale(@Query() query: ProductListQueryDto): Promise<PaginatedResult<PublicProduct>> {
    return this.products.findSection("sale", query);
  }

  @Get("sections/bestseller")
  @ApiOperation({ summary: "Bestselling products section" })
  @ApiOkResponse({ description: "Paginated bestselling products" })
  async bestseller(@Query() query: ProductListQueryDto): Promise<PaginatedResult<PublicProduct>> {
    return this.products.findSection("bestseller", query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Product detail" })
  @ApiOkResponse({ description: "Product" })
  async get(@Param("id") id: string): Promise<PublicProduct> {
    return this.products.findOne(id);
  }
}

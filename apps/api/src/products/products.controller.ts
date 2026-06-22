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
  @ApiOperation({ summary: "List catalog products (paginated, optional search/sort)" })
  @ApiOkResponse({ description: "Paginated products" })
  async list(@Query() query: ProductListQueryDto): Promise<PaginatedResult<PublicProduct>> {
    return this.products.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Product detail" })
  @ApiOkResponse({ description: "Product" })
  async get(@Param("id") id: string): Promise<PublicProduct> {
    return this.products.findOne(id);
  }

  @Get("highlights")
  @ApiOperation({ summary: "Bestseller/new/discounted lists" })
  @ApiOkResponse()
  async highlights() {
    return this.products.highlights();
  }

  @Get(":id/similar")
  @ApiOperation({ summary: "Similar products by taxonomy" })
  @ApiOkResponse()
  async similar(@Param("id") id: string) {
    return this.products.similar(id);
  }

  @Get(":id/frequently-bought-together")
  @ApiOperation({ summary: "Frequently bought together products" })
  @ApiOkResponse()
  async frequentlyBoughtTogether(@Param("id") id: string) {
    return this.products.frequentlyBoughtTogether(id);
  }
}

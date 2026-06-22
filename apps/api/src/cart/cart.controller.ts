import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";
import { UpsertCartItemDto } from "./dto/upsert-cart-item.dto";
import { CartService } from "./cart.service";

@ApiTags("cart")
@ApiBearerAuth("user-jwt")
@UseGuards(JwtUserGuard)
@Controller("cart")
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  @ApiOperation({ summary: "Get current user cart" })
  @ApiOkResponse()
  async get(@CurrentUser() user: User) {
    return this.cart.getForUser(user.id);
  }

  @Post("items")
  @ApiOperation({ summary: "Add or overwrite cart line" })
  @ApiOkResponse()
  async add(@CurrentUser() user: User, @Body() body: UpsertCartItemDto) {
    return this.cart.upsertItem(user.id, body);
  }

  @Patch("items/:itemId")
  @ApiOperation({ summary: "Update line quantity (0 removes line)" })
  @ApiOkResponse()
  async updateQty(
    @CurrentUser() user: User,
    @Param("itemId") itemId: string,
    @Body() body: UpdateCartItemDto,
  ) {
    return this.cart.updateItemQty(user.id, itemId, body.qty);
  }

  @Delete("items/:itemId")
  @ApiOperation({ summary: "Remove cart line" })
  @ApiOkResponse()
  async remove(@CurrentUser() user: User, @Param("itemId") itemId: string) {
    return this.cart.removeItem(user.id, itemId);
  }

  @Post("clear")
  @ApiOperation({ summary: "Clear cart lines" })
  @ApiOkResponse()
  async clear(@CurrentUser() user: User) {
    return this.cart.clear(user.id);
  }
}

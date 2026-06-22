import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { WishlistService } from "./wishlist.service";

@ApiTags("wishlist")
@ApiBearerAuth("user-jwt")
@UseGuards(JwtUserGuard)
@Controller("wishlist")
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.wishlist.list(user.id);
  }

  @Post("toggle")
  toggle(@CurrentUser() user: User, @Body() body: { productId: string }) {
    return this.wishlist.toggle(user.id, body.productId);
  }

  @Patch("notify-prefs")
  notifyPrefs(
    @CurrentUser() user: User,
    @Body() body: { productId: string; notifyBackInStock?: boolean; notifyPriceDrop?: boolean },
  ) {
    return this.wishlist.updatePrefs(user.id, body.productId, body);
  }
}


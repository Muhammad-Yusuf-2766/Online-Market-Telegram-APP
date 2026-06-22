import { Body, Controller, Get, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import type { ReferralTreeNode } from "./users.service";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth("user-jwt")
@UseGuards(JwtUserGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  @ApiOperation({ summary: "Current Telegram-linked user profile" })
  @ApiOkResponse({ description: "User record" })
  async me(@CurrentUser() user: User): Promise<User> {
    return this.users.getMe(user.id);
  }

  @Patch("me")
  @ApiOperation({ summary: "Update profile fields (phone, name, birthday)" })
  @ApiOkResponse({ description: "Updated user" })
  async patchMe(@CurrentUser() user: User, @Body() body: UpdateProfileDto): Promise<User> {
    return this.users.updateMe(user.id, body);
  }

  @Get("me/referral-tree")
  @ApiOperation({ summary: "Nested referral tree for visualization" })
  @ApiOkResponse()
  async referralTree(
    @CurrentUser() user: User,
    @Query("maxDepth") maxDepthRaw?: string,
  ): Promise<ReferralTreeNode> {
    const n = Number(maxDepthRaw ?? "5");
    const maxDepth = Number.isFinite(n) ? n : 5;
    return this.users.getReferralTree(user.id, maxDepth);
  }

  @Get("me/coin-inbox")
  @ApiOperation({ summary: "Coin celebration entries since last ack" })
  @ApiOkResponse()
  async coinInbox(@CurrentUser() user: User) {
    return this.users.getCoinInbox(user.id);
  }

  @Post("me/coin-inbox/ack")
  @ApiOperation({ summary: "Mark coin inbox as seen" })
  @ApiOkResponse()
  async coinInboxAck(@CurrentUser() user: User) {
    return this.users.ackCoinInbox(user.id);
  }

  @Get("me/recently-viewed")
  @ApiOperation({ summary: "Recently viewed products from analytics events" })
  @ApiOkResponse()
  async recentlyViewed(@CurrentUser() user: User) {
    return this.users.getRecentlyViewed(user.id);
  }
}

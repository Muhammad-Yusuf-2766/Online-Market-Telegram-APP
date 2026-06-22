import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UpdateProfileDto } from "./dto/update-profile.dto";
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
  @ApiOperation({ summary: "Update profile fields" })
  @ApiOkResponse({ description: "Updated user" })
  async patchMe(@CurrentUser() user: User, @Body() body: UpdateProfileDto): Promise<User> {
    return this.users.updateMe(user.id, body);
  }
}

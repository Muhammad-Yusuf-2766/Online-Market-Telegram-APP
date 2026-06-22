import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AddressesService } from "./addresses.service";
import { CreateUserAddressDto } from "./dto/create-user-address.dto";
import { UpdateUserAddressDto } from "./dto/update-user-address.dto";

@ApiTags("addresses")
@Controller()
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get("addresses/search")
  @ApiOperation({ summary: "Search Korean addresses through Kakao Local API" })
  @ApiOkResponse()
  search(@Query("q") q = "") {
    return this.addresses.search(q);
  }

  @Get("users/me/addresses")
  @ApiBearerAuth("user-jwt")
  @UseGuards(JwtUserGuard)
  list(@CurrentUser() user: User) {
    return this.addresses.listForUser(user.id);
  }

  @Post("users/me/addresses")
  @ApiBearerAuth("user-jwt")
  @UseGuards(JwtUserGuard)
  create(@CurrentUser() user: User, @Body() body: CreateUserAddressDto) {
    return this.addresses.createForUser(user.id, body);
  }

  @Patch("users/me/addresses/:id")
  @ApiBearerAuth("user-jwt")
  @UseGuards(JwtUserGuard)
  update(@CurrentUser() user: User, @Param("id") id: string, @Body() body: UpdateUserAddressDto) {
    return this.addresses.updateForUser(user.id, id, body);
  }

  @Delete("users/me/addresses/:id")
  @ApiBearerAuth("user-jwt")
  @UseGuards(JwtUserGuard)
  remove(@CurrentUser() user: User, @Param("id") id: string) {
    return this.addresses.deleteForUser(user.id, id);
  }
}

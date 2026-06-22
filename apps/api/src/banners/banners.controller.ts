import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { BannersService } from "./banners.service";

@ApiTags("banners")
@Controller("banners")
export class BannersController {
  constructor(private readonly banners: BannersService) {}

  @Get()
  @ApiOperation({ summary: "Active storefront banners" })
  @ApiOkResponse({ description: "Banner list" })
  listActive() {
    return this.banners.listActive();
  }
}

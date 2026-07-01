import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { UpdateMarketBrandingDto } from "./dto/update-market-branding.dto";
import { MarketBrandingService } from "./market-branding.service";

@ApiTags("settings")
@Controller()
export class MarketBrandingController {
  constructor(private readonly branding: MarketBrandingService) {}

  @Get("settings/branding")
  @ApiOperation({ summary: "Public market branding settings" })
  @ApiOkResponse({ description: "Market branding" })
  getPublicBranding() {
    return this.branding.getBranding();
  }

  @Get("admin/settings/branding")
  @ApiBearerAuth("admin-jwt")
  @UseGuards(JwtAdminGuard)
  @ApiOperation({ summary: "Admin market branding settings" })
  @ApiOkResponse({ description: "Market branding" })
  getAdminBranding() {
    return this.branding.getBranding();
  }

  @Patch("admin/settings/branding")
  @ApiBearerAuth("admin-jwt")
  @UseGuards(JwtAdminGuard)
  @ApiOperation({ summary: "Update market branding settings" })
  @ApiOkResponse({ description: "Updated market branding" })
  updateBranding(@Body() body: UpdateMarketBrandingDto) {
    return this.branding.updateBranding(body);
  }
}

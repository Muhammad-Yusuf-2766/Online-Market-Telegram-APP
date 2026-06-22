import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import { AdminCampaignsService } from "./admin-campaigns.service";
import { CampaignStatsQueryDto } from "./dto/campaign-stats-query.dto";
import { CreateCampaignDto } from "./dto/create-campaign.dto";

@ApiTags("admin-campaigns")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller("admin/campaigns")
export class AdminCampaignsController {
  constructor(private readonly campaigns: AdminCampaignsService) {}

  /** Static path before `:slug/stats` so `link-help` is never parsed as a campaign slug. */
  @Get("helpers/link-help")
  @RequirePermissions(PERMISSIONS.campaigns.view)
  @ApiOperation({ summary: "Env hints and sample Mini App URL template" })
  linkHelp() {
    return this.campaigns.linkHelp();
  }

  @Get("helpers/check-slug")
  @RequirePermissions(PERMISSIONS.campaigns.view)
  @ApiOperation({ summary: "Validate slug format, uniqueness, and preview Mini App URL" })
  checkSlug(@Query("slug") slug: string) {
    return this.campaigns.checkSlug(slug ?? "");
  }

  @Post()
  @RequirePermissions(PERMISSIONS.campaigns.manage)
  @ApiOperation({ summary: "Create traffic campaign (slug for startapp=c_<slug>)" })
  async create(@Body() body: CreateCampaignDto) {
    return this.campaigns.create(body.slug, body.name);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.campaigns.view)
  @ApiOperation({ summary: "List campaigns with attributed user counts" })
  async list() {
    return this.campaigns.list();
  }

  @Get(":slug/stats")
  @RequirePermissions(PERMISSIONS.campaigns.view)
  @ApiOperation({ summary: "Campaign signup series (defaults to last 14 days UTC if from/to omitted)" })
  async stats(@Param("slug") slug: string, @Query() q: CampaignStatsQueryDto): Promise<unknown> {
    const to = q.to ?? new Date().toISOString().slice(0, 10);
    const from =
      q.from ??
      (() => {
        const t = new Date(`${to}T12:00:00.000Z`);
        t.setUTCDate(t.getUTCDate() - 13);
        return t.toISOString().slice(0, 10);
      })();
    return this.campaigns.stats(slug, from, to);
  }
}

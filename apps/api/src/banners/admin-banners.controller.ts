import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { BannersService } from "./banners.service";

@ApiTags("admin-banners")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard)
@Controller("admin/banners")
export class AdminBannersController {
  constructor(private readonly banners: BannersService) {}

  @Get()
  list() {
    return this.banners.listAll();
  }

  @Post()
  create(
    @Body()
    body: {
      imageUrl: string;
      title?: string;
      linkUrl?: string;
      sortOrder?: number;
      isActive?: boolean;
      startsAt?: string;
      endsAt?: string;
    },
  ) {
    return this.banners.create(body);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body()
    body: Partial<{
      imageUrl: string;
      title: string | null;
      linkUrl: string | null;
      sortOrder: number;
      isActive: boolean;
      startsAt: string | null;
      endsAt: string | null;
    }>,
  ) {
    return this.banners.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.banners.remove(id);
  }
}

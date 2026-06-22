import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { CategoriesService } from "./categories.service";

@ApiTags("categories")
@Controller()
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get("categories")
  list() {
    return this.categories.list();
  }

  @Get("admin/categories")
  @ApiBearerAuth("admin-jwt")
  @UseGuards(JwtAdminGuard)
  listAdmin() {
    return this.categories.list();
  }

  @Post("admin/categories")
  @ApiBearerAuth("admin-jwt")
  @UseGuards(JwtAdminGuard)
  create(@Body() body: { slug: string; name: string; parentId?: string; sortOrder?: number }) {
    return this.categories.create(body);
  }

  @Patch("admin/categories/:id")
  @ApiBearerAuth("admin-jwt")
  @UseGuards(JwtAdminGuard)
  update(
    @Param("id") id: string,
    @Body() body: Partial<{ slug: string; name: string; parentId: string | null; sortOrder: number }>,
  ) {
    return this.categories.update(id, body);
  }

  @Delete("admin/categories/:id")
  @ApiBearerAuth("admin-jwt")
  @UseGuards(JwtAdminGuard)
  remove(@Param("id") id: string) {
    return this.categories.remove(id);
  }
}

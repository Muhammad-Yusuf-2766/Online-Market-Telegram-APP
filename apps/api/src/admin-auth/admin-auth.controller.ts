import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentAdmin } from "../common/decorators/current-admin.decorator";
import type { AdminUserWithPermissions } from "../common/rbac/admin-user-with-permissions";
import { AdminAuthService } from "./admin-auth.service";
import { AdminAuthResponseDto } from "./dto/admin-auth-response.dto";
import { AdminLoginDto } from "./dto/admin-login.dto";
import { JwtAdminGuard } from "./guards/jwt-admin.guard";

@ApiTags("admin-auth")
@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly adminAuth: AdminAuthService) {}

  @Post("login")
  @ApiOperation({ summary: "Admin email/password login" })
  @ApiOkResponse({ type: AdminAuthResponseDto })
  async login(@Body() body: AdminLoginDto): Promise<AdminAuthResponseDto> {
    return this.adminAuth.login(body.email, body.password);
  }

  @Get("me")
  @UseGuards(JwtAdminGuard)
  @ApiBearerAuth("admin-jwt")
  @ApiOperation({ summary: "Current admin profile and permissions" })
  me(@CurrentAdmin() admin: AdminUserWithPermissions) {
    return this.adminAuth.toMeResponse(admin);
  }
}

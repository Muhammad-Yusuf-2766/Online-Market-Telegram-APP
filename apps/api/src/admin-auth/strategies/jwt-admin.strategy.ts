import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import {
  adminUserWithPermissionsInclude,
  type AdminUserWithPermissions,
} from "../../common/rbac/admin-user-with-permissions";
import { PrismaService } from "../../prisma/prisma.service";

export type JwtAdminPayload = { sub: string; typ?: string };

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, "jwt-admin") {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("ADMIN_JWT_SECRET"),
    });
  }

  async validate(payload: JwtAdminPayload): Promise<AdminUserWithPermissions> {
    if (payload.typ !== "admin" || !payload.sub) {
      throw new UnauthorizedException();
    }
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
      include: adminUserWithPermissionsInclude,
    });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException();
    }
    return admin;
  }
}

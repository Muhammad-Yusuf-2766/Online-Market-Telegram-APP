import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import {
  adminUserWithPermissionsInclude,
  collectEffectivePermissionKeys,
  type AdminUserWithPermissions,
} from "../common/rbac/admin-user-with-permissions";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async login(email: string, password: string): Promise<{ accessToken: string; expiresIn: number }> {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const expiresIn = this.parseExpiresIn(this.config.get<string>("ADMIN_JWT_EXPIRES_IN") ?? "1d");
    const accessToken = await this.jwt.signAsync({
      sub: admin.id,
      typ: "admin",
    });

    return { accessToken, expiresIn };
  }

  async getMe(adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      include: adminUserWithPermissionsInclude,
    });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException();
    }
    return this.toMeResponse(admin);
  }

  toMeResponse(admin: AdminUserWithPermissions) {
    return {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      isActive: admin.isActive,
      role: admin.role
        ? {
            id: admin.role.id,
            key: admin.role.key,
            name: admin.role.name,
            isSuperAdmin: admin.role.isSuperAdmin,
          }
        : null,
      permissions: collectEffectivePermissionKeys(admin),
    };
  }

  private parseExpiresIn(value: string): number {
    const m = /^(\d+)([smhd])$/i.exec(value.trim());
    if (m) {
      const n = Number(m[1]);
      const u = m[2].toLowerCase();
      const mult = u === "s" ? 1 : u === "m" ? 60 : u === "h" ? 3600 : 86400;
      return n * mult;
    }
    const asNum = Number(value);
    if (!Number.isNaN(asNum) && asNum > 0) {
      return asNum;
    }
    return 86400;
  }
}

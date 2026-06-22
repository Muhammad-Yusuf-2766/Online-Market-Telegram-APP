import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import type { User } from "@prisma/client";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../prisma/prisma.service";

export type JwtUserPayload = { sub: string; typ?: string };

@Injectable()
export class JwtUserStrategy extends PassportStrategy(Strategy, "jwt-user") {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_SECRET"),
    });
  }

  async validate(payload: JwtUserPayload): Promise<User> {
    if (payload.typ !== "user" || !payload.sub) {
      throw new UnauthorizedException();
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}

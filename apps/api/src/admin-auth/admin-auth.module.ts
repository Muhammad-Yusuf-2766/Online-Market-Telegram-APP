import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AdminAuthController } from "./admin-auth.controller";
import { AdminAuthService } from "./admin-auth.service";
import { JwtAdminStrategy } from "./strategies/jwt-admin.strategy";

@Module({
  imports: [
    PassportModule.register({}),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("ADMIN_JWT_SECRET"),
        signOptions: {
          expiresIn: config.get<string>("ADMIN_JWT_EXPIRES_IN") ?? "1d",
        },
      }),
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, JwtAdminStrategy],
  exports: [AdminAuthService, JwtModule],
})
export class AdminAuthModule {}

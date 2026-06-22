import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtUserStrategy } from "./strategies/jwt-user.strategy";

@Module({
  imports: [
    PassportModule.register({}),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: config.get<string>("JWT_EXPIRES_IN") ?? "7d",
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtUserStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}

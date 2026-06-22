import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { AuthModule } from "../auth/auth.module";
import { PromotionsController } from "./promotions.controller";
import { PromotionsService } from "./promotions.service";

@Module({
  imports: [AdminAuthModule, AuthModule],
  controllers: [PromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}


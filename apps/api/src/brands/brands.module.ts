import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { BrandsController } from "./brands.controller";
import { BrandsService } from "./brands.service";

@Module({
  imports: [AdminAuthModule],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {}


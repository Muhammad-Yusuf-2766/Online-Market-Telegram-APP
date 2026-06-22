import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { FragranceFamiliesController } from "./fragrance-families.controller";
import { FragranceFamiliesService } from "./fragrance-families.service";

@Module({
  imports: [AdminAuthModule],
  controllers: [FragranceFamiliesController],
  providers: [FragranceFamiliesService],
  exports: [FragranceFamiliesService],
})
export class FragranceFamiliesModule {}

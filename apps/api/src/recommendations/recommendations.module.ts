import { Module } from "@nestjs/common";
import { ProductsModule } from "../products/products.module";
import { UsersModule } from "../users/users.module";
import { RecommendationsController } from "./recommendations.controller";
import { RecommendationsService } from "./recommendations.service";

@Module({
  imports: [ProductsModule, UsersModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}


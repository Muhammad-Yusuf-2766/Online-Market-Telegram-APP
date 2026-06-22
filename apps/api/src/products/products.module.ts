import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { AuthModule } from "../auth/auth.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { AdminProductFeedbackController } from "./admin-product-feedback.controller";
import { AdminProductsController } from "./admin-products.controller";
import { AdminSizePresetsController } from "./admin-size-presets.controller";
import { ProductFeedbackController } from "./product-feedback.controller";
import { ProductFeedbackService } from "./product-feedback.service";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { SizePresetsService } from "./size-presets.service";

@Module({
  imports: [AdminAuthModule, AuthModule, RealtimeModule],
  controllers: [
    ProductsController,
    ProductFeedbackController,
    AdminProductsController,
    AdminProductFeedbackController,
    AdminSizePresetsController,
  ],
  providers: [ProductsService, ProductFeedbackService, SizePresetsService],
  exports: [ProductsService, ProductFeedbackService, SizePresetsService],
})
export class ProductsModule {}

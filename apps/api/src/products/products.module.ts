import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { AuthModule } from "../auth/auth.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { StorageModule } from "../storage/storage.module";
import { AdminProductFeedbackController } from "./admin-product-feedback.controller";
import { AdminProductsController } from "./admin-products.controller";
import { ProductFeedbackController } from "./product-feedback.controller";
import { ProductFeedbackService } from "./product-feedback.service";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";

@Module({
  imports: [AdminAuthModule, AuthModule, RealtimeModule, StorageModule],
  controllers: [
    ProductsController,
    ProductFeedbackController,
    AdminProductsController,
    AdminProductFeedbackController,
  ],
  providers: [ProductsService, ProductFeedbackService],
  exports: [ProductsService, ProductFeedbackService],
})
export class ProductsModule {}

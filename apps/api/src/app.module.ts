import { join } from "node:path";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminCampaignsModule } from "./admin-campaigns/admin-campaigns.module";
import { AdminCoinsModule } from "./admin-coins/admin-coins.module";
import { AdminFinanceModule } from "./admin-finance/admin-finance.module";
import { AdminStatsModule } from "./admin-stats/admin-stats.module";
import { AdminUsersModule } from "./admin-users/admin-users.module";
import { AdminAuthModule } from "./admin-auth/admin-auth.module";
import { AdminSettingsModule } from "./admin-settings/admin-settings.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { AuthModule } from "./auth/auth.module";
import { BannersModule } from "./banners/banners.module";
import { BrandsModule } from "./brands/brands.module";
import { CartModule } from "./cart/cart.module";
import { CategoriesModule } from "./categories/categories.module";
import { FragranceFamiliesModule } from "./fragrance-families/fragrance-families.module";
import { HealthModule } from "./health/health.module";
import { InventoryModule } from "./inventory/inventory.module";
import { LifecycleModule } from "./lifecycle/lifecycle.module";
import { OrdersModule } from "./orders/orders.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RewardSettingsModule } from "./reward-settings/reward-settings.module";
import { ProductsModule } from "./products/products.module";
import { PromotionsModule } from "./promotions/promotions.module";
import { RecommendationsModule } from "./recommendations/recommendations.module";
import { BroadcastsModule } from "./broadcasts/broadcasts.module";
import { SegmentsModule } from "./segments/segments.module";
import { StorageModule } from "./storage/storage.module";
import { UsersModule } from "./users/users.module";
import { WishlistModule } from "./wishlist/wishlist.module";
import { RbacModule } from "./common/rbac/rbac.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Always load apps/api/.env (Nest default only reads cwd/.env; pnpm may run with repo root cwd).
      envFilePath: join(__dirname, "..", ".env"),
    }),
    PrismaModule,
    RbacModule,
    AuthModule,
    BannersModule,
    BrandsModule,
    CartModule,
    CategoriesModule,
    FragranceFamiliesModule,
    AdminAuthModule,
    AdminSettingsModule,
    InventoryModule,
    LifecycleModule,
    AnalyticsModule,
    NotificationsModule,
    AdminUsersModule,
    AdminStatsModule,
    RewardSettingsModule,
    AdminCoinsModule,
    AdminFinanceModule,
    AdminCampaignsModule,
    UsersModule,
    ProductsModule,
    PromotionsModule,
    RecommendationsModule,
    SegmentsModule,
    BroadcastsModule,
    OrdersModule,
    StorageModule,
    HealthModule,
    WishlistModule,
  ],
})
export class AppModule {}

import { join } from "node:path";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AddressesModule } from "./addresses/addresses.module";
import { AdminAuthModule } from "./admin-auth/admin-auth.module";
import { AdminFinanceModule } from "./admin-finance/admin-finance.module";
import { AdminSettingsModule } from "./admin-settings/admin-settings.module";
import { AdminStatsModule } from "./admin-stats/admin-stats.module";
import { AdminUsersModule } from "./admin-users/admin-users.module";
import { AuthModule } from "./auth/auth.module";
import { BannersModule } from "./banners/banners.module";
import { BroadcastsModule } from "./broadcasts/broadcasts.module";
import { CartModule } from "./cart/cart.module";
import { CategoriesModule } from "./categories/categories.module";
import { HealthModule } from "./health/health.module";
import { InventoryModule } from "./inventory/inventory.module";
import { MeasurementUnitsModule } from "./measurement-units/measurement-units.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { OrdersModule } from "./orders/orders.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProductsModule } from "./products/products.module";
import { StorageModule } from "./storage/storage.module";
import { TelegramNotifyModule } from "./telegram/telegram-notify.module";
import { UsersModule } from "./users/users.module";
import { WishlistModule } from "./wishlist/wishlist.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, "..", ".env"),
    }),
    PrismaModule,
    AuthModule,
    AdminAuthModule,
    TelegramNotifyModule,
    BannersModule,
    CartModule,
    CategoriesModule,
    MeasurementUnitsModule,
    AddressesModule,
    NotificationsModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    InventoryModule,
    AdminUsersModule,
    AdminStatsModule,
    AdminFinanceModule,
    BroadcastsModule,
    AdminSettingsModule,
    StorageModule,
    HealthModule,
    WishlistModule,
  ],
})
export class AppModule {}

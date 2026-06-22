import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";

@Module({
  imports: [AdminAuthModule],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}


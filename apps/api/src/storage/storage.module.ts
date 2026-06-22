import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { StorageController } from "./storage.controller";
import { StorageService } from "./storage.service";

@Module({
  imports: [AdminAuthModule],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}

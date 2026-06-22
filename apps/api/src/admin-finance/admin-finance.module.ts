import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminFinanceController } from "./admin-finance.controller";
import { AdminFinanceService } from "./admin-finance.service";

@Module({
  imports: [PrismaModule, AdminAuthModule],
  controllers: [AdminFinanceController],
  providers: [AdminFinanceService],
  exports: [AdminFinanceService],
})
export class AdminFinanceModule {}

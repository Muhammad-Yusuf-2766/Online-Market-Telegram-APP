import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminStatsController } from "./admin-stats.controller";
import { AdminStatsService } from "./admin-stats.service";

@Module({
  imports: [PrismaModule, AdminAuthModule],
  controllers: [AdminStatsController],
  providers: [AdminStatsService],
})
export class AdminStatsModule {}

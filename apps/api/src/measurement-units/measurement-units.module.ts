import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { MeasurementUnitsController } from "./measurement-units.controller";
import { MeasurementUnitsService } from "./measurement-units.service";

@Module({
  imports: [AdminAuthModule],
  controllers: [MeasurementUnitsController],
  providers: [MeasurementUnitsService],
  exports: [MeasurementUnitsService],
})
export class MeasurementUnitsModule {}

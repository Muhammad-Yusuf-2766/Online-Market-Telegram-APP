import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { SegmentsController } from "./segments.controller";
import { SegmentsService } from "./segments.service";

@Module({
  imports: [AdminAuthModule],
  controllers: [SegmentsController],
  providers: [SegmentsService],
  exports: [SegmentsService],
})
export class SegmentsModule {}


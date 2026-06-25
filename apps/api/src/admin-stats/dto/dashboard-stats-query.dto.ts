import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional } from "class-validator";

export class DashboardStatsQueryDto {
  @ApiPropertyOptional({ example: "2026-04-01" })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: "2026-04-12" })
  @IsOptional()
  @IsDateString()
  to?: string;
}

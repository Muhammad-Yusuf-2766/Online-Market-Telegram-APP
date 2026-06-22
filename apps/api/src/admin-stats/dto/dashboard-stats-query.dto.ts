import { ApiProperty } from "@nestjs/swagger";
import { IsDateString } from "class-validator";

export class DashboardStatsQueryDto {
  @ApiProperty({ example: "2026-04-01" })
  @IsDateString()
  from!: string;

  @ApiProperty({ example: "2026-04-12" })
  @IsDateString()
  to!: string;
}

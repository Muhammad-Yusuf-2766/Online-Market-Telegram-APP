import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsDateString, IsOptional } from "class-validator";

export class FinanceReportQueryDto {
  @ApiProperty({ example: "2026-04-01" })
  @IsDateString()
  from!: string;

  @ApiProperty({ example: "2026-04-30" })
  @IsDateString()
  to!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  compare?: boolean;
}

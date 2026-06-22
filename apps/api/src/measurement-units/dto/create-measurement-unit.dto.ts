import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Matches, MaxLength, Min } from "class-validator";

export class CreateMeasurementUnitDto {
  @ApiProperty()
  @IsString()
  @MaxLength(60)
  @Matches(/^[a-z0-9-]+$/)
  slug!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20)
  symbol!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowDecimal?: boolean;
}

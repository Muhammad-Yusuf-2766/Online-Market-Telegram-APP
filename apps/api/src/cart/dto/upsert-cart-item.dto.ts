import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpsertCartItemDto {
  @ApiProperty()
  @IsString()
  @MaxLength(64)
  productId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sizeSlug?: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  qty!: number;
}


import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdateMarketBrandingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  marketName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  marketSlogan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  marketLogoUrl?: string | null;

  @ApiPropertyOptional({ minimum: 0, description: "Delivery price in KRW" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  deliveryPriceKrw?: number;

  @ApiPropertyOptional({ minimum: 0, description: "Free delivery threshold in KRW" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  freeDeliveryThresholdKrw?: number;
}

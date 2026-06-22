import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { OrderLineDto } from "./order-line.dto";

export class CreateOrderDto {
  @ApiProperty({ type: [OrderLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items!: OrderLineDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  deliveryPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deliveryFirstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deliveryLastName?: string;

  @ApiPropertyOptional({ description: "Also updates profile when provided (ISO date)" })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ description: "Shipping latitude (WGS84), from Telegram location / map picker" })
  @ValidateIf((_, v) => v !== undefined && v !== null)
  @IsNumber()
  @Min(-90)
  @Max(90)
  deliveryLatitude?: number;

  @ApiPropertyOptional({ description: "Shipping longitude (WGS84), from Telegram location / map picker" })
  @ValidateIf((_, v) => v !== undefined && v !== null)
  @IsNumber()
  @Min(-180)
  @Max(180)
  deliveryLongitude?: number;

  @ApiPropertyOptional({ description: "How many coins (1 coin = 1 UZS) to apply toward this order" })
  @IsOptional()
  @IsInt()
  @Min(0)
  coinsToSpendUzs?: number;

  @ApiPropertyOptional({ description: "Optional promo code" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  promoCode?: string;
}

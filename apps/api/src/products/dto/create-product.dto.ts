import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { ProductSizeLineDto } from "./product-size-line.dto";

export enum ProductGenderDto {
  MEN = "MEN",
  WOMEN = "WOMEN",
  UNISEX = "UNISEX",
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  description?: string;

  @ApiProperty({
    description:
      "Base price in UZS (integer). If `sizes` is set, server sets catalog `priceUzs` from 10 g if present, else minimum size price.",
  })
  @IsInt()
  @Min(0)
  priceUzs!: number;

  @ApiPropertyOptional({
    type: [ProductSizeLineDto],
    description: "Lines referencing ProductSizePreset ids with per-product prices.",
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductSizeLineDto)
  sizes?: ProductSizeLineDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: "Optional inventory; omit for untracked stock" })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  familyId?: string;

  @ApiPropertyOptional({ enum: ProductGenderDto, default: ProductGenderDto.UNISEX })
  @IsOptional()
  @IsEnum(ProductGenderDto)
  gender?: ProductGenderDto;

  @ApiPropertyOptional({ type: [String], description: "Top notes (free text labels)." })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notesTop?: string[];

  @ApiPropertyOptional({ type: [String], description: "Heart notes." })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notesHeart?: string[];

  @ApiPropertyOptional({ type: [String], description: "Base notes." })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notesBase?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isBestseller?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isNewArrival?: boolean;

  @ApiPropertyOptional({ description: "4-digit fragrance release year." })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(3000)
  releaseYear?: number;

  @ApiPropertyOptional({ description: "Original (pre-discount) price in UZS." })
  @IsOptional()
  @IsInt()
  @Min(0)
  oldPriceUzs?: number;

  @ApiPropertyOptional({ description: "Discount percent (0..100)." })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ description: "Threshold for low-stock alerts." })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ description: "Total volume in stock in grams (parfum)." })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockGrams?: number;

  @ApiPropertyOptional({ description: "Low-stock threshold in grams." })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockGramsThreshold?: number;
}

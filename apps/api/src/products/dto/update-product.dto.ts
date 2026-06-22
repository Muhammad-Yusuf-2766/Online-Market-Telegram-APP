import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
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
import { ProductGenderDto } from "./create-product.dto";
import { ProductSizeLineDto } from "./product-size-line.dto";

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  priceUzs?: number;

  @ApiPropertyOptional({
    type: [ProductSizeLineDto],
    description: "Replace size lines; send [] to clear and use single priceUzs only.",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSizeLineDto)
  sizes?: ProductSizeLineDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number | null;

  @ApiPropertyOptional({ description: "Pass null to unlink." })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  categoryId?: string | null;

  @ApiPropertyOptional({ description: "Pass null to unlink." })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  brandId?: string | null;

  @ApiPropertyOptional({ description: "Pass null to unlink." })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  familyId?: string | null;

  @ApiPropertyOptional({ enum: ProductGenderDto })
  @IsOptional()
  @IsEnum(ProductGenderDto)
  gender?: ProductGenderDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notesTop?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notesHeart?: string[];

  @ApiPropertyOptional({ type: [String] })
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(3000)
  releaseYear?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  oldPriceUzs?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number | null;

  @ApiPropertyOptional({ description: "Total grams in stock (parfum)." })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockGrams?: number | null;

  @ApiPropertyOptional({ description: "Low-stock threshold in grams." })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockGramsThreshold?: number | null;
}

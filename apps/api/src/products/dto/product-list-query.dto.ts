import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

function toBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.toLowerCase();
    if (v === "true" || v === "1" || v === "yes") return true;
    if (v === "false" || v === "0" || v === "no") return false;
  }
  return undefined;
}

export enum ProductListSort {
  NEWEST = "newest",
  PRICE_ASC = "price_asc",
  PRICE_DESC = "price_desc",
  TITLE_ASC = "title_asc",
  TITLE_DESC = "title_desc",
  RATING_ASC = "rating_asc",
  RATING_DESC = "rating_desc",
  BESTSELLING = "bestselling",
}

export class ProductListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "Search title or description" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @ApiPropertyOptional({ enum: ProductListSort, default: ProductListSort.NEWEST })
  @IsOptional()
  @IsEnum(ProductListSort)
  sort?: ProductListSort;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({ description: "Comma-separated category ids" })
  @IsOptional()
  @IsString()
  categoryIds?: string;

  @ApiPropertyOptional({ description: "Minimum KRW price" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ description: "Maximum KRW price" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  bestseller?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  onSale?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  inStockOnly?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  includeInactive?: boolean;
}

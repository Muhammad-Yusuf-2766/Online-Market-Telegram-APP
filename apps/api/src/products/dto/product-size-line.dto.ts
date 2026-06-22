import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, Min, MinLength } from "class-validator";

export class ProductSizeLineDto {
  @ApiProperty({ description: "ProductSizePreset id" })
  @IsString()
  @MinLength(1)
  presetId!: string;

  @ApiProperty({ description: "Price in UZS (integer, e.g. 200000)" })
  @IsInt()
  @Min(0)
  priceUzs!: number;
}

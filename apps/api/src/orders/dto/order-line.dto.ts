import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class OrderLineDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  productId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({
    description: "Required when the product defines `sizes`; must match a size id.",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  sizeId?: string;
}

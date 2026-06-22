import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, Max } from "class-validator";

export class CreateProductFeedbackDto {
  @ApiProperty({ description: "Order that contains this product (same id as in order details)" })
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  stars!: number;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

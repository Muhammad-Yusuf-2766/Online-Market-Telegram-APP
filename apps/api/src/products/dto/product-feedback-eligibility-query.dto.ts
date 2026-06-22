import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ProductFeedbackEligibilityQueryDto {
  @ApiProperty({ description: "Order id (must contain this product; feedback only from order details)" })
  @IsString()
  @IsNotEmpty()
  orderId!: string;
}

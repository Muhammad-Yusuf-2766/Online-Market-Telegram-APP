import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, MaxLength, Min } from "class-validator";

export class UpsertCartItemDto {
  @ApiProperty()
  @IsString()
  @MaxLength(64)
  productId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  qty!: number;
}

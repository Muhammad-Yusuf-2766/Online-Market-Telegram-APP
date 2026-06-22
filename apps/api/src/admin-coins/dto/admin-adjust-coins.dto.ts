import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsString, MaxLength, MinLength } from "class-validator";

export class AdminAdjustCoinsDto {
  @ApiProperty({ description: "Current admin password (re-auth)" })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ description: "Positive to add coins, negative to subtract" })
  @IsInt()
  deltaUzs!: number;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

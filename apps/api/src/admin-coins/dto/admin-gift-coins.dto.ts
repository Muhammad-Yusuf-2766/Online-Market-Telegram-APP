import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsString, MaxLength, Min, MinLength } from "class-validator";

export class AdminGiftCoinsDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: "HTTPS URL or storage key resolved like product images" })
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  coins!: number;
}

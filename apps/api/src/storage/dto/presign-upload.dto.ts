import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, MinLength, Matches } from "class-validator";

export class PresignUploadDto {
  @ApiProperty({ example: "image/jpeg" })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  contentType!: string;

  @ApiPropertyOptional({
    description: "Object key prefix (letters, numbers, slashes, dashes, dots)",
    example: "products/",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-zA-Z0-9/_.-]+$/, { message: "Invalid key prefix" })
  keyPrefix?: string;
}

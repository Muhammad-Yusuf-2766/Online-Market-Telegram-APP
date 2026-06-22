import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MinLength } from "class-validator";

export class CreatePermissionDto {
  @ApiProperty({ example: "reports.export" })
  @IsString()
  @MinLength(2)
  @Matches(/^[a-z][a-z0-9._-]*$/)
  key!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

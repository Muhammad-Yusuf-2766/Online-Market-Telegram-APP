import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MinLength } from "class-validator";

export class UpdateRoleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @Matches(/^[a-z][a-z0-9_]*$/)
  key?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;
}

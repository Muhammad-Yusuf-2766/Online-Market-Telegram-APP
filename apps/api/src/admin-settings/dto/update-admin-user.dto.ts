import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateAdminUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { ApiPropertyOptional } from "@nestjs/swagger";
import { UserGender } from "@prisma/client";
import { IsDateString, IsEnum, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateProfileDto {
  @ApiPropertyOptional({ maxLength: 32 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @ApiPropertyOptional({ description: "ISO date (YYYY-MM-DD)" })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ enum: UserGender })
  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender;

  @ApiPropertyOptional({ enum: ["ru", "uz"], description: "Mini app / bot message language" })
  @IsOptional()
  @IsIn(["ru", "uz"])
  locale?: "ru" | "uz";
}

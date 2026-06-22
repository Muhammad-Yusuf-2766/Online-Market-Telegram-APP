import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, Min } from "class-validator";

export class UpdateRewardSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  referralCoins?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  profileBirthdayCoins?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  profileGenderCoins?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  profileLastNameCoins?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  profileFullCoins?: number;
}

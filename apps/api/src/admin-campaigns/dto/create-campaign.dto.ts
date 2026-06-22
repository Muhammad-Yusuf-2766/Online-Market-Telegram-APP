import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateCampaignDto {
  @ApiProperty({ description: "Used in startapp=c_<slug> (lowercase letters, digits, hyphens)" })
  @IsString()
  @MinLength(2)
  @MaxLength(48)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must be lowercase alphanumeric with optional single hyphens",
  })
  slug!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;
}

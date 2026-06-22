import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";

export class SetPermissionsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissionIds!: string[];
}

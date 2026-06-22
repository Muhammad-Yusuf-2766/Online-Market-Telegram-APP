import { ApiProperty } from "@nestjs/swagger";

export class AdminAuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: 86400 })
  expiresIn!: number;
}

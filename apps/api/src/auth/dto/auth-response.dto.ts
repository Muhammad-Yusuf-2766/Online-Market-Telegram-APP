import { ApiProperty } from "@nestjs/swagger";

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  telegramId!: string;

  @ApiProperty({ nullable: true })
  telegramUsername!: string | null;

  @ApiProperty({ nullable: true })
  firstName!: string | null;

  @ApiProperty({ nullable: true })
  lastName!: string | null;
}

export class TelegramAuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: 604800 })
  expiresIn!: number;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}

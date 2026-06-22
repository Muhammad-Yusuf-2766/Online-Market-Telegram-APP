import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class TelegramAuthDto {
  @ApiProperty({ description: "Raw `initData` string from the Telegram Web App" })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  initDataRaw!: string;
}

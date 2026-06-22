import { Body, Controller, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { AuthUserDto, TelegramAuthResponseDto } from "./dto/auth-response.dto";
import { TelegramAuthDto } from "./dto/telegram-auth.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("telegram")
  @ApiOperation({ summary: "Exchange Telegram Web App initData for a user JWT" })
  @ApiOkResponse({ type: TelegramAuthResponseDto })
  async telegram(@Body() body: TelegramAuthDto): Promise<TelegramAuthResponseDto> {
    const { accessToken, expiresIn, user } = await this.auth.authenticateTelegram(body.initDataRaw);
    const u: AuthUserDto = {
      id: user.id,
      telegramId: user.telegramId,
      telegramUsername: user.telegramUsername,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    return { accessToken, expiresIn, user: u };
  }
}

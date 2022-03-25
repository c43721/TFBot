import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseGuards,
  VERSION_NEUTRAL,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Environment } from "#api/environment/environment";
import { Auth } from "../guards/auth.guard";
import { DiscordSessionGuard } from "../guards/session.guard";
import { UserService } from "#api/users/services/user.service";
import { CurrentUser } from "../decorators/current-user.decorator";
import type { User } from "#api/users/models/user.model";
import { DiscordService } from "#api/discord/services/discord.service";

@Controller({
  path: "auth",
  version: VERSION_NEUTRAL,
})
export class AuthController {
  constructor(
    private environment: Environment,
    private userService: UserService,
    private discordService: DiscordService
  ) {}

  @Get()
  @UseGuards(DiscordSessionGuard)
  login() {}

  @Get("/callback")
  @UseGuards(DiscordSessionGuard)
  async callback(@Res({ passthrough: true }) res: Response) {
    const redirectUrl = this.environment.clientUrl;

    res.redirect(`${redirectUrl}/dashboard`);
  }

  @Get("/logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth()
  async logout(@CurrentUser() { id, accessToken }: User, @Req() req: Request) {
    await Promise.all([
      this.userService.revokeTokens(id, accessToken!),
      this.discordService.deleteCachedGuilds(id),
    ]);

    req.logout();
    return;
  }
}

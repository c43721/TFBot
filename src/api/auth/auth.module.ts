import { DiscordModule } from "#api/discord/discord.module";
import { UsersModule } from "#api/users/users.module";
import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./controllers/auth.controller";
import { SessionSerializer } from "./services/session.serializer";
import { DiscordStrategy } from "./strategies/discord.strategy";

@Module({
  imports: [UsersModule, DiscordModule, PassportModule.register({})],
  controllers: [AuthController],
  providers: [DiscordStrategy, SessionSerializer],
  exports: [],
})
export class AuthModule {}

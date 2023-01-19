import type { CommandOptions } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import type { Message } from "discord.js";
import { send } from "@sapphire/plugin-editable-commands";
import { getSteamIdFromArgs } from "#utils/getSteamId";
import { PayloadCommand } from "#lib/structs/commands/PayloadCommand";
import { LanguageKeys } from "#lib/i18n/all";
import { PlayerCheckProvider } from "#lib/providers/leagueApis";

const FLAGS = [] as const;

@ApplyOptions<CommandOptions>({
  description: LanguageKeys.Commands.Playercheck.Description,
  detailedDescription: LanguageKeys.Commands.Playercheck.DetailedDescription,
  flags: FLAGS,
})
export class UserCommand extends PayloadCommand {
  async messageRun(msg: Message, args: PayloadCommand.Args) {
    const steamId = await args.pick("string").catch(() => null);

    if (!steamId) {
      await send(msg, args.t(LanguageKeys.Commands.Playercheck.MissingId));
      return;
    }

    const testResult = await getSteamIdFromArgs(steamId);

    if (testResult === null) {
      await send(msg, args.t(LanguageKeys.Commands.Playercheck.MalformedId));
      return;
    }

    const provider = this.container.scope.build(PlayerCheckProvider);

    const [etf2l, rgl] = await provider.getPlayerInformation(steamId);

    await send(msg, args.t(LanguageKeys.Commands.Link.Success));
  }
}

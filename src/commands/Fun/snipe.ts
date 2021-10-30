import type { CommandOptions } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { send } from "@sapphire/plugin-editable-commands";
import type { Message } from "discord.js";
import { Server } from "#lib/models/Server";
import { channelCacheExists, getCache, renderMessage } from "#utils/snipeCache";
import type { PayloadClient } from "#lib/PayloadClient";
import { PayloadCommand } from "#lib/structs/commands/PayloadCommand";
import { LanguageKeys } from "#lib/i18n/all";

@ApplyOptions<CommandOptions>({
  description:
    "Retrieves the latest (or number [number]) deleted/edited message from the past 5 minutes.",
  runIn: ["GUILD_TEXT"],
})
export class UserCommand extends PayloadCommand {
  async messageRun(msg: Message, args: PayloadCommand.Args) {
    const guildSetting = await Server.findOne({ id: msg.guild!.id }).lean();

    if (!guildSetting?.enableSnipeForEveryone) {
      if (!msg.member!.permissions.has("MANAGE_MESSAGES")) {
        return;
      }
    }

    const client = this.container.client as PayloadClient;

    if (!channelCacheExists(client, msg) || getCache(client, msg).size == 0) {
      return await send(msg, args.t(LanguageKeys.Commands.Snipe.NoMessages));
    }

    await msg.channel.sendTyping();

    const cache = getCache(client, msg);

    const number = await args.pick("integer", { minimum: 1, maximum: cache.size });

    const ids = [...cache.keys()];
    const targetMessage = cache.get(ids[number])!;

    const snipeData = await renderMessage(targetMessage);

    await msg.channel.send({
      files: [snipeData.buffer],
    });

    if (snipeData.attachments || snipeData.links) {
      await msg.channel.send(snipeData.attachments + "\n" + snipeData.links);
    }

    return true;
  }
}

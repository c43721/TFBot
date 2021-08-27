import { Command } from "../../../lib/exec/Command";
import { Client } from "../../../lib/types/Client";
import { Message } from "discord.js";
import {
  getPingCache,
  pingChannelCacheExists,
  renderMessage,
} from "../../../util/snipe-cache";
import Language from "../../../lib/types/Language";

export default class FindPing extends Command {
  constructor() {
    super(
      "findping",
      "Retrieves a deleted ping (if any exist in cache).",
      undefined,
      ["SEND_MESSAGES", "ATTACH_FILES"],
      undefined,
      ["GUILD_TEXT"]
    );
  }

  async run(client: Client, msg: Message): Promise<boolean> {
    const lang: Language = await this.getLanguage(msg);
    if (
      !pingChannelCacheExists(client, msg) ||
      getPingCache(client, msg).size == 0
    ) {
      return await this.fail(msg, lang.findping_fail_noping);
    }

    await msg.channel.sendTyping();

    const targetMessages = getPingCache(client, msg).filter(
      (message) =>
        !!message.mentions.members.find((member) => member.id == msg.author.id)
    );

    if (targetMessages.size < 1)
      return await this.fail(msg, lang.findping_fail_noping);

    const targetMessage = targetMessages.last();

    const msgData = await renderMessage(targetMessage);

    await msg.channel.send({
      files: [msgData.buffer],
    });

    if (msgData.attachments || msgData.links) {
      await this.respond(msg, msgData.attachments + "\n" + msgData.links);
    }

    return true;
  }
}

import { Command } from "../../../lib/exec/Command";
import { Client } from "../../../lib/types/Client";
import { Message, MessageEmbed } from "discord.js";
import config from "../../../config";
import PayloadColors from "../../../lib/misc/colors";
import { version } from "../../../util/version_control";
import Language from "../../../lib/types/Language";

export default class Info extends Command {
  constructor() {
    super("info", "Gets client info.");
  }

  async run(client: Client, msg: Message): Promise<boolean> {
    const lang: Language = await this.getLanguage(msg);
    
    const embed = new MessageEmbed();
    embed.setAuthor(`${client.user.username}`, client.user.avatarURL());
    embed.setTitle(
      lang.info_embedtitle
        .replace("%users", client.users.cache.size.toString())
        .replace("%servers", client.guilds.cache.size.toString())
    );
    embed.setDescription(
      lang.info_embedbody
        .replace(/%user/gi, client.user.username)
        .replace("%prefix", await this.getPrefix(msg))
    );
    embed.setFooter(
      lang.info_embedfooter
        .replace("%creator", client.users.cache.get(config.allowedID).tag)
        .replace("%version", version),
      client.users.cache.get(config.allowedID).avatarURL()
    );
    embed.setColor(PayloadColors.PAYLOAD);

    await msg.channel.send({ embeds: [embed] });

    return true;
  }
}

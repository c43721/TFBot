import { Command } from "../../../../lib/exec/Command";
import { Client } from "../../../../lib/types";
import { Message, MessageEmbed } from "discord.js";
import PayloadColors from "../../../../lib/misc/colors";
import Language from "../../../../lib/types/Language";

export default class LanguageDelete extends Command {
  constructor() {
    super(
      "delete",
      "Deletes guild language",
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      ["language"]
    );
  }

  async run(client: Client, msg: Message): Promise<boolean> {
    if (!msg.member.permissions.has(["ADMINISTRATOR"])) return false;
    let embed = new MessageEmbed();

    const server = await client.serverManager.getServer(msg.guild.id);
    server.server.language = "en-US";
    await server.save();

    const lang: Language = await this.getLanguage(msg);
    embed.setAuthor(msg.author.tag, msg.author.displayAvatarURL());
    embed.setColor(PayloadColors.ADMIN);
    embed.setDescription(lang.language_delete_success);
    embed.setTitle(
      lang.language_delete_embedfooter.replace("%author", msg.author.tag)
    );
    embed.setTimestamp();

    await msg.channel.send({ embeds: [embed] });
    return true;
  }
}

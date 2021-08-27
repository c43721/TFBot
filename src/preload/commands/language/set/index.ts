import { Command } from "../../../../lib/exec/Command";
import { Client } from "../../../../lib/types";
import { Message, MessageEmbed } from "discord.js";
import PayloadColors from "../../../../lib/misc/colors";

export default class LanguageSet extends Command {
  constructor() {
    super(
      "set",
      "Sets guild language",
      [
        {
          name: "language",
          description: "Your new guild language",
          required: true,
          type: "string",
          options: ["english", "spanish", "polish", "finnish", "german"],
        },
      ],
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
    const args = await this.parseArgs(msg, 2);
    let lang = await this.getLanguage(msg);

    if (args === false) return false;

    const newlang = args[0];
    if (!newlang) return await this.fail(msg, lang.language_set_fail_nonew);

    const server = await client.serverManager.getServer(msg.guild.id);
    let oldlang = server.getLanguageFromGuild(msg.guild.id);

    if (oldlang === newlang)
      return await this.fail(msg, lang.language_set_fail_oldnew);

    let languageSwitch: string;
    switch (newlang) {
      case "english":
        languageSwitch = "en-US";
        break;
      case "spanish":
        languageSwitch = "es-ES";
        break;
      case "polish":
        languageSwitch = "pl-PL";
        break;
      case "finnish":
        languageSwitch = "fi-FI";
        break;
      case "french":
        languageSwitch = "fr-FR";
        break;
      case "german":
        languageSwitch = "de-DE";
        break;
      case "russian":
        languageSwitch = "ru-RU";
        break;
    }

    server.server.language = languageSwitch;

    await server.save();

    let lang1 = await this.getLanguage(msg);

    embed.setAuthor(msg.author.tag, msg.author.displayAvatarURL());
    embed.setColor(PayloadColors.ADMIN);
    embed.setDescription(
      lang1.language_set_success_embeddesc.replace("%language", newlang)
    );
    embed.setTitle(
      lang1.language_set_success_embedtitle.replace("%author", msg.author.tag)
    );
    embed.setTimestamp();

    await msg.channel.send({ embeds: [embed] });
    return true;
  }
}

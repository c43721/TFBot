import { Command } from "../../../lib/exec/Command";
import { Client } from "../../../lib/types/Client";
import { Message, MessageEmbed } from "discord.js";
import Language from "../../../lib/types/Language";
import PayloadColors from "../../../lib/misc/colors";

export default class Profile extends Command {
  constructor() {
    super("profile", "Gets user's profile.", [
      {
        name: "user mention",
        description: "User's profile to get.",
        required: false,
        type: "string",
      },
    ]);
  }

  async run(client: Client, msg: Message): Promise<boolean> {
    const lang: Language = await this.getLanguage(msg);
    const profile = msg.mentions.users.first() || msg.author;
    const user = await client.userManager.getUser(profile.id);
    const steamid = user.user.steamId;

    const description = `
            Bot: ${profile.bot ? "Yes" : "No"}
            ID: ${profile.id}
            Steam ID: ${steamid || "NOT SET"}
            ${lang.profile_points}: ${user.getFeetPushed()}
        `;

    const embed = new MessageEmbed({
      title: profile.tag,
      description,
      color: PayloadColors.USER,
      thumbnail: {
        url: profile.displayAvatarURL(),
      },
    });

    await msg.channel.send({ embeds: [embed] });

    return true;
  }
}

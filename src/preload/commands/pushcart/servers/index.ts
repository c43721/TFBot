import { Command } from "../../../../lib/exec/Command";
import { Client } from "../../../../lib/types";
import { Message, MessageEmbed } from "discord.js";
import { Server } from "../../../../lib/model/Server";
import Language from "../../../../lib/types/Language";
import PayloadColors from "../../../../lib/misc/colors";

export default class Servers extends Command {
  constructor() {
    super(
      "servers",
      "Shows the top 5 pushcart servers.",
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      ["pushcart"]
    );
  }

  async run(client: Client, msg: Message): Promise<boolean> {
    const lang: Language = await this.getLanguage(msg);
    await msg.channel.sendTyping();

    const leaderboard = await Server.aggregate([
      { $match: { fun: { $exists: 1 } } },
      { $project: { id: "$id", pushed: "$fun.payloadFeetPushed" } },
      { $sort: { pushed: -1 } },
      { $limit: 5 },
    ]);

    let leaderboardString = "```md\n";

    for (let i = 0; i < leaderboard.length; i++) {
      const identifier = client.guilds.cache
        .get(leaderboard[i].id)
        .name.replace(/\`\`\`/g, "");

      identifier == msg.guild.name
        ? (leaderboardString += `> ${i + 1}: ${identifier} (${
            leaderboard[i].pushed
          })\n`)
        : (leaderboardString += `${i + 1}: ${identifier} (${
            leaderboard[i].pushed
          })\n`);
    }

    leaderboardString += "```";

    const embeds = [
      new MessageEmbed({
        title: lang.pushcart_serverembedtitle,
        description: leaderboardString,
        color: PayloadColors.USER,
      }),
    ];

    await msg.channel.send({ embeds });

    return true;
  }
}

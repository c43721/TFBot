import { Command } from "../../../../lib/exec/Command";
import { Client } from "../../../../lib/types";
import { Message, MessageEmbed } from "discord.js";
import Language from "../../../../lib/types/Language";
import PayloadColors from "../../../../lib/misc/colors";

export default class Leaderboard extends Command {
  constructor() {
    super(
      "leaderboard",
      "Shows the pushcart user leaderboard.",
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

    if (!client.leaderboard) {
      return await this.fail(msg, lang.pushcart_fail_noleaderboard);
    }

    const top10 = client.leaderboard.users.slice(0, 10);

    let isTop10 = false;
    let leaderboardString = "```md\n";

    for (let i = 0; i < top10.length; i++) {
      let tag = (
        client.users.cache.get(top10[i].id) ||
        (await client.users.fetch(top10[i].id))
      ).tag;

      if (top10[i].id == msg.author.id) {
        leaderboardString += `> ${i + 1}: ${tag} (${top10[i].pushed})\n`;
        isTop10 = true;
      } else {
        leaderboardString += `${i + 1}: ${tag} (${top10[i].pushed})\n`;
      }
    }

    if (!isTop10)
      leaderboardString += `...\n> ${
        client.leaderboard.users.findIndex((user) => user.id == msg.author.id) +
        1
      }: ${msg.author.tag} (${
        (
          client.leaderboard.users.find((user) => user.id == msg.author.id) || {
            pushed: 0,
          }
        ).pushed
      })\n`;

    leaderboardString += "```";

    const embeds = [
      new MessageEmbed({
        title: lang.pushcart_userembedtitle,
        description: leaderboardString,
        footer: {
          text: lang.pushcart_userembedfooter.replace(
            "%updated",
            client.leaderboard.updated.toLocaleString()
          ),
        },
        color: PayloadColors.USER,
      }),
    ];

    await msg.channel.send({ embeds });

    return true;
  }
}

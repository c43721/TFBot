import { Message, MessageEmbed } from "discord.js";
import gamedig from "gamedig";
import { Client } from "../../lib/types/Client";
import { AutoResponse } from "../../lib/exec/Autoresponse";
import Language from "../../lib/types/Language";
import { EmbedColors } from "../../lib/misc/colors";
export default class SteamConnectLink extends AutoResponse {
  constructor() {
    super(
      "steam connect link",
      "Automatically sends steam connect links when a detected clickable link is posted.",
      /steam:\/\/connect\/(\w+\.)+\w+(:\d+)?\/.+([^\n`$])/,
      ["SEND_MESSAGES", "EMBED_LINKS"]
    );
  }

  async run(client: Client, msg: Message): Promise<void> {
    const connectLink = msg.content.match(this.pattern) as RegExpExecArray;
    const parts = connectLink[0]
      .trim()
      .replace("steam://connect/", "")
      .split("/");
    const lang: Language = await this.getLanguage(msg);

    const ip = parts[0];
    const ipNoPort = ip.split(":")[0];
    const port = ip.split(":")[1] || "27015";
    const password = decodeURIComponent(parts[1]);

    const embed = new MessageEmbed();
    embed.setTitle(`connect ${ip}; password "${password}"`);

    const connectInfoEmbed = await msg.channel.send({ embeds: [embed] });

    try {
      const { name, maxplayers, players } = await gamedig.query({
        type: "tf2",
        host: ipNoPort,
        port: Number(port),
      });

      embed.setColor(EmbedColors.GREEN);
      embed.setDescription(
        `${name}\n${players.length}/${maxplayers} ${lang.servers_players}`
      );
    } catch (err) {
      embed.setColor(EmbedColors.RED);
      embed.setDescription(lang.servers_offline);
    }

    connectInfoEmbed.edit({ embeds: [embed] });
  }
}

import { Message, MessageEmbed } from "discord.js";
import gamedig from "gamedig";
import { Client } from "../../lib/types/Client";
import { AutoResponse } from "../../lib/exec/Autoresponse";
import { EmbedColors } from "../../lib/misc/colors";
import Language from "../../lib/types/Language";
export default class SteamConnectLink extends AutoResponse {
  constructor() {
    super(
      "steam connect info",
      "Automatically sends steam connect links when raw connect info is posted.",
      /connect (https?:\/\/)?(.+\.)+\w+(:\d+)?; ?password .+([^\n`$])/,
      ["SEND_MESSAGES", "EMBED_LINKS"]
    );
  }

  async run(client: Client, msg: Message): Promise<void> {
    const connectInfo = msg.content.match(this.pattern) as RegExpExecArray;
    const parts = connectInfo[0].trim().split(";");
    const lang: Language = await this.getLanguage(msg);

    const ip = parts[0].replace(/^connect (https?:\/\/)?/, "");
    const ipNoPort = ip.split(":")[0];
    const port = ip.split(":")[1] || "27015";
    const password = parts
      .slice(1)
      .join(";")
      .replace(/"|;$/g, "")
      .replace(/^ ?password /, "");

    const embed = new MessageEmbed();
    embed.setTitle(`steam://connect/${ip}/${encodeURIComponent(password)}`);

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

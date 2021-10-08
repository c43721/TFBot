import {
  AutoCommand,
  AutoCommandOptions,
} from "#lib/structs/AutoResponse/AutoResponse";
import { ApplyOptions } from "@sapphire/decorators";
import { EmbedColors } from "#utils/colors";
import gamedig from "gamedig";
import { Message, MessageEmbed } from "discord.js";

@ApplyOptions<AutoCommandOptions>({
  regex: /steam:\/\/connect\/(\w+\.)+\w+(:\d+)?\/.+([^\n`$])/,
})
export default class UserAutoCommand extends AutoCommand {
  async run(msg: Message) {
    const connectInfo = this.getMatch(msg);
    const parts = connectInfo[0].trim().split(";");

    const ip = parts[0];
    const ipNoPort = ip.split(":")[0];
    const port = ip.split(":")[1] || "27015";
    const password = decodeURIComponent(parts[1]);

    const title = `connect ${ip}; password "${password}"`;

    const embed = new MessageEmbed({
      title: title.length > 250 ? title.slice(0, 250) : title,
    });

    const connectInfoEmbed = await msg.channel.send({ embeds: [embed] });

    try {
      const { name, maxplayers, players } = await gamedig.query({
        type: "tf2",
        host: ipNoPort,
        port: parseInt(port),
      });

      embed.setColor(EmbedColors.GREEN);
      embed.setDescription(`${name}\n${players.length}/${maxplayers} players`);
    } catch (err) {
      embed.setColor(EmbedColors.RED);
      embed.setDescription("Server is offline.");
    }

    connectInfoEmbed.edit({ embeds: [embed] });
  }
}

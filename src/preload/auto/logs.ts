import { Client } from "../../lib/types/Client";
import { Message, MessageAttachment, MessageEmbed } from "discord.js";
import { AutoResponse } from "../../lib/exec/Autoresponse";
import PayloadColors from "../../lib/misc/colors";
import { capturePage } from "../../util/screenshot";
import config from "../../config";

export default class Logs extends AutoResponse {
  constructor() {
    super(
      "logs",
      "Automatically renders logs whenever a logs link is posted.",
      /http(s|):\/\/(www\.|)logs\.tf\/\d+/,
      ["SEND_MESSAGES", "ATTACH_FILES"]
    );
  }

  async run(client: Client, msg: Message): Promise<void> {
    const url = this.matchMsg(msg);
    const screenshotBuffer = await capturePage(url, {
      top: {
        selector: "#log-header",
        edge: "top",
      },
      left: {
        selector: "#log-header",
        edge: "left",
      },
      right: {
        selector: "#log-header",
        edge: "right",
      },
      bottom: {
        selector: "#log-section-players",
        edge: "bottom",
      },

      cssPath: config.files.LOGS_CSS,
    });

    const att = new MessageAttachment(screenshotBuffer, "log.png");
    const embed = new MessageEmbed();
    embed.setColor(PayloadColors.COMMAND);
    embed.setTitle("Logs.tf Preview");
    embed.setURL(url);
    embed.setImage(`attachment://log.png`);
    embed.setFooter(`Rendered by autoresponse ${this.name}`);
    embed.setTimestamp(new Date());

    msg.channel.send({ embeds: [embed], files: [att] });
  }
}

import { Client } from "../../lib/types/Client";
import { Message, MessageAttachment, MessageEmbed } from "discord.js";
import { AutoResponse } from "../../lib/exec/Autoresponse";
import { captureSelector } from "../../util/screenshot";
import PayloadColors from "../../lib/misc/colors";

export default class RGL extends AutoResponse {
  constructor() {
    super(
      "rgl",
      "Generates RGL team previews.",
      /rgl\.gg\/Public\/Team\.aspx\?t=\d+\&r=\d+/,
      ["SEND_MESSAGES", "ATTACH_FILES"]
    );
  }

  async run(client: Client, msg: Message): Promise<void> {
    const url = this.matchMsg(msg);

    const screenshotBuffer = await captureSelector(
      `https://${url}`,
      "div.col-md-12.col-lg-5"
    );

    const att = new MessageAttachment(screenshotBuffer, "team.png");
    const embed = new MessageEmbed();
    embed.setColor(PayloadColors.COMMAND);
    embed.setTitle("RGL Team Preview");
    embed.setURL(`https://${url}`);
    embed.setImage(`attachment://team.png`);
    embed.setFooter(`Rendered by autoresponse ${this.name}`);
    embed.setTimestamp(new Date());

    msg.channel.send({ embeds: [embed], files: [att] });
  }
}

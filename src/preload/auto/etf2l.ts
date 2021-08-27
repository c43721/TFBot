import { Client } from "../../lib/types/Client";
import { Message, MessageAttachment, MessageEmbed } from "discord.js";
import { captureSelector } from "../../util/screenshot";
import { AutoResponse } from "../../lib/exec/Autoresponse";
import PayloadColors from "../../lib/misc/colors";

export default class ETF2L extends AutoResponse {
  constructor() {
    super("etf2l", "Runs ETF2L team previews", /etf2l.org\/teams\/\d+/, [
      "SEND_MESSAGES",
      "EMBED_LINKS",
    ]);
  }

  async run(client: Client, msg: Message): Promise<void> {
    const url = this.matchMsg(msg);

    const screenshotBuffer = await captureSelector(
      `https://${url}`,
      "#content > div > div > table.pls"
    );

    const att = new MessageAttachment(screenshotBuffer, "team.png");

    const embed = new MessageEmbed();
    embed.setColor(PayloadColors.COMMAND);
    embed.setTitle("ETF2L Team Preview");
    embed.setURL(`https://${url}`);
    embed.setImage(`attachment://team.png`);
    embed.setFooter(`Rendered by autoresponse ${this.name}`);
    embed.setTimestamp(new Date());

    msg.channel.send({ embeds: [embed], files: [att] });
  }
}

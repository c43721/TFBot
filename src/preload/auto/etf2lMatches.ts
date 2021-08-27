import { Client } from "../../lib/types/Client";
import { Message, MessageAttachment, MessageEmbed } from "discord.js";
import { capturePage } from "../../util/screenshot";
import { AutoResponse } from "../../lib/exec/Autoresponse";
import PayloadColors from "../../lib/misc/colors";

export default class ETF2LMatchPreviews extends AutoResponse {
  constructor() {
    super(
      "etf2l-match-previews",
      "Runs ETF2L match previews",
      /etf2l.org\/matches\/\d+/,
      ["SEND_MESSAGES", "EMBED_LINKS"]
    );
  }

  async run(client: Client, msg: Message): Promise<void> {
    const url = this.matchMsg(msg);

    const screenshotBuffer = await capturePage(`https://${url}`, {
      top: {
        selector: "#content > div",
        edge: "top",
      },
      left: {
        selector: "#content",
        edge: "left",
      },
      right: {
        selector: "#content",
        edge: "right",
      },
      bottom: {
        selector: "#content > div > br",
        edge: "bottom",
      },
    });

    const att = new MessageAttachment(screenshotBuffer, "match.png");
    const embed = new MessageEmbed();
    embed.setColor(PayloadColors.COMMAND);
    embed.setTitle("ETF2L Match Preview");
    embed.setURL(`https://${url}`);
    embed.setImage(`attachment://match.png`);
    embed.setFooter(`Rendered by autoresponse ${this.name}`);
    embed.setTimestamp(new Date());

    msg.channel.send({ embeds: [embed], files: [att] });
  }
}

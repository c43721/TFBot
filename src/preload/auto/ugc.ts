import { Client } from "../../lib/types/Client";
import { Message, MessageAttachment, MessageEmbed } from "discord.js";
import { AutoResponse } from "../../lib/exec/Autoresponse";
import { captureSelector } from "../../util/screenshot";
import PayloadColors from "../../lib/misc/colors";

export default class UGC extends AutoResponse {
  constructor() {
    super(
      "ugc",
      "UGC Team Previews.",
      /www\.ugcleague\.com\/team_page\.cfm\?clan_id=\d+/,
      ["SEND_MESSAGES", "ATTACH_FILES"]
    );
  }

  async run(client: Client, msg: Message): Promise<void> {
    const url = this.matchMsg(msg);

    // Needed hight and width to not have wierdo mobile views
    const screenshotBuffer = await captureSelector(
      `https://${url}`,
      "#wrapper > section.container > div > div.col-md-9 > div:nth-child(3) > div.col-md-8 > div:nth-child(1)",
      {
        defaultViewport: {
          height: 925,
          width: 1000,
        },
      }
    );
    const att = new MessageAttachment(screenshotBuffer, "team.png");
    const embed = new MessageEmbed();
    embed.setColor(PayloadColors.COMMAND);
    embed.setTitle("UGC Team Preview");
    embed.setURL(`https://${url}`);
    embed.setImage(`attachment://team.png`);
    embed.setFooter(`Rendered by autoresponse ${this.name}`);
    embed.setTimestamp(new Date());

    msg.channel.send({ embeds: [embed], files: [att] });
  }
}

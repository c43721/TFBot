import { Command } from "../../../lib/exec/Command";
import { Client } from "../../../lib/types/Client";
import { Message } from "discord.js";
import axios from "axios";
import Language from "../../../lib/types/Language";
import { capturePage } from "../../../util/screenshot";
import config from "../../../config";

export default class Log extends Command {
  constructor() {
    super(
      "log",
      "Displays the latest log of the (mentioned) user. Must have your steamid linked through the bot.",
      [
        {
          name: "user mention",
          description: "user to mention",
          required: false,
          type: "string",
        },
      ],
      ["SEND_MESSAGES", "ATTACH_FILES"]
    );
  }

  async run(client: Client, msg: Message): Promise<boolean> {
    const targetUser = msg.mentions.users.first() || msg.author;
    const lang: Language = await this.getLanguage(msg);

    await msg.channel.sendTyping();

    const dbUser = await client.userManager.getUser(targetUser.id);

    if (!dbUser.user.steamId) {
      return await this.fail(
        msg,
        lang.log_fail_noid.replace("%prefix", await this.getPrefix(msg))
      );
    }

    const { data } = await axios(
      `http://logs.tf/api/v1/log?limit=1&player=${dbUser.user.steamId}`
    );

    if (data.logs.length < 1) {
      return await this.fail(msg, lang.log_fail_nologhistory);
    }

    const logID = data.logs[data.logs.length - 1].id;

    const screenshotBuffer = await capturePage(
      `http://logs.tf/${logID}#${dbUser.user.steamId}`,
      {
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
      }
    );

    await msg.channel.send({
      content: `<http://logs.tf/${logID}#${dbUser.user.steamId}>`,
      files: [screenshotBuffer],
    });

    return true;
  }
}

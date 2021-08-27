import { Client } from "../../lib/types/Client";
import { Message, MessageEmbed } from "discord.js";
import { AutoResponse } from "../../lib/exec/Autoresponse";
import { htmlToText } from "html-to-text";
import cheerio from "cheerio";
import axios from "axios";
import PayloadColors from "../../lib/misc/colors";

export default class TFTV extends AutoResponse {
  constructor() {
    super(
      "tftv",
      "Created thread previews for TFTV threads.",
      /teamfortress\.tv\/\d+\/[\w-]+/,
      ["SEND_MESSAGES", "EMBED_LINKS"]
    );
  }

  async run(client: Client, msg: Message): Promise<void> {
    const specificPost = msg.content.match(/#\d+/) as RegExpMatchArray;
    const url = "https://" + this.matchMsg(msg);
    const { data } = await axios(url);
    const $ = cheerio.load(data);

    const frags = $("#thread-frag-count").text().trim();
    const title = $(".thread-header-title").text().trim();
    const $post = $(
      `#thread-container > .post:nth-child(${
        specificPost ? specificPost[0].slice(1) : "1"
      })`
    );
    const author = $post.find(".post-header .post-author").text().trim();
    const body = htmlToText($post.find(".post-body") as any as string);

    const dateSelector = $post
      .find(".post-footer .js-date-toggle")
      .attr("title");
    const date = dateSelector
      ? dateSelector.replace(/at (\d+:\d+).+$/, "$1")
      : "N/A";

    const embed = new MessageEmbed();
    embed.setTitle(title);
    embed.setURL(url);
    embed.setDescription(
      `${author}\n\n${
        body.length > 700
          ? `${body.slice(0, 700)}...\n[read more](${url + specificPost})`
          : body
      }`
    );
    embed.setFooter(`${frags} frags`);
    embed.setTimestamp(new Date(date));
    embed.setColor(PayloadColors.USER);

    msg.channel.send({ embeds: [embed] });
  }
}

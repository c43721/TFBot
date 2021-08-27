import { TextChannel } from "discord.js";
import config from "../config";
import { Client } from "../lib/types";

module.exports = {
  run: async (client: Client, error: string) => {
    if (!config.logging.errorChannel) return;
    
    const channel = (await client.channels.fetch(
      config.logging.errorChannel
    )) as TextChannel;

    if (!channel) return;

    await channel.send({
      embeds: [
        {
          color: 15105570,
          timestamp: new Date(),
          title: `Warning`,
          description: `\`\`\`${error}\`\`\``,
        },
      ],
    });
  },
};

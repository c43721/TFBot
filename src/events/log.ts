import { TextChannel } from "discord.js";
import config from "../config";
import { Client } from "../lib/types";

module.exports = {
  run: async (client: Client, item: string) => {
    if (!config.logging.logChannel) return;

    const channel = (await client.channels.fetch(
      config.logging.logChannel
    )) as TextChannel;

    if (!channel) return;

    await channel.send({
      embeds: [
        {
          color: 3066993,
          timestamp: new Date(),
          title: `Event logger`,
          description: `\`\`\`${item}\`\`\``,
        },
      ],
    });
  },
};

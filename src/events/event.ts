import { Client, TextChannel } from "discord.js";
import { EmbedColors } from "../lib/misc/colors";
import config from "../config";

type EventType = "STARTED";

async function handleEvent(client: Client, type: EventType) {
  if (!config.logging.eventChannel) return;

  const channel = (await client.channels.fetch(
    config.logging.eventChannel
  )) as TextChannel;
  if (!channel) return;

  await channel.send({
    embeds: [
      {
        color: EmbedColors.DARK_ORANGE,
        timestamp: new Date(),
        title: "Event",
        description: `\`\`\`Event logged: ${type}\n\`\`\``,
      },
    ],
  });
}

export = {
  run: handleEvent,
};

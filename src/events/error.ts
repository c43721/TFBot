import { TextChannel } from "discord.js";
import config from "../config";
import { EmbedColors } from "../lib/misc/colors";
import { Client } from "../lib/types";

async function handleEvent(client: Client, error: Error) {
  if (!config.logging.errorChannel) return;

  const channel = (await client.channels.fetch(
    config.logging.errorChannel
  )) as TextChannel;

  if (!channel) return;

  await channel.send({
    embeds: [
      {
        color: EmbedColors.RED,
        timestamp: new Date(),
        title: "Error",
        description: error.stack
          ? `\`\`\`x86asm\n${error.stack}\n\`\`\``
          : `\`${error.toString()}\``,
      },
    ],
  });
}

export = {
  run: handleEvent,
};

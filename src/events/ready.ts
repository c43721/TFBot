import { TextChannel } from "discord.js";
import mongoose from "mongoose";
import { getChangelog } from "../util/get-changelog";
import { version } from "../util/version_control";
import config from "../config";
import { Client as ClientDocument, ClientModel } from "../lib/model/Client";
import { Client } from "../lib/types";

module.exports = {
  once: true,
  run: async (client: Client) => {
    client.logger.info(
      `Logged in as ${client.user.tag}, on ${client.guilds.cache.size} guilds, serving ${client.users.cache.size} users`
    );

    const waitingInterval: NodeJS.Timeout = setInterval(async () => {
      if (mongoose.connection.readyState === 1) {
        clearInterval(waitingInterval);

        // Run scheduled scripts
        for (let i = 0; i < client.scheduled.length; i++) {
          let script = client.scheduled[i];

          if (script.every < 0) script.run(client);
          else setInterval(() => script.run(client), script.every);
        }

        const changelog = getChangelog(version);

        client.emit("event", "STARTED");

        if (!changelog) {
          return client.logger.warn("Error fetching changelog!");
        }

        const botDoc: ClientModel = await ClientDocument.findOne(
          { id: 0 },
          {},
          { upsert: true }
        );

        if (botDoc?.startupVersion === version) {
          return client.logger.verbose("No new version.");
        }
        if (!config.logging.releaseChannel) return;

        const channel = (await client.channels.fetch(
          config.logging.releaseChannel
        )) as TextChannel;

        await channel.send("```md\n" + changelog + "\n```");

        botDoc.startupVersion = version;

        await botDoc.save();
      } else {
        client.logger.info("Waiting for MongoDB connection...");
      }
    }, 1000);
  },
};

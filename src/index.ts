import { Client as DJSClient, Collection, Intents, Options } from "discord.js";
import { readdir } from "fs";
import mongoose from "mongoose";
import { createLogger, format, transports } from "winston";
import { Client } from "./lib/types";
import { ScheduledScript } from "./lib/types/ScheduledScripts";
import { listen } from "./api/index";
import UserManager from "./lib/manager/UserManager";
import ServerManager from "./lib/manager/ServerManager";
import { Command, AutoResponse } from "./lib/exec";
import { version } from "./util/version_control";

require("dotenv").config();

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString("en-US", {
    timeZone: "America/Chicago",
  });

const client = new DJSClient({
  intents: [
    // Need to parse DMS
    Intents.FLAGS.DIRECT_MESSAGES,

    // Regex commands
    Intents.FLAGS.GUILD_MESSAGES,

    // General guilds
    Intents.FLAGS.GUILDS,
  ],
  makeCache: Options.cacheWithLimits({
    MessageManager: 250,
    UserManager: 50,
  }),
  presence: {
    activities: [
      {
        name: `payload.tf/invite | v${version}`,
        type: "PLAYING",
      },
    ],
  },
}) as Client;

client.autoResponses = new Collection();
client.commands = new Collection();
client.scheduled = [];

client.userManager = new UserManager(client);
client.serverManager = new ServerManager(client);

client.logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.colorize(),
    format.json(),
    format.prettyPrint({ colorize: true })
  ),
  transports: [
    new transports.Console({
      format: format.printf(
        (info) =>
          `[${formatDate(info.timestamp)}] ${info.level}: ${info.message} ${
            info.splat ?? ""
          }`
      ),
    }),
  ],
});

client.cache = {
  snipe: {},
  pings: {},
};

const restrictedCommands = process.env.DISABLED_COMMANDS?.split(", ") ?? [];

/* 
    Connect to MongoDB. Will exit if no database was found.
*/
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    client.logger.info("Successfully connected to MongoDB.");
  })
  .catch((err) => {
    client.logger.error("Failed to connect to MongoDB. Check your password!");
    client.logger.error(err);
    client.destroy();
    process.exit(1);
  });

/*
    Event loader.
*/
readdir(__dirname + "/events/", (err, files) => {
  if (err)
    throw new Error("No events found; cannot continue without an event!");

  console.log("Loading events...");

  files.forEach(async (file) => {
    const { default: eventFunction } = await import(`./events/${file}`);
    const event = eventFunction.event || file.split(".")[0];
    const emitter =
      (typeof eventFunction.emitter === "string"
        ? client[eventFunction.emitter]
        : eventFunction.emitter) || client;
    const { once } = eventFunction;
    try {
      emitter[once ? "once" : "on"](event, (...args) =>
        eventFunction.run(client, ...args)
      );
    } catch (error: any) {
      client.logger.error(error.stack as any);
    }
    console.log("\tLoaded " + file);
  });
});

/**
 * Load scheduled scripts.
 */
readdir(__dirname + "/scheduled", (err, files) => {
  if (err) throw new Error("Error reading schedule directory:\n" + err);

  console.log("Loading scheduled scripts...");

  files.forEach(async (file) => {
    const script: ScheduledScript = await import(
      `${__dirname}/scheduled/${file}`
    );

    client.scheduled.push(script);

    console.log("\tLoaded " + file);
  });
});

/**
 * Load commands.
 */
readdir(__dirname + "/preload/commands", (err, files) => {
  if (err) throw new Error("Error reading commands directory:\n" + err);

  console.log("Loading commands...");

  files.forEach(async (folder) => {
    const { default: commandInit } = await import(
      `${__dirname}/preload/commands/${folder}`
    );
    let command = new commandInit() as Command;

    if (!command.name)
      return console.warn("\t" + folder + " is not a valid command module.");

    if (restrictedCommands.includes(command.name))
      return console.warn(
        "\t" + folder + " was not loaded due to command restriction."
      );

    client.commands.set(command.name, command);

    console.log("\tLoaded " + command.name);
  });
});

/**
 * Load auto commands.
 */
readdir(__dirname + "/preload/auto", (err, files) => {
  if (err)
    throw new Error("Error reading automatic responses directory:\n" + err);

  console.log("Loading autoresponses...");

  files.forEach(async (file) => {
    const { default: autoInit } = await import(
      __dirname + "/preload/auto/" + file
    );
    const autoresponse = new autoInit() as AutoResponse;

    if (!autoresponse.name)
      return console.warn(
        "\tFile " + file + " is not a valid autoresponse module."
      );

    if (restrictedCommands.includes(autoresponse.name))
      return console.warn(
        "\t" + file + " was not loaded due to command restriction."
      );

    client.autoResponses.set(autoresponse.name, autoresponse);

    console.log("\tLoaded " + autoresponse.name);
  });
});

const apiPort = Number(process.env.API_PORT) || 8080;

client.login(process.env.TOKEN);
listen(apiPort);

export default client;

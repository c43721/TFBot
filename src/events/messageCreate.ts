import { handleCommand, handleAutoCommand } from "../lib/manager";
import { Client } from "../lib/types";
import { Message } from "discord.js";

module.exports = {
  run: async (client: Client, msg: Message) => {
    let didhandleCommand = await handleCommand(client, msg);
    if (!didhandleCommand) await handleAutoCommand(client, msg);
  },
};

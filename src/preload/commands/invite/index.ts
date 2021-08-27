import { Command } from "../../../lib/exec/Command";
import { Client } from "../../../lib/types/Client";
import { Message } from "discord.js";

export default class Invite extends Command {
  constructor() {
    super("invite", "Sends a discord invite link");
  }

  async run(client: Client, msg: Message): Promise<boolean> {
    await this.respond(msg, "<https://payload.tf/invite>");
    return true;
  }
}

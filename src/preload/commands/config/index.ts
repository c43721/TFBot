import { Command } from "../../../lib/exec/Command";
import { Client } from "../../../lib/types";
import { Message } from "discord.js";
import NotificationsCommand from "./notifications";
import Language from "../../../lib/types/Language";

export default class Config extends Command {
    constructor() {
        super(
            "config",
            "**USING THESE COMMANDS IN A PUBLIC SERVER PUTS YOUR ACCOUNT AT RISK OF BEING HIJACKED! MAKE SURE TO USE THESE COMMANDS ONLY IN BOT DMS!**",
            [
                {
                    name: "subcommand",
                    description: "The subcommand to execute.",
                    required: true,
                    type: "string"
                },
                {
                    name: "subcommand args",
                    description: "The subcommand arguments.",
                    required: true,
                    type: "string"
                }
            ],
            undefined,
            undefined,
            ["DM"],
            undefined,
            {
                "notifications": new NotificationsCommand()
            }
        );
    }

    async run(client: Client, msg: Message): Promise<boolean> {
        const args: any = await this.getArgs(msg);
        const lang: Language = await this.getLanguage(msg);

        if (!args) {
            await this.respond(msg, lang.config_error_invalidsyntax.replace('%prefix', await this.getPrefix(msg)));

            return false;
        }

        if (!this.subCommands[args[0]]) {
            await this.respond(msg, lang.config_error_invalidsubcommand.replace('%prefix', await this.getPrefix(msg)));

            return false;
        }

        return await this.runSub(args[0], client, msg);
    }
}
import { Command } from "../../../lib/exec/Command";
import { Client } from "../../../lib/types/Client";
import { Message } from "discord.js";

import PermissionCommand from "./permissions"
import Language from "../../../lib/types/Language";


export default class Settings extends Command {

    constructor() {
        super(
            "settings",
            "Guild settings",
            [
                {
                    name: "subcommand",
                    description: "Name of subcommand to execute",
                    required: true,
                    type: "string"
                }, 
                {
                    name: "subcommand arg",
                    description: "Arguments for subcommand",
                    required: false,
                    type: "string"
                }
            ],
            undefined,
            ["ADMINISTRATOR"],
            ["GUILD_TEXT"],
            undefined,
            {
                permissions: new PermissionCommand(),
            }
        );
    }

    async run(client: Client, msg: Message): Promise<boolean> {
        const args = await this.getArgs(msg)
        const lang: Language = await this.getLanguage(msg)

        if (args[0]) {
            if (!this.subCommands[args[0]]) {
                await this.respond(msg, lang.settings_fail_nosubcmd.replace('%prefix', await this.getPrefix(msg)));

                return false;
            }

            return await this.runSub(args[0], client, msg);
        }
    }

}
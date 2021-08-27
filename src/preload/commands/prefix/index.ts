import { Command } from "../../../lib/exec/Command";
import { Client } from "../../../lib/types";
import { Message } from "discord.js";
import Set from "./set";
import Delete from "./delete";;
import config from "../../../config";
import Language from "../../../lib/types/Language";

export default class Prefix extends Command {
    constructor() {
        super(
            "prefix",
            "Sets the guild-specific prefix.",
            [
                {
                    name: "command",
                    description: "Command of prefix to execute",
                    required: false,
                    type: "string",
                    options: ["set", "delete"]
                }
            ],
            undefined,
            undefined,
            ["GUILD_TEXT"],
            undefined,
            {
                set: new Set(),
                delete: new Delete()
            }
        );
    }

    async run(client: Client, msg: Message): Promise<boolean> {
        let args: any = await this.parseArgs(msg);
        const lang: Language = await this.getLanguage(msg);

        if (args[0]) {
            if (!this.subCommands[args[0]]) {
                return await this.fail(msg, lang.prefix_fail_invalidsub.replace('%prefix', await this.getPrefix(msg)));
            }

            return await this.runSub(args[0], client, msg);
        } else {
            const server = await client.serverManager.getServer(msg.guild.id);
            let prefix = server.getPrefixFromGuild(msg.guild.id);
            if (!prefix) prefix = config.PREFIX;

            await this.respond(msg, lang.prefix_default.replace('%prefix', await this.getPrefix(msg)))
            return true;
        }
    }
}
import { Command } from "../../../lib/exec/Command";
import { Client } from "../../../lib/types";
import { Message } from "discord.js";
import Set from "./set";
import Delete from "./delete";;
import { Language as Lang } from "../../../lib/types/Language"

export default class Language extends Command {
    constructor() {
        super(
            "language",
            "Sets the guild-specific language.",
            [
                {
                    name: "command",
                    description: "Command of language to execute",
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
        const lang: Lang = await this.getLanguage(msg);

        if (args[0]) {
            if (!this.subCommands[args[0]]) {
                return await this.fail(msg, lang.language_fail_invalidsub.replace('%prefix', await this.getPrefix(msg)));
            }

            return await this.runSub(args[0], client, msg);
        } else {
            const server = await client.serverManager.getServer(msg.guild.id);
            let language = server.getLanguageFromGuild(msg.guild.id);

            let languageSwitch: string;
            switch (language) {
                case "en-US":
                    languageSwitch = 'english'
                    break;
                case "es-ES":
                    languageSwitch = 'spanish'
                    break;
                case "de-DE":
                    languageSwitch = 'german'
                    break;
                case "pl-PL":
                    languageSwitch = 'polish'
                    break;
                case "fi-FI":
                    languageSwitch = 'finnish'
                    break;
                case "fr-FR":
                    languageSwitch = 'french'
                    break;
                case "ru-RU":
                    languageSwitch = 'russian'
                    break;
            }

            await this.respond(msg, lang.language_default.replace('%language', languageSwitch))
            return true;
        }
    }
}
import { Command } from "../../../../lib/exec/Command";
import { Client } from "../../../../lib/types";
import { Message } from "discord.js";
import Language from "../../../../lib/types/Language";


export default class logsApiKey extends Command {
    constructor() {
        super(
            "notifications",
            "Sets your notifications level. 2 = all, 1 = major, 0 = none.",
            [
                {
                    name: "level",
                    description: "Your desired notifications level. 2 = all, 1 = major, 0 = none.",
                    required: true,
                    type: "number",
                    options: [2, 1, 0]
                }
            ],
            undefined,
            undefined,
            ["DM"],
            undefined,
            undefined,
            ["config"]
        );
    }

    async run(client: Client, msg: Message): Promise<boolean> {
        const args = await this.parseArgs(msg, 1);
        const lang: Language = await this.getLanguage(msg);

        if (args === false) {
            return false;
        }

        const user = await client.userManager.getUser(msg.author.id);
        user.user.notificationsLevel = args[0] as number;
        await user.save();

        await this.respond(msg, lang.config_success_setnotif.replace('%level', args[0].toString()));

        return true;
    }
}
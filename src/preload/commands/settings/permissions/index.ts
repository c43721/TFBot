import { Command } from "../../../../lib/exec/Command";
import { Client } from "../../../../lib/types";
import { Message } from "discord.js";

export default class PermissionsAdjust extends Command {
    constructor() {
        super(
            "permissions",
            "Sets permissions for certain commands (Snipe permissions)",
            [
                {
                    name: "Permission",
                    description: "The permission to give",
                    required: true,
                    type: "string",
                    options: ["admin", "all"]
                }
            ],
            undefined,
            undefined,
            ["text"],
            undefined,
            undefined,
            ["settings"]
        );
    }

    async run(client: Client, msg: Message): Promise<boolean> {
        const lang = await this.getLanguage(msg);
        const args = await this.parseArgs(msg, 1)

        const server = await client.serverManager.getServer(msg.guild.id)

        if (args && args[0]) {
            const arg = args[0]
            if (arg === "admin") {
                server.server.settings.snipePerms = ["MANAGE_MESSAGES"]
                await this.respond(msg, lang.settings_admin)
            } else if (arg === "all") {
                server.server.settings.snipePerms = ["SEND_MESSAGES"]
                await this.respond(msg, lang.settings_all)
            }
        }

        await server.save()

        return true;
    }
}
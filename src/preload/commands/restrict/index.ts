import { Command } from "../../../lib/exec/Command";
import { Client } from "../../../lib/types";
import { Message } from "discord.js";
import Language from "../../../lib/types/Language";

export default class Restrict extends Command {
    constructor() {
        super(
            "restrict",
            "Restricts a command from being used in a channel. Using `{all}` as a command argument restrics all commands and using `#{all}` as a channel argument restricts the commands in all text channels.",
            undefined,
            undefined,
            ["SEND_MESSAGES", "MANAGE_CHANNELS"],
            ["GUILD_TEXT"]
        );
    }

    async run(client: Client, msg: Message): Promise<boolean> {
        const args: any = await this.getArgs(msg)
        const lang: Language = await this.getLanguage(msg);

        if (args === false) {
            return false;
        }

        let commands: string[] = [];
        let channels: string[] = [];
        let allCommands = false;
        let allChannels = false;

        for (let i = 0; i < args.length; i++) {
            if (args[i].match(/\<\#\d+\>/g)) channels.push(args[i].slice(2, -1));
            else if (args[i].toLowerCase() == "#{all}") {
                allChannels = true;
                channels.push(...msg.guild.channels.cache.filter(channel => channel.type == "GUILD_TEXT").map(channel => channel.id));
            }
            else if (args[i].toLowerCase() == "{all}") {
                allCommands = true;
                commands.push(...client.commands.filter(command => !["restrict", "unrestrict"].includes(command.name)).map(command => command.name));
                commands.push(...client.autoResponses.map(command => command.name));
            }
            else {
                if (!(client.commands.map(cmds => cmds.name).concat(client.autoResponses.map(auto => auto.name))).includes(args[i])) continue;
                commands.push(args[i]);
            }
        }

        if (channels.length == 0) {
            channels = [msg.channel.id];
        }

        if (commands.includes("restrict") || commands.includes("unrestrict")) return await this.fail(msg, lang.restrict_fail_deny);

        const serverManager = client.serverManager;
        const server = await serverManager.ensureServer(msg.guild.id);

        server.addCommandRestrictions(
            channels.map(channelID => {
                return {
                    channelID,
                    commands
                };
            })
        );

        await server.save();

        let commandReplace;
        if (commands.length <= 0) commandReplace = lang.restrict_none;

        commandReplace = allCommands ? lang.restrict_allcmnds : commands.join(", ");
        const channelReplace = (allChannels ? lang.restrict_allchns : channels.map(channelID => `<#${channelID}>`).join(", "))
        await this.respond(msg, lang.restrict_success.replace('%channels', channelReplace).replace('%cmds', commandReplace));

        return true;
    }
}
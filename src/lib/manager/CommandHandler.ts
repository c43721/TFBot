import { Client } from "../types/Client";
import { Message, PermissionResolvable, TextChannel, Permissions } from "discord.js";
import config from "../../config";
import { Command } from "../exec/Command";

export async function handleCommand(client: Client, msg: Message): Promise<Boolean> {
    let prefix: string;
    if (msg.guild) {
        const guild = await client.serverManager.getServer(msg.guild.id);
        prefix = guild.getPrefixFromGuild(msg.guild.id);
    } else prefix = config.PREFIX;

    if (msg.author.bot) return false;

    if (!msg.content.toLowerCase().startsWith(prefix)) return false;

    let command = msg.content.slice(prefix.length).trim().split(" ")[0];

    if (!client.commands.has(command)) return false;

    let executableCommand = client.commands.get(command) as Command;

    if (executableCommand.requiresRoot && msg.author.id != config.allowedID) return false;

    if (!executableCommand.zones.includes(msg.channel.type)) return false;

    if (msg.channel.type == "text") {
        let serverManager = client.serverManager;
        let server = await serverManager.getServer(msg.guild.id);
        let commandRestrictions = server.getCommandRestrictions(msg.channel.id);

        if ((commandRestrictions as Array<string>).includes(executableCommand.name)) return false;

        let canBeExecutedBy = executableCommand.canBeExecutedBy as PermissionResolvable;
        let permissionsNeeded = executableCommand.permissions as PermissionResolvable;

        if (!((msg.channel as TextChannel).permissionsFor(msg.author) as Permissions).has(canBeExecutedBy)) return false;

        if (!((msg.channel as TextChannel).permissionsFor(client.user) as Permissions).has(permissionsNeeded)) return false;
    }

    try {
        await executableCommand.run(client, msg);
        console.log(`User ${msg.author.id}/${msg.author.tag} used command ${executableCommand.name}.`);
        client.emit("log", (`User ${msg.author.id}/${msg.author.tag} used command ${executableCommand.name} in ${(msg.guild) ? `guild ${msg.guild.id}/${msg.guild.name}` : "dms"}.`));
    } catch (err) {
        console.warn("Error while executing command " + command, err);
        client.emit("error", err, executableCommand.name);
    }

    msg.channel.stopTyping(true);
    return true;
}
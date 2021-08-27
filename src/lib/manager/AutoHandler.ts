import { Message, TextChannel, Permissions, PermissionResolvable } from "discord.js";
import { Client } from "../types/Client";
import { AutoResponse } from "../types/AutoCommand"

export async function handleAutoCommand(client: Client, msg: Message): Promise<Boolean> {
    if (msg.author.bot) return false;

    let match = "";
    let autoResponseKeys = [...client.autoResponses.keys()];

    for (let i = 0; i < autoResponseKeys.length; i++) {
        let autoResponse = client.autoResponses.get(autoResponseKeys[i]) as AutoResponse;
        let pattern = autoResponse.pattern;

        if (msg.content.match(pattern)) {
            match = autoResponse.name;
            break;
        }
    }

    if (!match) return false;

    const autoResponse = client.autoResponses.get(match);

    if (!autoResponse.zones.includes(msg.channel.type)) return false;

    if (msg.channel.type === "GUILD_TEXT") {
        if (!((msg.channel as TextChannel).permissionsFor(client.user) as Permissions).has(autoResponse.permissions as PermissionResolvable)) return false;

        let serverManager = client.serverManager;
        let server = await serverManager.getServer(msg.guild.id);
        let commandRestrictions = server.getCommandRestrictions(msg.channel.id);

        if ((commandRestrictions as Array<string>).includes(autoResponse.name)) return false;
    }

    try {
        await autoResponse.run(client, msg);
        client.emit("log", `User ${msg.author.id}/${msg.author.tag} initiaited autoresponse ${autoResponse.name} in ${(msg.guild) ? `guild ${msg.guild.id}/${msg.guild.name}` : "dms"}.`);
    } catch (err) {
        console.error(err);
        client.logger.error(`Error while executing autoresponse ${autoResponse.name}`);
        client.emit("error", err as Error);
    }

    return true;
}
import { Message, TextChannel, Permissions, PermissionResolvable } from "discord.js";
import { Client } from "../types/Client";
import { AutoResponse } from "../types/AutoCommand"

export async function handleAutoCommand(client: Client, msg: Message): Promise<Boolean> {
    if (msg.author.bot) return false;

    let match = "";
    let autoResponseKeys = client.autoResponses.keyArray();

    for (let i = 0; i < autoResponseKeys.length; i++) {
        let autoReponse = client.autoResponses.get(autoResponseKeys[i]) as AutoResponse;
        let pattern = autoReponse.pattern;

        if (msg.content.match(pattern)) {
            match = autoReponse.name;
            break;
        }
    }

    if (!match) return false;

    let autoResponse = client.autoResponses.get(match) as AutoResponse;

    if (!autoResponse.zones.includes(msg.channel.type)) return false;

    if (msg.channel.type == "text") {
        if (!((msg.channel as TextChannel).permissionsFor(client.user) as Permissions).has(autoResponse.permissions as PermissionResolvable)) return false;
    }

    try {
        await autoResponse.run(client, msg);
        console.log(`${autoResponse.name} was initiated sent by ${msg.author.tag}/${msg.author.id}.`);
        client.emit("log", (`User ${msg.author.id}/${msg.author.tag} used command ${autoResponse.name} in ${(msg.guild) ? `guild ${msg.guild.id}/${msg.guild.name}` : "dms"}.`));
        msg.channel.stopTyping(true);
    } catch (err) {
        console.warn("Error while executing autoresponse " + autoResponse.name, err);
        client.emit("error", err, autoResponse.name);
    }

    msg.channel.stopTyping(true);
    return true;
}
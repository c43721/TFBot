import { MessageEmbed } from "discord.js";
import { Client } from "../lib/types";

export enum NotificationLevel {
    NONE = 0,
    MAJOR,
    ALL
}

export async function pushNotification(client: Client, id: string, level: number, embed: MessageEmbed, version?: string): Promise<boolean> {
    const userDBEntry = await client.userManager.getUser(id);

    if (userDBEntry.user.notificationsLevel == undefined) {
        userDBEntry.user.notificationsLevel = NotificationLevel.NONE;
    }
    if (userDBEntry.user.latestUpdateNotifcation == undefined) {
        userDBEntry.user.latestUpdateNotifcation = "0.0.0";
    }

    if (userDBEntry.user.notificationsLevel < level) {
        return false;
    }

    if (version && userDBEntry.user.latestUpdateNotifcation == version) {
        await userDBEntry.save();

        return false;
    }

    let discordUser = client.users.cache.get(id);
    if (!discordUser) {
        discordUser = await client.users.fetch(id);
    }

    try {
        await discordUser.send({ embeds: [embed] });
    } catch (err) {
        return false;
    }

    if (version) {
        userDBEntry.user.latestUpdateNotifcation = version;
    }

    await userDBEntry.save();

    return true;
}
import { Client } from "../types";
import { Message, Channel, PermissionString } from "discord.js";
import Language from "../types/Language";

export abstract class AutoResponse {
    name: string;
    description: string;
    pattern: RegExp;
    permissions: Array<PermissionString>;
    zones: Array<Channel["type"]>;

    constructor(
        name: string,
        description: string,
        pattern: RegExp,
        permissions?: Array<PermissionString>,
        zones?: Array<Channel["type"]>
    ) {
        this.name = name
        this.description = description
        this.pattern = pattern
        this.permissions = permissions || ["SEND_MESSAGES"]
        this.zones = zones || ["GUILD_TEXT", "DM"]
    }

    matchMsg(msg: Message): string {
        let match = msg.content.match(this.pattern) as RegExpMatchArray;

        return match[0];
    }

    async getLanguage(msg: Message): Promise<any> {
        const client: Client = msg.client as Client;
        let lang: Language;
        if (msg.guild) {
            const server = await client.serverManager.getServer(msg.guild.id);
            const guildLang = server.getLanguageFromGuild(msg.guild.id);
            lang = require(`../../../languages/${guildLang}`)
        } else {
            lang = require(`../../../languages/en-US`)
        }
        return lang
    }

    abstract run(client: Client, msg: Message): Promise<void>;
}

export interface AutoResponseConstructor {
    new(): AutoResponse;
}
import * as Discord from "discord.js";
import config from "../../config";
import { Message, PermissionString } from "discord.js";
import { getArgs } from "../../util/parse";
import { Client } from "../types"
import Language from "../types/Language";

declare interface NumberArgument {
    name: string;
    description: string;
    required: boolean;

    type: "number";
    min?: number;
    max?: number;
    options?: number[];
};
declare interface StringArgument {
    name: string;
    description: string;
    required: boolean;

    type: "string";
    minLength?: number;
    maxLength?: number;
    options?: string[];
};
declare interface BooleanArgument {
    name: string;
    description: string;
    required: boolean;

    type: "boolean";
    options?: boolean[]; // never gonna use this lol
}
declare type Argument = NumberArgument | StringArgument | BooleanArgument;

export abstract class Command {
    name: string;
    description: string;
    args: Argument[];
    permissions: Array<Discord.PermissionString>;
    canBeExecutedBy: Array<Discord.PermissionString>;
    zones: Discord.Channel["type"][];
    requiresRoot: boolean;
    subCommands: {
        [name: string]: Command
    };
    commandLadder: string[];

    constructor(
        name: string,
        description: string,
        args?: Argument[],
        permissions?: Array<Discord.PermissionString>,
        canBeExecutedBy?: Array<Discord.PermissionString>,
        zones?: Array<Discord.Channel["type"]>,
        requiresRoot?: boolean,
        subCommands?: { [name: string]: Command },
        commandLadder?: Array<string>
    ) {
        this.name = name;
        this.description = description;
        this.args = args || [];
        this.permissions = permissions || ["SEND_MESSAGES"];
        this.canBeExecutedBy = canBeExecutedBy || ["SEND_MESSAGES"];
        this.zones = zones || ["GUILD_TEXT", "DM"];
        this.requiresRoot = requiresRoot || false;
        this.subCommands = subCommands || {};
        this.commandLadder = commandLadder || [];
    }

    private argToString(arg: Argument): string {
        let innerText = arg.name;

        if (arg.options) {
            innerText = arg.options.join("|");
        }

        if (arg.required) {
            return `<${innerText}>`;
        } else {
            return `[${innerText}]`;
        }
    }

    private convertArgsToUsageString(): string {
        const readableArgs = this.args.map(this.argToString);

        return readableArgs.join(" ");
    }

    getFullCommandName() {
        if (this.commandLadder.length > 0) {
            return `${this.commandLadder.join(" ")} ${this.name}`;
        }

        return this.name;
    }

    async getArgs(message: Message, commandLevel?: number): Promise<string[]> {
        return getArgs(
            message.content.slice(
                (await this.getPrefix(message)).length + this.name.length
            ).trim()
        ).slice(commandLevel || 0);
    }

    async getPrefix(msg: Discord.Message): Promise<string> {
        const client: Client = msg.client as Client;
        if (!msg.guild) return config.PREFIX;
        const server = await client.serverManager.getServer(msg.guild.id);
        return server.getPrefixFromGuild(msg.guild.id);
    }

    async getLanguage(msg: Discord.Message): Promise<any> {
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

    async checkPermissions(msg: Discord.Message): Promise<boolean> {
        const client: Client = msg.client as Client;
        const server = await client.serverManager.getServer(msg.guild.id);
        const perm = server.server.enableSnipeForEveryone;
        
        // Return perm otherwise default to FALSE
        return perm ?? false
    }

    async parseArgs(message: Message, commandLevel?: number): Promise<Array<number | string | boolean> | false> {
        const args = await this.getArgs(message, commandLevel);
        let parsedArgs: Array<number | string | boolean> = [];
        const lang: Language = await this.getLanguage(message)

        for (let i = 0; i < this.args.length; i++) {
            if (!args[i]) {
                if (this.args[i].required) {
                    return await this.fail(message, lang.parseargs_fail_argsmissing.replace('%argsname', this.args[i].name).replace("%prefix", await this.getPrefix(message)).replace("%fullcommandname", this.getFullCommandName()));
                }

                break;
            }

            if (this.args[i].type == "number") {
                const argCheck = this.args[i] as NumberArgument;
                let arg: String | number = args[i];

                if (Number(arg) === NaN || Number(arg) === null || Number(arg) === Infinity) {
                    return await this.fail(message, lang.parseargs_fail_numberarg.replace('%argsname', argCheck.name).replace("%prefix", await this.getPrefix(message)).replace("%fullcommandname", this.getFullCommandName()));
                }

                arg = Math.round(Number(arg));

                if (argCheck.max != undefined && argCheck.max < arg) {
                    return await this.fail(message, lang.parseargs_fail_lessthan.replace('%argsname', argCheck.name).replace('%argsnumber', String(argCheck.max + 1)).replace("%prefix", await this.getPrefix(message)).replace("%fullcommandname", this.getFullCommandName()));
                } else if (argCheck.min != undefined && argCheck.min > arg) {
                    return await this.fail(message, lang.parseargs_fail_greaterthan.replace('%argsname', argCheck.name).replace('%argsnumber', String(argCheck.min - 1)).replace("%prefix", await this.getPrefix(message)).replace("%fullcommandname", this.getFullCommandName()));
                }

                if (argCheck.options && !argCheck.options.includes(arg)) {
                    return await this.fail(message, lang.parseargs_fail_notaccepted.replace('%argsname', argCheck.name).replace('%argoptions', argCheck.options.join(", ")).replace("%prefix", await this.getPrefix(message)).replace("%fullcommandname", this.getFullCommandName()));
                }

                parsedArgs.push(arg);
            } else if (this.args[i].type == "string") {
                const argCheck = this.args[i] as StringArgument;
                let arg: any = args[i];

                if (argCheck.maxLength != undefined && argCheck.maxLength < arg.length) {
                    return await this.fail(message, lang.parseargs_fail_argless.replace('%argsname', argCheck.name).replace('%argnum', String(argCheck.maxLength + 1)).replace("%prefix", await this.getPrefix(message)).replace("%fullcommandname", this.getFullCommandName()));
                } else if (argCheck.minLength != undefined && argCheck.minLength > arg.length) {
                    return await this.fail(message, lang.parseargs_fail_argmore.replace('%argsname', argCheck.name).replace('%argnum', String(argCheck.minLength - 1)).replace("%prefix", await this.getPrefix(message)).replace("%fullcommandname", this.getFullCommandName()));
                }

                if (argCheck.options && !argCheck.options.includes(arg)) {
                    return await this.fail(message, lang.parseargs_fail_notaccepted.replace('%argsname', argCheck.name).replace('%argoptions', argCheck.options.join(", ")).replace("%prefix", await this.getPrefix(message)).replace("%fullcommandname", this.getFullCommandName()));
                }

                parsedArgs.push(arg);
            } else if (this.args[i].type == "boolean") {
                const argCheck = this.args[i] as NumberArgument;
                let arg: String | boolean = args[i];

                if (!["true", "false"]) {
                    return await this.fail(message, lang.parseargs_fail_boolean.replace('%argsname', argCheck.name).replace("%prefix", await this.getPrefix(message)).replace("%fullcommandname", this.getFullCommandName()));
                }

                arg = arg == "true" ? true : false;

                parsedArgs.push(arg);
            }
        }

        return parsedArgs;
    }

    async getUsage(message: Message): Promise<string> {
        return `${await this.getPrefix(message)}${this.getFullCommandName()} ${this.convertArgsToUsageString()}`;
    }

    getSubcommandArray(): string[] {
        return Object.keys(this.subCommands);
    }

    async respond(message: Message, response: string): Promise<Message> {
        return await message.channel.send(response) as Message;
    }

    async fail(message: Message, reason: string): Promise<false> {
        await message.channel.send(reason);
        return false;
    }

    async flash(messagePromise: Promise<Message>, durationMS?: number): Promise<void> {
        return new Promise(async resolve => {
            const message = await messagePromise;

            setTimeout(async () => {
                if (message.deletable) {
                    await message.delete();
                }

                resolve();
            }, durationMS || 5000);
        });
    }

    async runSub(subCommandName: string, client: Client, msg: Message): Promise<boolean> {
        return await this.subCommands[subCommandName].run(client, msg);
    }

    abstract run(client: Client, msg: Message): Promise<boolean>;
}

export interface CommandConstructor {
    new(): Command;
}
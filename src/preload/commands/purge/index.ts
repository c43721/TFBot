import { Command } from "../../../lib/exec/Command";
import { Client } from "../../../lib/types/Client";
import { Message, TextChannel } from "discord.js";
import Language from "../../../lib/types/Language";

export default class Purge extends Command {
    constructor() {
        super(
            "purge",
            "Purges a certain number of messages sent by a user or everyone if no user is mentioned.",
            [
                {
                    name: "amount",
                    description: "The amount of messages to delete.",
                    required: true,
                    type: "number",
                    min: 1,
                    max: 100
                },
                {
                    name: "user mentions",
                    description: "The users to filter.",
                    required: false,
                    type: "string"
                }
            ],
            ["SEND_MESSAGES", "MANAGE_MESSAGES"],
            ["SEND_MESSAGES", "MANAGE_MESSAGES"],
            ["GUILD_TEXT"]
        );
    }

    async run(client: Client, msg: Message): Promise<boolean> {
        const args = await this.parseArgs(msg);
        const lang: Language = await this.getLanguage(msg);

        if (args === false) {
            return false;
        }

        const amount = args[0];
        const users = msg.mentions.users;

        await msg.channel.sendTyping();

        await msg.delete();

        const startTime = Date.now();

        let channelMessages = await msg.channel.messages.fetch({
            limit: 100
        });

        if (users.size > 0) {
            channelMessages = channelMessages.filter(foundMsg => {
                return msg.mentions.users.map(user => user.id).includes(foundMsg.author.id);
            });
        }

        channelMessages = channelMessages.filter(channelMessage => {
            return Date.now() - channelMessage.createdTimestamp < 1000 * 60 * 60 * 24 * 14;
        });

        const deletedMessages = await (msg.channel as TextChannel).bulkDelete(channelMessages.map(channelMessage => channelMessage.id).slice(0, amount as number));

        await this.respond(msg, lang.purge_success.replace('%size', deletedMessages.size.toString()).replace('%sec', String((Date.now() - startTime) / 1000)));

        return true;
    }
}
import { Command } from "../../../../lib/exec/Command";
import { Client } from "../../../../lib/types";
import { Message, MessageEmbed } from "discord.js";
import PayloadColors from "../../../../lib/misc/colors";
import Language from "../../../../lib/types/Language";

export default class Set extends Command {
    constructor() {
        super(
            "set",
            "Sets guild prefix",
            [
                {
                    name: "prefix",
                    description: "Your new guild prefix",
                    required: true,
                    type: "string",
                }
            ],
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            ["prefix"]
        );
    }

    async run(client: Client, msg: Message): Promise<boolean> {
        if (!msg.member.permissions.has(["ADMINISTRATOR"])) return false;
        const args: any = await this.parseArgs(msg, 2);
        const lang: Language = await this.getLanguage(msg);

        if (args === false) return false
        const newPrefix = args && args[0];
        if (!newPrefix) return await this.fail(msg, lang.prefix_set_fail_nonew);

        const server = await client.serverManager.getServer(msg.guild.id);
        const oldPrefix = server.getPrefixFromGuild(msg.guild.id);

        if (oldPrefix === newPrefix) return await this.fail(msg, lang.prefix_set_fail_oldnew);
        
        const embed = new MessageEmbed();
        embed.setAuthor(msg.author.tag, msg.author.displayAvatarURL());
        embed.setColor(PayloadColors.ADMIN);
        embed.setDescription(lang.prefix_set_success_embeddesc.replace('%prefix', newPrefix));
        embed.setTitle(lang.prefix_set_success_embedtitle.replace('%author', msg.author.tag));
        embed.setTimestamp();

        server.server.prefix = newPrefix;

        await server.save();

        await msg.channel.send({ embeds: [embed]});
        return true;
    }
}
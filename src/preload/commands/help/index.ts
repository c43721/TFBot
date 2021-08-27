import { Command } from "../../../lib/exec/Command";
import { Client } from "../../../lib/types/Client";
import { Message, MessageEmbed } from "discord.js";
import Language from "../../../lib/types/Language";
import PayloadColors from "../../../lib/misc/colors";

export default class Help extends Command {
  constructor() {
    super("help", "Find out how to use commands.", [
      {
        name: "command",
        description: "The name of the command to view information on.",
        required: true,
        type: "string",
      },
      {
        name: "subcommand",
        description: "Subcommand to view information on.",
        required: false,
        type: "string",
      },
    ]);
  }

  async run(client: Client, msg: Message): Promise<boolean> {
    const args = await this.parseArgs(msg);
    const lang: Language = await this.getLanguage(msg);

    if (args === false) {
      return false;
    }

    const commandName = (args[0] as String).toLowerCase();
    const subcommandNames = args.slice(1) as String[];

    if (!commandName || !client.commands.has(commandName)) {
      return false;
    }

    let command = client.commands.get(commandName)!;

    let usage: string;
    let permissionsNeeded: {
      user: string[];
      client: string[];
    } = {
      user: [],
      client: [],
    };

    if (subcommandNames) {
      for (let i = 0; i < subcommandNames.length; i++) {
        command = command.subCommands[subcommandNames[i].toLowerCase()];

        if (!command) {
          return false;
        }
      }
    }

    usage = await command.getUsage(msg);
    permissionsNeeded = {
      user: command.canBeExecutedBy,
      client: command.permissions,
    };

    const helpEmbed = new MessageEmbed();
    helpEmbed.setTitle(command.name);
    helpEmbed.setDescription(command.description);
    helpEmbed.addField(lang.help_embedusage, usage);
    helpEmbed.addField(
      lang.help_embedpermissionshead,
      lang.help_embedpermissionsbody
        .replace(
          "%permsuser",
          permissionsNeeded.user.join("\n").replace(/_/g, " ")
        )
        .replace(
          "%permsbot",
          permissionsNeeded.client.join("\n").replace(/_/g, " ")
        )
    );
    if (command.getSubcommandArray().length > 0) {
      helpEmbed.addField(
        lang.help_embedsubcmds,
        command.getSubcommandArray().join(", ")
      );
    }
    helpEmbed.setFooter(
      lang.help_embedfooter
        .replace("%requester", msg.author.tag)
        .replace("%prefix", await this.getPrefix(msg))
    );
    helpEmbed.setColor(PayloadColors.COMMAND);

    await msg.channel.send({ embeds: [helpEmbed] });

    return true;
  }
}

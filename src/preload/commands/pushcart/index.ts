import { Command } from "../../../lib/exec/Command";
import { Client } from "../../../lib/types";
import { Message } from "discord.js";
import { weightedRandom } from "../../../util/random";
import LeaderboardCommand from "./leaderboard";
import RankCommand from "./rank";
import GiftCommand from "./gift";
import ServersCommand from "./servers";
import Language from "../../../lib/types/Language";
import { add, formatDistanceToNowStrict } from "date-fns";

export default class PushCart extends Command {
    constructor() {
        super(
            "pushcart",
            "Pushes the cart 3-17 feet. Based on local machine time.",
            [
                {
                    name: "subcommand",
                    description: "An optional subcommand can go here.",
                    required: false,
                    type: "string"
                }
            ],
            undefined,
            undefined,
            ["GUILD_TEXT"],
            undefined,
            {
                leaderboard: new LeaderboardCommand(),
                rank: new RankCommand(),
                gift: new GiftCommand(),
                servers: new ServersCommand()
            }
        );
    }

    async run(client: Client, msg: Message): Promise<boolean> {
        const args: any = await this.getArgs(msg);
        const lang: Language = await this.getLanguage(msg);

        if (args[0]) {
            if (!this.subCommands[args[0]]) {
                await this.respond(msg, lang.pushcart_fail_nosubcmd.replace('%prefix', await this.getPrefix(msg)));

                return false;
            }

            return await this.runSub(args[0], client, msg);
        }

        const user = await client.userManager.getUser(msg.author.id);
        const server = await client.serverManager.getServer(msg.guild.id);

        const feetPushed = weightedRandom([
            { number: 3, weight: 2 },
            { number: 4, weight: 3 },
            { number: 5, weight: 5 },
            { number: 6, weight: 8 },
            { number: 7, weight: 16 },
            { number: 8, weight: 16 },
            { number: 9, weight: 16 },
            { number: 10, weight: 16 },
            { number: 11, weight: 18 },
            { number: 12, weight: 18 },
            { number: 13, weight: 16 },
            { number: 14, weight: 8 },
            { number: 15, weight: 5 },
            { number: 16, weight: 3 },
            { number: 17, weight: 2 },
        ]);

        const pushResult = user.addCartFeet(feetPushed);

        if (pushResult == "COOLDOWN") {
            const secondsRemaining = Math.round(
                (
                    (user.user.fun!.payload.lastPushed + 1000 * 30)
                    - Date.now()
                )
                / 1000
            );
            return await this.fail(msg, lang.pushcart_fail_cooldown.replace('%time', secondsRemaining.toString()))
        } else if (pushResult == "CAP") {
            const expirationDate = add(user.user.fun!.payload.lastActiveDate, { days: 1 });
            const timeLeft = formatDistanceToNowStrict(expirationDate);
            return await this.fail(msg, lang.pushcart_fail_maxpoints.replace('%timeleft', timeLeft));
        }

        server.addCartFeet(feetPushed);

        await Promise.all([
            user.save(),
            server.save()
        ]);

        await this.respond(msg, lang.pushcart_success.replace('%units', feetPushed.toString()).replace('%total', server.server.fun!.payloadFeetPushed.toString()));

        return true;
    }
}

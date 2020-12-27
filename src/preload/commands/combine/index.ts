
import { Command } from "../../../lib/exec/Command";
import { Client } from "../../../lib/types";
import { Message } from "discord.js";
import axios from "axios";
import { render } from "../../../util/render-log";
import Language from "../../../lib/types/Language";

export default class Combine extends Command {
    constructor() {
        super(
            "combine",
            "Combines 2 or more logs into a bigger log.",
            [
                {
                    name: "title",
                    description: "The map name for the combined logs.",
                    required: true,
                    type: "string"
                },
                {
                    name: "map",
                    description: "The log title for the combined logs.",
                    required: true,
                    type: "string"
                },
                {
                    name: "log url 1",
                    description: "The first log to combine.",
                    required: true,
                    type: "string"
                },
                {
                    name: "log url 2",
                    description: "The second log to combine.",
                    required: true,
                    type: "string"
                },
                {
                    name: "log url 3",
                    description: "More logs to combine.",
                    required: false,
                    type: "string"
                }
            ],
            ["SEND_MESSAGES", "ATTACH_FILES"]
        );
    }

    async run(client: Client, msg: Message): Promise<boolean> {
        const args = await this.getArgs(msg);
        const lang: Language = await this.getLanguage(msg);

        const title = args[0];
        const map = args[1];
        const logs = args.slice(2);

        if (!map || map.match(/logs\.tf\/\d+/)) {
            return await this.fail(msg, lang.combine_fail_invalid.replace('%prefix', await this.getPrefix(msg)));
        } else if (!title || title.match(/logs\.tf\/\d+/)) {
            return await this.fail(msg, lang.combine_fail_invalid.replace('%prefix', await this.getPrefix(msg)));
        } else if (logs.length < 2) {
            return await this.fail(msg, lang.combine_fail_invalid.replace('%prefix', await this.getPrefix(msg)));
        }

        let logIds: Array<string> = [];
        for (let i = 0; i < logs.length; i++) {
            const logId = logs[i].match(/\d+/);

            if (!logId) {
                return await this.fail(msg, lang.combine_fail_invalidlog.replace('%log', logs[i]));
            }

            logIds.push(logId![0]);
        }

        msg.channel.startTyping();

        const user = await client.userManager.getUser(msg.author.id);

        let apiKey;
        if (!user.user.logsTfApiKey) {
            return await this.fail(msg, lang.combine_fail_noapikey.replace('%prefix', await this.getPrefix(msg)));
        } else {
            apiKey = user.user.logsTfApiKey;
        }

        /**
         * Initiate Logify API request.
         */

        const requestBody = {
            token: apiKey,
            title: title,
            map: map,
            ids: logIds
        };


        // Deprecated due to logify not being online any more.

        // const { data } = await axios.post("https://sharky.cool/api/logify/combine/", requestBody);

        // if (!data) {
        //     client.emit("error", );
        //     return await this.fail(msg, lang.combine_fail_error);
        // }

        // await this.respond(msg, lang.combine_success.replace('%logpath', `https://logs.tf/${res.body.log_id}`));

        // const screenshotBuffer = await render("https://logs.tf/" + res.body.log_id);
        // await msg.channel.send({
        //     files: [screenshotBuffer]
        // });

        return false;
    }
}

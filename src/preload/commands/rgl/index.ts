import { Command } from "../../../lib/exec/Command";
import { Client } from "../../../lib/types/Client";
import { Message, MessageEmbed } from "discord.js";
import axios from "axios";
import { ensureSteamID } from "../../../util/steam-id";
import Language from "../../../lib/types/Language";
import PayloadColors, { EmbedColors } from "../../../lib/misc/colors";

const apiAddress = "https://rgl.payload.tf";
export default class RGL extends Command {
	constructor() {
		super("rgl", "Returns data of [mentioned] user.", [
			{
				name: "Steam ID",
				description: "The user's Steam ID who's RGL profile you want to view.",
				required: false,
				type: "string"
			}
		]);
	}

	async run(client: Client, msg: Message): Promise<boolean> {
		const args: any = await this.parseArgs(msg);
		const lang: Language = await this.getLanguage(msg);
		const targetUser = msg.mentions.users.first() || msg.author;

		await msg.channel.sendTyping();

		let userSteamId: string = "";
		if (args && args.length > 0) {
			const testSteamId = await ensureSteamID(args[0] as string);
			if (testSteamId) userSteamId = args[0];
		} else {
			const user = await client.userManager.getUser(targetUser.id);
			userSteamId = user.user.steamId;
		}

		if (!userSteamId?.length) return await this.fail(msg, lang.rgl_fail_noid);

		try {
			const {
				data: { data: profile }
			} = await axios(`${apiAddress}/api/v1/profiles/${userSteamId}`);

			let description = `
            ${lang.rgl_embeddesc_steamid}: ${profile.steamId}
            ${lang.rgl_embeddesc_name}: ${profile.name}
            ${lang.rgl_embeddesc_earnings}: $${profile.totalEarnings}
        `;

			if (profile.status.banned) description += lang.rgl_embeddesc_banned;
			if (profile.status.probation) description += lang.rgl_embeddesc_probation;
			if (profile.status.verified) description += lang.rgl_embeddesc_verified;

			const embed = new MessageEmbed({
				title: lang.rgl_embedtitle,
				description,
				color: PayloadColors.USER,
				thumbnail: {
					url: profile.avatar
				}
			});

			embed.setURL(profile.link);

			await msg.channel.send({ embeds: [embed] });

			return true;
		} catch (err: any) {
			const { message, steamId } = err.response;
			const embed = new MessageEmbed({
				title: lang.rgl_embedtitle,
				description: `${lang.rgl_embeddesc_steamid}: ${steamId}
                     ${lang.rgl_embeddesc_error}: ${message}
                `,
				color: EmbedColors.DARK_ORANGE
			});
			await msg.channel.send({ embeds: [embed] });
			return true;
		}
	}
}

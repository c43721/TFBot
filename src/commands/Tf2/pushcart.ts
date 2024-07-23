import { ApplyOptions, RequiresGuildContext } from "@sapphire/decorators";
import { Message, EmbedBuilder, escapeMarkdown, Colors, bold, GuildMember } from "discord.js";
import { send } from "@sapphire/plugin-editable-commands";
import { weightedRandom } from "#utils/random";
import { isAfter, add, addDays, formatDistanceToNowStrict, addSeconds, differenceInSeconds } from "date-fns";
import PayloadColors from "#utils/colors";
import { chunk, codeBlock, isNullOrUndefinedOrEmpty } from "@sapphire/utilities";
import { LanguageKeys } from "#lib/i18n/all";
import { PaginatedMessage } from "@sapphire/discord.js-utilities";
import { Args, CommandOptionsRunTypeEnum } from "@sapphire/framework";
import { Subcommand, type SubcommandMappingArray } from "@sapphire/plugin-subcommands";
import { fetchT } from "@sapphire/plugin-i18next";
import { guild, pushcart } from "#root/drizzle/schema";
import { and, count, countDistinct, desc, eq, lte, max, sql, sum } from "drizzle-orm";

enum PayloadPushResult {
  SUCCESS,
  COOLDOWN,
  CAP,
}

@ApplyOptions<Subcommand.Options>({
  description: LanguageKeys.Commands.Pushcart.Description,
  detailedDescription: LanguageKeys.Commands.Pushcart.DetailedDescription,
  runIn: [CommandOptionsRunTypeEnum.GuildText],
})
export class UserCommand extends Subcommand {
  private readonly database = this.container.database;
  private readonly t = async (msg: Message) => await fetchT(msg);

  public readonly subcommandMappings: SubcommandMappingArray = [
    {
      name: "push",
      type: "method",
      messageRun: async msg => await this.push(msg),
      default: true,
    },
    {
      name: "leaderboard",
      type: "method",
      messageRun: async msg => await this.leaderboard(msg),
    },
    {
      name: "stats",
      type: "method",
      messageRun: async msg => await this.stats(msg),
    },
    {
      name: "rank",
      type: "method",
      messageRun: async (msg, args) => await this.rank(msg, args),
    },
  ];

  @RequiresGuildContext()
  async push(msg: Message) {
    const t = await this.t(msg);

    const { result, lastPushed } = await this.userPushcart(msg.author.id, msg.guildId!);

    if (result === PayloadPushResult.COOLDOWN) {
      const secondsLeft = differenceInSeconds(addSeconds(lastPushed!, 30), new Date());

      return await send(msg, t(LanguageKeys.Commands.Pushcart.Cooldown, { seconds: secondsLeft })!);
    } else if (result === PayloadPushResult.CAP) {
      const timeLeft = formatDistanceToNowStrict(addDays(lastPushed!, 1));

      return await send(msg, t(LanguageKeys.Commands.Pushcart.Maxpoints, { expires: timeLeft }));
    }

    const randomNumber = weightedRandom([
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

    await this.database.insert(pushcart).values({
      pushed: randomNumber,
      guildId: msg.guildId,
      userId: msg.author.id,
    });

    const [{ pushed }] = await this.database
      .select({ pushed: sum(pushcart.pushed) })
      .from(pushcart)
      .where(eq(pushcart.guildId, guild.id));

    return await send(
      msg,
      t(LanguageKeys.Commands.Pushcart.PushSuccess, {
        units: randomNumber,
        total: pushed,
      }),
    );
  }

  @RequiresGuildContext()
  async leaderboard(msg: Message) {
    const { client } = this.container;

    const loadingEmbed = new EmbedBuilder().setDescription("Loading...").setColor(Colors.Gold);

    const t = await this.t(msg);

    const paginationEmbed = new PaginatedMessage({
      template: new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(t(LanguageKeys.Commands.Pushcart.LeaderboardEmbedTitle)),
    });

    const userLeaderboard = await this.database
      .select({
        userId: pushcart.userId,
        pushed: sum(pushcart.pushed).mapWith(Number),
      })
      .from(pushcart)
      .where(eq(pushcart.guildId, msg.guildId!))
      .groupBy(pushcart.userId, pushcart.guildId);

    if (userLeaderboard.length === 0) {
      return;
    }

    const CHUNK_AMOUNT = 5;

    const sorted = userLeaderboard.sort((a, b) => b.pushed - a.pushed);

    for (const page of chunk(sorted, CHUNK_AMOUNT)) {
      const leaderboardString = page.map(({ userId, pushed }, index) => {
        const user = client.users.cache.get(userId) ?? null;

        return msg.author.id === userId
          ? `> ${index + 1}: ${escapeMarkdown(user?.username ?? "N/A")} (${pushed})`
          : `${index + 1}: ${escapeMarkdown(user?.username ?? "N/A")} (${pushed})`;
      });

      const embed = new EmbedBuilder({
        title: t(LanguageKeys.Commands.Pushcart.LeaderboardEmbedTitle),
        description: codeBlock("md", leaderboardString.join("\n")),
        color: PayloadColors.User,
      });

      paginationEmbed.addPageEmbed(embed);
    }

    const response = await msg.channel.send({ embeds: [loadingEmbed] });

    await paginationEmbed.run(response, msg.author);

    return response;
  }

  @RequiresGuildContext()
  async rank(msg: Message, args: Args) {
    const t = await this.t(msg);
    const targetUser = await args.pick("member").catch(() => msg.author);

    const data = this.database
      .select({
        data: sql`WITH leaderboard AS (SELECT ROW_NUMBER() OVER (ORDER BY pushed DESC) AS rank, SUM(pushed) as pushed, userId FROM ${pushcart} WHERE guildId = ${msg.guildId} GROUP BY userId)
        SELECT * from leaderboard WHERE userId = ${targetUser.id}`,
      })
      .from(pushcart);

    let memberNameToDisplay =
      targetUser instanceof GuildMember ? (targetUser.nickname ?? targetUser.displayName) : targetUser.username;

    memberNameToDisplay ??= "N/A";

    if (isNullOrUndefinedOrEmpty(data)) {
      return await send(
        msg,
        t(LanguageKeys.Commands.Pushcart.RankString, {
          name: escapeMarkdown(memberNameToDisplay),
          count: 0,
        }),
      );
    }

    return await send(
      msg,
      codeBlock(
        "md",
        t(LanguageKeys.Commands.Pushcart.RankString, {
          name: memberNameToDisplay,
          rank: data[0].data.rank ?? "-",
          count: Number(data[0]?.data?.pushed ?? 0),
        }),
      ),
    );
  }

  @RequiresGuildContext()
  async stats(msg: Message) {
    await msg.channel.sendTyping();

    const t = await this.t(msg);
    const guild = await msg.client.guilds.fetch(msg.guildId!);

    const [{ pushed }] = await this.database
      .select({ pushed: count(pushcart.pushed) })
      .from(pushcart)
      .where(eq(pushcart.guildId, guild.id));

    if (pushed === 0) {
      return await send(msg, t(LanguageKeys.Commands.Pushcart.NoPushesYet));
    }

    const [{ totalPushed, totalUnitsPushed }] = await this.database
      .select({ totalPushed: count(pushcart.pushed), totalUnitsPushed: sum(pushcart.pushed) })
      .from(pushcart)
      .where(eq(pushcart.guildId, guild.id));

    const [{ distinctPushers }] = await this.database
      .select({ distinctPushers: countDistinct(pushcart.userId) })
      .from(pushcart)
      .where(eq(pushcart.guildId, guild.id));

    const userStatisticsQuery = await this.database
      .select({
        userId: pushcart.userId,
        count: count(pushcart.pushed).mapWith(Number),
        sum: sum(pushcart.pushed).mapWith(Number),
      })
      .from(pushcart)
      .where(eq(pushcart.guildId, guild.id))
      .groupBy(pushcart.userId)
      .orderBy(desc(pushcart.userId))
      .limit(5);

    const userIdsToFetch = userStatisticsQuery.map(query => query.userId);

    for (const id of userIdsToFetch) {
      await guild.members.fetch(id);
    }

    const topFiveSortedPushers = userStatisticsQuery.sort((a, b) => b.count - a.count);
    const topFiveSummedPushers = userStatisticsQuery.sort((a, b) => b.sum - a.sum);

    const activePushersLeaderboard = topFiveSortedPushers.map(({ count, userId }, index) => {
      const member = guild.members.cache.get(userId);

      const name = escapeMarkdown(member?.nickname ?? member?.user.username ?? "N/A");

      const nameToDisplay = msg.author.id === userId ? bold(escapeMarkdown(name)) : escapeMarkdown(name);

      return t(LanguageKeys.Commands.Pushcart.RankString, {
        name: nameToDisplay,
        rank: index + 1,
        count: count ?? 0,
      });
    });

    const topPushersLeaderboard = topFiveSummedPushers.map(({ userId, sum }, index) => {
      const member = guild.members.cache.get(userId);

      const name = escapeMarkdown(member?.nickname ?? member?.user.username ?? "N/A");

      const nameToDisplay = msg.author.id === userId ? bold(name) : name;

      return t(LanguageKeys.Commands.Pushcart.RankString, {
        name: nameToDisplay,
        rank: index + 1,
        count: sum ?? 0,
      });
    });

    const embed = new EmbedBuilder()
      .setColor(PayloadColors.Payload)
      .setTitle(t(LanguageKeys.Commands.Pushcart.StatsTitle, { name: guild.name }))
      .addFields(
        {
          name: t(LanguageKeys.Commands.Pushcart.TotalUnitsPushedTitle),
          value: t(LanguageKeys.Commands.Pushcart.TotalUnitsPushed, { count: Number(totalUnitsPushed ?? 0) }),
          inline: true,
        },
        {
          name: t(LanguageKeys.Commands.Pushcart.TotalPushedTitle),
          value: t(LanguageKeys.Commands.Pushcart.TotalPushed, { count: Number(totalPushed) }),
          inline: true,
        },
        {
          name: t(LanguageKeys.Commands.Pushcart.DistinctPushersTitle),
          value: t(LanguageKeys.Commands.Pushcart.DistinctPushers, { count: Number(distinctPushers) }),
          inline: true,
        },
      )
      .addFields(
        { name: t(LanguageKeys.Commands.Pushcart.TopPushers), value: topPushersLeaderboard.join("\n"), inline: true },
        {
          name: t(LanguageKeys.Commands.Pushcart.ActivePushers),
          value: activePushersLeaderboard.join("\n"),
          inline: true,
        },
      );

    return await send(msg, { embeds: [embed] });
  }

  private async userPushcart(userId: string, guildId: string) {
    const result = await this.database
      .select({
        userId: pushcart.userId,
        timestamp: max(pushcart.timestamp),
        pushed: sum(pushcart.pushed).mapWith(Number),
      })
      .from(pushcart)
      .where(
        and(
          eq(pushcart.userId, userId),
          eq(pushcart.guildId, guildId),
          lte(pushcart.timestamp, add(Date.now(), { days: 1 }).toString()),
        ),
      )
      .groupBy(pushcart.userId, pushcart.guildId);

    if (result.length === 0) {
      return { result: PayloadPushResult.SUCCESS, lastPushed: new Date() };
    }

    const [{ timestamp, pushed }] = result;

    const isUnderCooldown = isAfter(add(timestamp, { seconds: 30 }), Date.now());

    if (isUnderCooldown && pushed !== 0) {
      return { result: PayloadPushResult.COOLDOWN, timestamp };
    }

    return { result: PayloadPushResult.SUCCESS, timestamp };
  }
}

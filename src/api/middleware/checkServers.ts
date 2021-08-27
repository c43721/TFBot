import { Request, Response, NextFunction } from "express";
import client from "../..";
import DiscordService from "../services/DiscordService";
import GuildService from "../services/GuildService";
import UserService from "../services/UserService";
import getDiscordGuild from "../utils/getDiscordGuild";

const discordService = new DiscordService();
const userService = new UserService();
const guildService = new GuildService();

export default async function checkServers(
  req: Request<{ guildId: string }>,
  res: Response,
  next: NextFunction
) {
  const user = req.user;
  const guildParam = req.params.guildId;

  try {
    const { accessToken, refreshToken } = await userService.getUserByDiscordId(
      user.id
    );

    const userServers = await discordService.getAuthedGuilds(
      user.id,
      accessToken,
      refreshToken
    );

    if (!userServers.map((s) => s.id).includes(guildParam)) {
      return res.status(403).json({
        status: 403,
        message: "You do not have access to that server",
      });
    }

    if (!(await getDiscordGuild(guildParam))) {
      return res.status(404).json({
        status: 400,
        error: "Not found",
        message: "Server not found",
      });
    }

    req.guild = await guildService.getGuildById(guildParam);

    return next();
  } catch (ex: any) {
    client.emit("error", ex);
    return res.status(400).json({
      status: 400,
      message: "Error while getting server",
    });
  }
}

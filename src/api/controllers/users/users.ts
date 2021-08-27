import { Router, Request, Response } from "express";
import config from "../../../config";
import checkAuth from "../../middleware/checkAuth";
import UserService from "../../services/UserService";
import WebhookService from "../../services/WebhookService";
import { getDiscordUser } from "../../utils/getDiscordUser";
import { isBetaTester } from "../../utils/isBetaTester";
import userSettingsSchema from "../../validators/user-settings";

const router = Router();

const userService = new UserService();
const webhookService = new WebhookService();

router.use(checkAuth);

router.get("/", async (req: Request, res: Response) => {
  const user = req.user;

  const { username, tag, discriminator, avatar, defaultAvatarURL } =
    await getDiscordUser(user.id);

  const {
    id,
    notificationsLevel,
    latestUpdateNotifcation,
    steamId,
    webhook,
    fun,
  } = await userService.getUserByDiscordId(user.id);

  res.json({
    isAdmin: config.allowedID === user.id,
    isBetaTester: await isBetaTester(user.id),
    username: tag,
    name: username,
    avatar: avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${avatar}.png`
      : defaultAvatarURL,
    webhook: await webhookService.getWebhookById(webhook),
    pushcartPoints: fun.payload?.feetPushed ?? 0,
    id,
    discriminator,
    notificationsLevel,
    latestUpdateNotifcation,
    steamId,
  });
});

router.patch("/", async (req: Request, res: Response) => {
  try {
    const { ...values } = await userSettingsSchema.validateAsync(req.body);

    if (values) {
      await userService.findByDiscordIdAndUpdate(req.user.id, values);
    }

    return res.status(204).send();
  } catch (err: any) {
    return res.status(400).json({
      status: 400,
      error: "Bad request",
      message: err.details.map((d) => d.message),
    });
  }
});

export default router;

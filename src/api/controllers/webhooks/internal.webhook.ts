import axios from "axios";
import {
  Channel,
  MessageAttachment,
  MessageEmbed,
  TextChannel,
  User,
} from "discord.js";
import { Router, Request, Response } from "express";
import client from "../../..";
import config from "../../../config";
import PayloadColors, { EmbedColors } from "../../../lib/misc/colors";
import { capturePage } from "../../../util/screenshot";
import logsWebhookSchema from "../../validators/logs-webhook";

const isChannel = (type: Channel | User): type is TextChannel =>
  type instanceof TextChannel;
const isUser = (type: Channel | User): type is User => type instanceof User;

const router = Router();

router.post("/test", async (req: Request, res: Response) => {
  // User, Channel
  const scope = req.webhook_type;
  // Snowflake
  const id = req.webhook_id;

  const target = client[scope].cache.get(id) ?? (await client[scope].fetch(id));
  const embed = new MessageEmbed();

  embed.setColor(EmbedColors.GREEN);
  embed.setTitle("Webhook Test");
  embed.setDescription("Successful webhook test!");
  embed.setFooter(`Rendered via Webhook`);
  embed.setTimestamp(new Date());

  // These ifs are kinda dirty. But since I'm fetching, I don't know a better way other than type casting.
  if (isChannel(target)) {
    // Catch permissions, other stuff
    try {
      await target.send({ embeds: [embed] });
    } catch (err) {
      client.logger.error(err);
      return res.status(500).json({
        status: 500,
        error: "Internal server error",
        message: "Something went wrong with your request",
      });
    }
  } else if (isUser(target)) {
    try {
      await target.send({ embeds: [embed] });
    } catch (err) {
      // I can't see this happening, but I do believe if we send DMs to people
      // We could get errors with that stuffs.
      client.logger.error(err);
      return res.status(500).json({
        status: 500,
        error: "Internal server error",
        message: "Something went wrong with your request",
      });
    }
  }

  res.status(204).send();
});

router.post("/logs", async (req: Request, res: Response) => {
  // User, Channel
  const scope = req.webhook_type;
  // Snowflake
  const id = req.webhook_id;

  let logsId: string;
  try {
    const values = await logsWebhookSchema.validateAsync(req.body, {
      stripUnknown: true,
    });
    // I literally can never see this happening.
    if (!values?.logsId) throw new Error("No logsId present");
    logsId = values.logsId;
  } catch (err: any) {
    return res.status(400).json({
      status: 400,
      error: "Bad request",
      message: err.details.map((d) => d.message),
    });
  }

  // Sanity check: Is the log valid?
  const { data: logsApiJson } = await axios.get(
    `https://logs.tf/api/v1/log/${logsId}`
  );

  if (logsApiJson.success === false) {
    return res.status(400).json({
      status: 400,
      error: "Bad request",
      message: "logsId is not a valid log id",
    });
  }

  const logUrl = `https://logs.tf/${logsId}`;

  const target = await client[scope].fetch(id);

  const screenshotBuffer = await capturePage(logUrl, {
    top: {
      selector: "#log-header",
      edge: "top",
    },
    left: {
      selector: "#log-header",
      edge: "left",
    },
    right: {
      selector: "#log-header",
      edge: "right",
    },
    bottom: {
      selector: "#log-section-players",
      edge: "bottom",
    },

    cssPath: config.files.LOGS_CSS,
  });

  const att = new MessageAttachment(screenshotBuffer, "log.png");
  const embed = new MessageEmbed();
  embed.setColor(PayloadColors.COMMAND);
  embed.setTitle("Logs.tf Preview");
  embed.setURL(logUrl);
  embed.setImage(`attachment://log.png`);
  embed.setFooter(`Rendered via Webhook`);
  embed.setTimestamp(new Date());

  // These ifs are kinda dirty. But since I'm fetching, I don't know a better way other than type casting.
  if (isChannel(target)) {
    // Catch permissions, other stuff
    try {
      await target.send({ embeds: [embed], files: [att] });
    } catch (err) {
      client.logger.error(err);
      return res.status(500).json({
        status: 500,
        error: "Internal server error",
        message: "Something went wrong with your request",
      });
    }
  } else if (isUser(target)) {
    try {
      await target.send({ embeds: [embed], files: [att] });
    } catch (err) {
      // I can't see this happening, but I do believe if we send DMs to people
      // We could get errors with that stuffs.
      client.logger.error(err);
      return res.status(500).json({
        status: 500,
        error: "Internal server error",
        message: "Something went wrong with your request",
      });
    }
  }

  res.status(204).send();
});

export default router;

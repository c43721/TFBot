import { SapphireClient } from "@sapphire/framework";
import { Enumerable } from "@sapphire/decorators";
import type { Message } from "discord.js";
import { join } from "path";
import { CLIENT_OPTIONS } from "#utils/clientOptions";
import { Server } from "./models/Server";
import config from "#root/config";
import { AutoResponseStore } from "./structs/AutoResponse/AutoResponseStore";
import type { SnipeCache } from "./interfaces/cache";
import i18next from "i18next";
import { DurationFormatter } from "@sapphire/time-utilities";

process.env.NODE_ENV ??= "development";

export class PayloadClient extends SapphireClient {
  @Enumerable(false)
  public dev = process.env.NODE_ENV !== "production";

  @Enumerable(false)
  public cache: SnipeCache = {
    snipe: {},
    pings: {},
  };

  constructor() {
    super(CLIENT_OPTIONS);

    this.stores.register(
      new AutoResponseStore().registerPath(join(__dirname, "..", "auto"))
    );
  }

  public fetchPrefix = async (msg: Message) => {
    if (msg.guildId) {
      const server = await Server.findOne({ id: msg.guildId }).lean();;

      return server?.prefix ?? config.PREFIX;
    }

    return [config.PREFIX, ""];
  };

  public async login(token?: string) {
    const response = await super.login(token);

    // i18n formatting
    // @TODO: move this to plugin instead... needs PR
    i18next.services!.formatter!.add("duration", (value, _lng, options) => {
      return new DurationFormatter().format(value, options?.duration ?? 2);
    });

    return response;
  }

  public destroy() {
    super.destroy();
  }
}

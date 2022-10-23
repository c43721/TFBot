import type { AutoResponseStore } from "#lib/structs/AutoResponse/AutoResponseStore";
import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, ListenerOptions } from "@sapphire/framework";
import type { Message } from "discord.js";

@ApplyOptions<ListenerOptions>({
  name: "autoresponse-messagecreate"
})
export class UserListener extends Listener<typeof Events.MessageCreate> {
  public async run(message: Message) {
    // If the message was sent by a webhook, return:
    if (message.webhookId !== null) return;

    // If the message was sent by the system, return:
    if (message.system) return;

    // If the message was sent by a bot, return:
    if (message.author.bot) return;

    console.log(message.content);

    const { client } = this.container;

    const autoResponses = client.stores.get("autoresponses" as any) as AutoResponseStore;

    // Check auto responses
    // @TODO: Split into listners
    for (const autoResponse of autoResponses.values()) {
      const doesMatch = autoResponse.shouldRun(message);

      if (!doesMatch) continue;

      const context = {
        commandName: autoResponse.name,
        matched: autoResponse.getMatch(message),
        prefix: autoResponse.getMatch(message),
        commandPrefix: autoResponse.getMatch(message),
      };

      // Run global preconditions:
      const globalResult = await this.container.stores
        .get("preconditions")
        .messageRun(message, autoResponse, { message, command: autoResponse });

      globalResult.mapErr(err => {
        this.container.client.emit(Events.MessageCommandDenied, err, {
          message,
          command: autoResponse,
          context,
          parameters: "",
        });
      });

      // Run command-specific preconditions:
      const localResult = await autoResponse.preconditions.messageRun(message, autoResponse, {
        message,
        command: autoResponse,
      });

      localResult.mapErr(err => {
        this.container.client.emit(Events.MessageCommandDenied, err, {
          message,
          command: autoResponse,
          context,
          parameters: "",
        });
      });

      await message.channel.sendTyping();

      const args = await autoResponse.messagePreParse(message, message.content, context);

      return await autoResponse.messageRun(message, args, context);
    }
  }
}

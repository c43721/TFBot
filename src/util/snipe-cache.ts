import { Message, Collection } from "discord.js";
import { Client } from "../lib/types";
import puppeteer, { ElementHandle } from "puppeteer";
import cheerio from "cheerio";
import { format } from "date-fns"
import { closeBrowser, createOrConnectChrome } from "./screenshot";

// Module doesn't have support for TS.
const imageToBase64 = require("image-to-base64");

/**
 * Contains the following IDs:
 * - gen_avatar
 * - gen_username
 * - gen_timestamp
 * - gen_messageContent
 */
export const DISCORD_MESSAGE_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="ie=edge"><title>Discord Message</title><style>*{margin:0;padding:0}a,abbr,acronym,address,applet,big,blockquote,body,caption,cite,code,dd,del,dfn,div,dl,dt,em,fieldset,form,h1,h2,h3,h4,h5,h6,html,iframe,img,ins,kbd,label,legend,li,object,ol,p,pre,q,s,samp,small,span,strike,strong,sub,sup,table,tbody,td,tfoot,th,thead,tr,tt,ul,var{border:0;font-family:inherit;font-size:100%;font-style:inherit;font-weight:inherit;margin:0;padding:0;vertical-align:baseline}.containerCozyBounded{overflow:hidden}.container{-moz-user-select:text;-ms-user-select:text;-webkit-box-sizing:border-box;-webkit-user-select:text;box-sizing:border-box;user-select:text;word-wrap:break-word}.wrap-all{position:absolute;left:50px;top:50px;padding:10px 3px}.containerCozyBounded.containerCozy.container{background:#36393F;padding:20px 0;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;width:400px;border-radius:3px;box-shadow:0px 4px 3px rgba(0,0,0,0.4)}.timestampCozy{color:hsla(0, 0%, 100%, .2);font-size:0.75rem;font-weight:400;letter-spacing:0;margin-left: .3rem}.message{margin-bottom: .2em}.headerCozy{-ms-flex-align:start;-ms-flex-line-pack:initial;-webkit-box-align:start;align-content:normal;align-items:flex-start;display:-webkit-box;display:-ms-flexbox;display:flex;height:1.3em}.avatar{-webkit-transition:opacity .2s ease;cursor:pointer;margin:-2px 20px 20px;opacity:1;transition:opacity .2s ease}.large{height:40px;width:40px}.wrapper{flex-shrink:0;position:relative}.image{background-clip:padding-box;background-color:none;background-position:50%;background-size:100%;height:100%;width:100%;border-radius:50%}.headerCozyMeta{color:hsla(0,0%,100%,.2);white-space:nowrap}.username{color:#fff;cursor:pointer;font-size:1rem;letter-spacing:0;font-weight:500}.contentCozy{margin-left:80px}.content{padding-right:10px}.markup{-moz-user-select:text;-ms-user-select:text;-webkit-user-select:text;font-size:0.9375rem;line-height:1.3;user-select:text;white-space:pre-wrap;word-wrap:break-word;color:#dcddde}</style></head><body><div class="wrap-all"><div class="containerCozyBounded containerCozy container"><div class="messageCozy message"><div class="headerCozy"><div class="wrapper large avatar"><div class="image large" id="gen_avatar" style="background-image: url('https://cdn.discordapp.com/avatars/151044827738275840/a_64f22f28f6848d50ae437007563eefea.png?size=128');"></div></div><h2 class="headerCozyMeta"><span class="usernameWrapper"><strong tabindex="0" class="username" style="color: rgb(173, 20, 87);" id="gen_username">sharky</strong></span><time class="timestampCozy" datetime="1528592651316" id="gen_timestamp">06/09/2018</time></h2></div><div class="contentCozy content"><div class="containerCozy container"><div class="markup" id="gen_messageContent">Example message!<br>Hello World!</div></div></div></div></div></div></body></html>`

/**
 * Renders a Discord message. This functions is basically copy-pasted from the old code.
 * @param message The message object to render.
 */
export async function renderMessage(message: Message): Promise<{ buffer: Buffer, attachments: string, links: string }> {
    const browser = await createOrConnectChrome();

    const page = await browser.newPage();
    await page.setViewport({
        width: 1000,
        height: 2000,
        deviceScaleFactor: 2
    });

    const $ = cheerio.load(DISCORD_MESSAGE_HTML);

    const username = message.member.displayName;
    const color = message.member.displayHexColor != "#000000" ? message.member.displayHexColor : "#ffffff";
    const avatarURL = message.author.displayAvatarURL().replace(/\.gif|\.jpg|\.jpeg/, ".png") + "?size=128";
    const date = message.editedAt || message.createdAt;
    const timestamp = format(date, "MM/dd/yyyy");

    const avatarBase64: string = await imageToBase64(avatarURL);

    $("#gen_avatar").attr("style", `background-image: url('data:image/png;base64,${avatarBase64}');`);
    $("#gen_username").attr("style", "color: " + color).text(username);
    $("#gen_timestamp").text(timestamp);
    $("#gen_messageContent").html(message.cleanContent.replace(/\n/g, "<br>"));

    let attachments = "";
    if (message.attachments.size > 0) {
        attachments = `**ATTACHMENTS**\n<${[...message.attachments.mapValues(a => a.proxyURL).values()].join(">\n<")}>`
    }

    let links = "";
    if (message.cleanContent.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g)) {
        links = `**LINKS**\n<${(message.cleanContent.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g) as Array<string>).join(">\n<")}>`;
    }

    await page.setContent($.html());
    let element = await page.$("div.wrap-all") as ElementHandle;
    let screenshotBuffer = await element.screenshot({
        encoding: "binary",
        omitBackground: true
    }) as Buffer;

    await closeBrowser(browser);

    return {
        buffer: screenshotBuffer,
        attachments: attachments,
        links: links
    };
}

export function ensureChannel(client: Client, message: Message): void {
    if (!client.cache.snipe[message.guild.id]) client.cache.snipe[message.guild.id] = {};
    if (!client.cache.snipe[message.guild.id][message.channel.id]) client.cache.snipe[message.guild.id][message.channel.id] = new Collection();
}

export function ensurePingChannel(client: Client, message: Message): void {
    if (!client.cache.pings[message.guild.id]) client.cache.pings[message.guild.id] = {};
    if (!client.cache.pings[message.guild.id][message.channel.id]) client.cache.pings[message.guild.id][message.channel.id] = new Collection();
}

export function channelCacheExists(client: Client, message: Message): boolean {
    if (message.channel.type !== "GUILD_TEXT") return false;
    if (!client.cache.snipe[message.guild.id]) return false;
    if (!client.cache.snipe[message.guild.id][message.channel.id]) return false;

    return true;
}

export function pingChannelCacheExists(client: Client, message: Message): boolean {
    if (!client.cache.pings[message.guild.id]) return false;
    if (!client.cache.pings[message.guild.id][message.channel.id]) return false;

    return true;
}

export function getCache(client: Client, message: Message): Collection<String, Message> {
    return client.cache.snipe[message.guild.id][message.channel.id];
}

export function getPingCache(client: Client, message: Message): Collection<String, Message> {
    return client.cache.pings[message.guild.id][message.channel.id];
}

/**
 * Stores a message in the snipe cache.
 * @param bot The bot object with a snipe cache to store the message in.
 * @param message The message object to store.
 */
export function handleMessageDelete(client: Client, message: Message): boolean {
    if (message.author.bot) return false;
    if (message.channel.type != "GUILD_TEXT") return false;

    ensureChannel(client, message);

    client.cache.snipe[message.guild.id][message.channel.id].set(message.id, message);

    if (message.mentions.members.size > 0 || message.mentions.everyone) {
        ensurePingChannel(client, message);

        client.cache.pings[message.guild.id][message.channel.id].set(message.id, message);
    }

    return true;
}

/**
 * Cleans up the snipe cache.
 * @param client The client object with a snipe cache to clean up.
 * @param guildId The guild ID to check. Best used in a for loop.
 */
export function clearSnipeCache(client: Client, guildId: string): boolean {
    let now = new Date();

    Object.keys(client.cache.snipe[guildId]).forEach((channelId: string) => {
        const allMessages = client.cache.snipe[guildId][channelId];

        allMessages.forEach((cachedMessage: Message) => {
            let cachedMessageDateMS = (cachedMessage.editedAt || cachedMessage.createdAt).getTime();
            let minutesDifference = (now.getTime() - cachedMessageDateMS) / 60000;

            if (minutesDifference > 5) client.cache.snipe[guildId][channelId].delete(cachedMessage.id);

            if (!client.cache.snipe[guildId][channelId].size) delete client.cache.snipe[guildId][channelId];
            if (!Object.values(client.cache.snipe[guildId]).length) delete client.cache.snipe[guildId];
        })
    });

    return true;
}

/**
 * Cleans up the pings cache.
 * @param client The client object with a pings cache to clean up.
 * @param guildId The guild ID to check. Best used in a for loop.
 */
export function clearPingCache(client: Client, guildId: string): boolean {
    let now = new Date();

    Object.keys(client.cache.pings[guildId]).forEach((channelId: string) => {
        const allMessages = client.cache.pings[guildId][channelId];

        allMessages.forEach((cachedMessage: Message) => {
            let cachedMessageDateMS = (cachedMessage.editedAt || cachedMessage.createdAt).getTime();
            let minutesDifference = (now.getTime() - cachedMessageDateMS) / 60000;

            if (minutesDifference > 5) client.cache.pings[guildId][channelId].delete(cachedMessage.id);

            if (!client.cache.pings[guildId][channelId].size) delete client.cache.pings[guildId][channelId];
            if (!Object.values(client.cache.pings[guildId]).length) delete client.cache.pings[guildId];
        })
    });

    return true;
}
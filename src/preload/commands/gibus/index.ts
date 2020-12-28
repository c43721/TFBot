import { Command } from "../../../lib/exec/Command";
import { Client } from "../../../lib/types/Client";;
import { Message } from "discord.js";
import { createCanvas, loadImage } from "canvas";
import axios from "axios";
import AWS from "aws-sdk";
import path from "path";
import Language from "../../../lib/types/Language";

export default class Gibus extends Command {
    constructor() {
        super(
            "gibus",
            "Gives an image a ghostly gibus. Must be used right after posting an image.",
            undefined,
            ["SEND_MESSAGES", "ATTACH_FILES"]
        );
    }

    async run(client: Client, msg: Message): Promise<boolean> {
        const lang: Language = await this.getLanguage(msg);
        return new Promise(async resolve => {
            let messages = await msg.channel.messages.fetch({ limit: 5 });
    
            let img = messages.find(message => message.author.id == msg.author.id && message.attachments.size > 0);
    
            if (!img) {
                return resolve(await this.fail(msg, lang.face_fail_noimg));
            }
    
            let attachment = img.attachments.first();
    
            msg.channel.startTyping();
    
            const { data: response  } = await axios(attachment.url);
    
            const credentials = new AWS.SharedIniFileCredentials();
            AWS.config.credentials = credentials;
            AWS.config.update({ region: "us-east-1" });
    
            const rekognition = new AWS.Rekognition();
    
            rekognition.detectFaces({
                Image: {
                    Bytes: response
                }
            }, async (err, data) => {
                if (err) {
                    console.log(err);
                    return resolve(await this.fail(msg, lang.face_error));
                }

                if (!data.FaceDetails) {
                    return resolve(await this.fail(msg, lang.face_error));
                }
    
                let canvas = createCanvas(attachment.width, attachment.height);
                let ctx = canvas.getContext("2d");
    
                let image = await loadImage(response);
                let hat = await loadImage(path.resolve(__dirname, "../../../assets/gibus.png"));
    
                ctx.drawImage(image, 0, 0);
    
                let headsFound = 0;
    
                data.FaceDetails.forEach(face => {
                    if (!face.BoundingBox) return;
                    if (!face.BoundingBox.Width || !face.BoundingBox.Height || !face.BoundingBox.Left || !face.BoundingBox.Top) return;
    
                    headsFound++;
    
                    let width = attachment.width * face.BoundingBox.Width;
                    let height = attachment.height * face.BoundingBox.Height;
                    let left = attachment.width * face.BoundingBox.Left;
                    let top = attachment.height * face.BoundingBox.Top;
    
                    ctx.drawImage(hat, left - width * 1.5 * (269 / 272) / 4, top - height + (width * 1.5 * (269 / 272) / 4), width * 1.5, width * 1.5 * (269 / 272));
                });

                if (!headsFound) {
                    return resolve(await this.fail(msg, lang.face_fail_novalidface));
                }

                await msg.channel.send({
                    files: [canvas.toBuffer()]
                });

                resolve(true);
            });
        });
    }
}
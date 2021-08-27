import Joi from "joi";
import { NotificationLevel } from "../../util/push-notification";

const userSettingsSchema = Joi.object({
  steamId: Joi.string()
    .allow("")
    .regex(/(765611\d{11})/)
    .optional()
    .default(null),
  notificationsLevel: Joi.number()
    .min(NotificationLevel.NONE)
    .max(NotificationLevel.ALL),
});

export default userSettingsSchema;

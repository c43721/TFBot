import Joi from "joi";

const logsWebhookSchema = Joi.object({
  logsId: Joi.string().required(),
});

export default logsWebhookSchema;

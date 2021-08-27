import Joi from "joi";

const LANGUAGES = {
  ENGLISH: "en-US",
  SPANISH: "es-ES",
  FINNISH: "fi-FI",
  GERMAN: "de-DE",
  POLISH: "pl-PL",
};

const guildSettingsSchema = Joi.object({
  botName: Joi.string().min(1).max(100),
  prefix: Joi.string().min(1).max(75),
  enableSnipeForEveryone: Joi.boolean(),
  language: Joi.string().valid(...Object.values(LANGUAGES)),
});

export default guildSettingsSchema;

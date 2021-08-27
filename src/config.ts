import path from "path";

const config = {
    /**
     * Default prefix
     */
    PREFIX: "pls ",

    /**
     * Bot owner discord id
     */
    allowedID: process.env.OWNER_ID,

    /**
     * Logging channels
     */
    logging: {
        releaseChannel: process.env.RELEASE_CHANNEL,
        logChannel: process.env.LOG_CHANNEL,
        eventChannel: process.env.EVENT_CHANNEL,
        errorChannel: process.env.ERROR_CHANNEL,
    },

    /**
     * Static files for CSS or other assets
     */
    files: {
        LOGS_CSS: path.join(__dirname, "../assets/dark-logs.css"),
    },
} as const;

export default config;

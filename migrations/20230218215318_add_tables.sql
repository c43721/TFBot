CREATE TABLE IF NOT EXISTS users
(
    id NVARCHAR(55) PRIMARY KEY NOT NULL,
    steamId NVARCHAR(55)
);

CREATE TABLE IF NOT EXISTS webhooks
(
    id NVARCHAR(55) PRIMARY KEY NOT NULL,
    value NVARCHAR(100) UNIQUE NOT NULL,
    type NVARCHAR(55) NOT NULL
);

CREATE TABLE IF NOT EXISTS pushcart
(
    id BIGINT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    userId NVARCHAR(55) NOT NULL,
    guildId NVARCHAR(55) NOT NULL,
    pushed INT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT (UTC_TIMESTAMP)
);
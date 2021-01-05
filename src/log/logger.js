const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const config = require("config");
const logFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.printf(
        info => `${info.timestamp} ${info.level}: ${info.message}`,
    ));
const transport = new DailyRotateFile({
    filename: config.get("logConfig.logFolder") + config.get("logConfig.logFile"),
    datePattern: 'YYYYMMDD',
    zippedArchive: true,
    maxSize: '5m',
    maxFiles: '7d',
    prepend: true,
    level: config.get("logConfig.logLevel"),
});
transport.on('rotate', function (oldFilename, newFilename) {
});
const logger = winston.createLogger({
    format: logFormat,
    transports: [
        transport,
        new winston.transports.Console({
            level: "info",
        }),
    ]
});
module.exports = logger;
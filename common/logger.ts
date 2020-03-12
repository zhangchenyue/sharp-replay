import fs from 'fs';
import path from 'path';
import { createLogger, format, transports } from 'winston';

const level = process.env.LOG_LEVEL || 'debug';

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.printf((info: any) => `${info.timestamp} [${info.level}]: ${info.message}`)
  ),
  transports: [
    // new transports.Console({ level }),
    new transports.Stream({
      level,
      stream: fs.createWriteStream(path.join(__dirname, '../debug.log')),
    }),
  ],
});

export default logger;

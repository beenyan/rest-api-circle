import pino from 'pino';
import dayjs from 'dayjs';
import path from 'path';

const loggerPath = path.join(process.cwd(), 'logs/info.log');

const log = pino({
  transport: {
    target: 'pino-pretty', // must be installed separately
  },
  base: {
    pid: false,
  },
  timestamp: () => `,"time":"${dayjs().format()}"`,
});

export default log;

import { createWriteStream } from 'fs';
import morgan from 'morgan';
import path from 'path';

const combinedLogPath = path.join(process.cwd(), 'logs/combined.log');
const combinedLogStream = createWriteStream(combinedLogPath, { flags: 'a' });

export default morgan('combined', { stream: combinedLogStream });

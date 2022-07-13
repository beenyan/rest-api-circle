import express, { NextFunction, Request, Response } from 'express';
import config from 'config';
import pool from './utils/connect';
import { routes } from './route';
import cookieParser from 'cookie-parser';
import log from './utils/logger';
import morganMiddleware from './middleware/requertLogger';

const app = express();
const port = config.get<number>('port');

app.use(morganMiddleware);
app.use(express.static('public'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, async () => {
  log.info(`Server start on port ${port}`);

  await pool;

  routes(app);
});

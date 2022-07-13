import { Express, Request, Response } from 'express';
import multer from 'multer';
import pool from './utils/connect';
import path from 'path';
import config from 'config';
import { get, omit } from 'lodash';
import { signJwt, verifyJwt } from './utils/jwt.utils';
import { FieldPacket } from 'mysql2';

const upload = multer();
const loginFormMiddleware = upload.fields([
  {
    name: 'account',
    maxCount: 1,
  },
  {
    name: 'password',
    maxCount: 1,
  },
]);
interface IUser {
  id: 6;
  name: string;
  account: string;
  password: string;
  create_at: Date;
  update_at: Date;
}

export function routes(app: Express) {
  app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
  });

  app.post(
    '/api/login',
    loginFormMiddleware,
    async (req: Request, res: Response) => {
      const sql = /* sql */ `SELECT * FROM users WHERE account = ? AND password = ? LIMIT 1`;
      const [users] = (await pool.query(sql, [
        req.body.account,
        req.body.password,
      ])) as [IUser[], FieldPacket[]];

      if (!users.length)
        return res
          .status(401)
          .json({ success: false, message: '錯誤的帳號或密碼' });

      const user = omit(users[0], 'password');

      const accessToken = signJwt(user, 'accessTokenPrivateKey', {
        expiresIn: config.get('accessTokenTtl'), // 15 minutes
      });

      const refreshToken = signJwt(user, 'refreshTokenPrivateKey', {
        expiresIn: config.get('refreshTokenTtl'), // 1 year
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        sameSite: true,
      });

      return res.json({
        success: true,
        message: '',
        data: { accessToken, refreshToken },
      });
    }
  );

  app.get('/api/check-token', (req: Request, res: Response) => {
    const accessToken = get(req.headers, 'authorization', '').replace(
      /^Bearer\s/,
      ''
    );
    const refreshToken = get(req.cookies, 'refresh_token', null);

    const { decoded, expired, valid } = verifyJwt(
      accessToken,
      'accessTokenPublicKey'
    );

    if (!valid && !expired)
      return res.status(403).json({ success: false, message: 'Unkonw Token' });

    if (decoded) {
      return res.json({ success: true, message: '', data: decoded });
    }

    if (expired && refreshToken) {
      const { decoded, expired, valid } = verifyJwt(
        refreshToken,
        'refreshTokenPublicKey'
      );

      if (!valid && !expired)
        return res
          .status(403)
          .json({ success: false, message: 'Unkonw Token' });

      if (expired)
        return res
          .status(403)
          .json({ success: false, message: 'Required log in again.' });

      const accessToken = signJwt(
        omit(decoded as Object, 'exp'),
        'accessTokenPrivateKey',
        { expiresIn: config.get('accessTokenTtl') } // 15 minutes
      );

      console.log(req.headers);

      res.setHeader('x-access-token', accessToken);
    }

    return res.json({ success: true, message: 'end' });
  });
}

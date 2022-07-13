import { createPool } from 'mysql2';
import config from 'config';
import log from './logger';

const pool = createPool({
  host: config.get('DB_Host'),
  user: config.get('DB_User'),
  password: config.get('DB_Password'),
  database: config.get('DB_Database'),
});

pool.getConnection((err) => {
  if (err) {
    log.error('Could not connect to db');
    process.exit(1);
  }
  log.info('DB connected');
});

export default pool.promise();

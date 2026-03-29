import type { QueryResult } from 'mysql2';
import mysql from 'mysql2/promise';

import { env } from '../config/env';

const poolConfig = {
   host: env.CHATBOT_DB_HOST,
   port: env.CHATBOT_DB_PORT,
   user: env.CHATBOT_DB_USER,
   password: env.CHATBOT_DB_PASSWORD,
   database: env.CHATBOT_DB_NAME,
   connectionLimit: env.CHATBOT_DB_CONNECTION_LIMIT,
   waitForConnections: true,
   queueLimit: 0,
} as const;

export const pool = mysql.createPool(poolConfig);

export const database = {
   async query<T extends QueryResult>(sql: string, values?: unknown[]) {
      const [rows] = await pool.query<T>(sql, values);
      return rows;
   },
};

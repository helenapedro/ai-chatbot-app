import type { QueryResult } from 'mysql2';
import mysql from 'mysql2/promise';

import { env } from '../config/env';
import { AppError } from '../errors/app-error';

const pool = mysql.createPool({
   host: env.DB_HOST,
   port: env.DB_PORT,
   user: env.DB_USER,
   password: env.DB_PASSWORD,
   database: env.DB_NAME,
   connectionLimit: env.DB_CONNECTION_LIMIT,
   waitForConnections: true,
   queueLimit: 0,
});

const conversationSessionsTableSql = `
   CREATE TABLE IF NOT EXISTS conversation_sessions (
      conversation_id CHAR(36) NOT NULL PRIMARY KEY,
      last_response_id VARCHAR(255) NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   )
`;

export const initializeDatabase = async () => {
   try {
      await pool.query(conversationSessionsTableSql);
   } catch (error) {
      throw new AppError('Failed to initialize the database.', 500, {
         cause:
            error instanceof Error ? error.message : 'Unknown database error',
      });
   }
};

export const checkDatabaseHealth = async () => {
   try {
      await pool.query('SELECT 1');
      return true;
   } catch {
      return false;
   }
};

export const database = {
   async query<T extends QueryResult>(sql: string, values?: unknown[]) {
      const [rows] = await pool.query<T>(sql, values);
      return rows;
   },
};

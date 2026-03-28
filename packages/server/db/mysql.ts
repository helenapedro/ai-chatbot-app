import type { QueryResult } from 'mysql2';
import mysql from 'mysql2/promise';

import { env } from '../config/env';
import { AppError } from '../errors/app-error';

const pool = mysql.createPool({
   host: env.CHATBOT_DB_HOST,
   port: env.CHATBOT_DB_PORT,
   user: env.CHATBOT_DB_USER,
   password: env.CHATBOT_DB_PASSWORD,
   database: env.CHATBOT_DB_NAME,
   connectionLimit: env.CHATBOT_DB_CONNECTION_LIMIT,
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

const conversationMessagesTableSql = `
   CREATE TABLE IF NOT EXISTS conversation_messages (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      conversation_id CHAR(36) NOT NULL,
      role VARCHAR(16) NOT NULL,
      content TEXT NOT NULL,
      openai_response_id VARCHAR(255) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_conversation_messages_conversation_id_created_at (conversation_id, created_at, id),
      CONSTRAINT chk_conversation_messages_role
         CHECK (role IN ('user', 'bot'))
   )
`;

export const initializeDatabase = async () => {
   try {
      await pool.query(conversationSessionsTableSql);
      await pool.query(conversationMessagesTableSql);
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

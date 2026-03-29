import type { QueryResult, RowDataPacket } from 'mysql2';
import mysql from 'mysql2/promise';

import { env } from '../config/env';
import { AppError } from '../errors/app-error';
import { encryptMessageContent } from '../security/message-crypto';

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

const pool = mysql.createPool(poolConfig);

const createConversationSessionsTableSql = `
   CREATE TABLE IF NOT EXISTS conversation_sessions (
      conversation_id CHAR(36) NOT NULL PRIMARY KEY,
      last_response_id VARCHAR(255) NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   )
`;

const createConversationMessagesTableSql = `
   CREATE TABLE IF NOT EXISTS conversation_messages (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      conversation_id CHAR(36) NOT NULL,
      role VARCHAR(16) NOT NULL,
      content TEXT NOT NULL,
      content_iv VARCHAR(24) NULL,
      content_auth_tag VARCHAR(24) NULL,
      openai_response_id VARCHAR(255) NULL,
      model_name VARCHAR(100) NULL,
      input_tokens INT NULL,
      output_tokens INT NULL,
      total_tokens INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_conversation_messages_conversation_id_created_at (conversation_id, created_at, id),
      CONSTRAINT chk_conversation_messages_role
         CHECK (role IN ('user', 'bot'))
   )
`;

const conversationMessagesMigrationStatements = [
   'ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS content_iv VARCHAR(24) NULL AFTER content',
   'ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS content_auth_tag VARCHAR(24) NULL AFTER content_iv',
   'ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS model_name VARCHAR(100) NULL AFTER openai_response_id',
   'ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS input_tokens INT NULL AFTER model_name',
   'ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS output_tokens INT NULL AFTER input_tokens',
   'ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS total_tokens INT NULL AFTER output_tokens',
];

type PlaintextConversationMessageRow = RowDataPacket & {
   content: string;
   id: number;
};

const getPlaintextConversationMessages = async () => {
   const [rows] = await pool.query<PlaintextConversationMessageRow[]>(
      `
         SELECT id, content
         FROM conversation_messages
         WHERE content_iv IS NULL
           AND content_auth_tag IS NULL
      `
   );

   return rows;
};

const encryptStoredConversationMessage = async (
   row: PlaintextConversationMessageRow
) => {
   const encrypted = encryptMessageContent(row.content);

   await pool.query(
      `
         UPDATE conversation_messages
         SET content = ?, content_iv = ?, content_auth_tag = ?
         WHERE id = ?
      `,
      [encrypted.content, encrypted.contentIv, encrypted.contentAuthTag, row.id]
   );
};

const backfillEncryptedMessages = async () => {
   const rows = await getPlaintextConversationMessages();

   for (const row of rows) {
      await encryptStoredConversationMessage(row);
   }
};

const runStatements = async (statements: string[]) => {
   for (const statement of statements) {
      await pool.query(statement);
   }
};

const initializeSchema = async () => {
   await runStatements([
      createConversationSessionsTableSql,
      createConversationMessagesTableSql,
      ...conversationMessagesMigrationStatements,
   ]);
};

const createInitializationError = (error: unknown) =>
   new AppError('Failed to initialize the database.', 500, {
      cause: error instanceof Error ? error.message : 'Unknown database error',
   });

export const initializeDatabase = async () => {
   try {
      await initializeSchema();
      await backfillEncryptedMessages();
   } catch (error) {
      throw createInitializationError(error);
   }
};

const pingDatabase = async () => {
   await pool.query('SELECT 1');
};

export const checkDatabaseHealth = async () => {
   try {
      await pingDatabase();
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

import type { Pool } from 'mysql2/promise';

import type { Migration } from './migration.types';

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

const runStatements = async (pool: Pool, statements: string[]) => {
   for (const statement of statements) {
      await pool.query(statement);
   }
};

export const createConversationTablesMigration: Migration = {
   name: '001_create_conversation_tables',
   async up(pool) {
      await runStatements(pool, [
         createConversationSessionsTableSql,
         createConversationMessagesTableSql,
      ]);
   },
};

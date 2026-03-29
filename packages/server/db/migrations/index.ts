import { createConversationTablesMigration } from './001_create_conversation_tables.js';
import { backfillMessageEncryptionMigration } from './002_backfill_message_encryption.js';

export const migrations = [
   createConversationTablesMigration,
   backfillMessageEncryptionMigration,
];

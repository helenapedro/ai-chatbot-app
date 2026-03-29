import { backfillMessageEncryptionMigration } from './002_backfill_message_encryption';
import { createConversationTablesMigration } from './001_create_conversation_tables';

export const migrations = [
   createConversationTablesMigration,
   backfillMessageEncryptionMigration,
];

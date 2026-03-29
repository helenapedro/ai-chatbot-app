import type { RowDataPacket } from 'mysql2';

import { encryptMessageContent } from '../../security/message-crypto.js';
import type { Migration } from './migration.types.js';

type PlaintextConversationMessageRow = RowDataPacket & {
   content: string;
   id: number;
};

const getPlaintextConversationMessages = async (
   pool: Parameters<Migration['up']>[0]
) => {
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

export const backfillMessageEncryptionMigration: Migration = {
   name: '002_backfill_message_encryption',
   async up(pool) {
      const rows = await getPlaintextConversationMessages(pool);

      for (const row of rows) {
         const encrypted = encryptMessageContent(row.content);

         await pool.query(
            `
               UPDATE conversation_messages
               SET content = ?, content_iv = ?, content_auth_tag = ?
               WHERE id = ?
            `,
            [
               encrypted.content,
               encrypted.contentIv,
               encrypted.contentAuthTag,
               row.id,
            ]
         );
      }
   },
};

import type { RowDataPacket } from 'mysql2';

import { encryptMessageContent } from '../security/message-crypto';
import { pool } from './pool';

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

export const backfillEncryptedMessages = async () => {
   const rows = await getPlaintextConversationMessages();

   for (const row of rows) {
      await encryptStoredConversationMessage(row);
   }
};

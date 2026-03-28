import type { RowDataPacket } from 'mysql2';

import { database } from '../db/mysql';

type ConversationSessionRow = RowDataPacket & {
   last_response_id: string;
};

export type StoredMessage = {
   content: string;
   createdAt: string;
   id: number;
   openAiResponseId: string | null;
   role: 'user' | 'bot';
};

type ConversationMessageRow = RowDataPacket & {
   content: string;
   created_at: string;
   id: number;
   openai_response_id: string | null;
   role: 'user' | 'bot';
};

export const conversationRepository = {
   async getLastResponseId(conversationId: string) {
      const rows = await database.query<ConversationSessionRow[]>(
         `
            SELECT last_response_id
            FROM conversation_sessions
            WHERE conversation_id = ?
            LIMIT 1
         `,
         [conversationId]
      );

      return rows[0]?.last_response_id;
   },

   async setLastResponseId(conversationId: string, responseId: string) {
      await database.query(
         `
            INSERT INTO conversation_sessions (conversation_id, last_response_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE
               last_response_id = VALUES(last_response_id),
               updated_at = CURRENT_TIMESTAMP
         `,
         [conversationId, responseId]
      );
   },

   async addMessage(
      conversationId: string,
      role: 'user' | 'bot',
      content: string,
      openAiResponseId?: string
   ) {
      await database.query(
         `
            INSERT INTO conversation_messages (
               conversation_id,
               role,
               content,
               openai_response_id
            )
            VALUES (?, ?, ?, ?)
         `,
         [conversationId, role, content, openAiResponseId ?? null]
      );
   },

   async getMessages(conversationId: string): Promise<StoredMessage[]> {
      const rows = await database.query<ConversationMessageRow[]>(
         `
            SELECT id, role, content, openai_response_id, created_at
            FROM conversation_messages
            WHERE conversation_id = ?
            ORDER BY created_at ASC, id ASC
         `,
         [conversationId]
      );

      return rows.map((row) => ({
         id: row.id,
         role: row.role,
         content: row.content,
         openAiResponseId: row.openai_response_id,
         createdAt: row.created_at,
      }));
   },
};

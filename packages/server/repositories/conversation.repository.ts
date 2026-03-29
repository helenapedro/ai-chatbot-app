import type { RowDataPacket } from 'mysql2';

import { database } from '../db/mysql';
import {
   decryptMessageContent,
   encryptMessageContent,
} from '../security/message-crypto';

type ConversationSessionRow = RowDataPacket & {
   last_response_id: string;
};

export type StoredMessage = {
   content: string;
   createdAt: string;
   id: number;
   inputTokens: number | null;
   modelName: string | null;
   openAiResponseId: string | null;
   outputTokens: number | null;
   role: 'user' | 'bot';
   totalTokens: number | null;
};

type ConversationMessageRow = RowDataPacket & {
   content: string;
   content_auth_tag: string | null;
   content_iv: string | null;
   created_at: string;
   id: number;
   input_tokens: number | null;
   model_name: string | null;
   openai_response_id: string | null;
   output_tokens: number | null;
   role: 'user' | 'bot';
   total_tokens: number | null;
};

type AddMessageMetadata = {
   inputTokens?: number;
   modelName?: string;
   openAiResponseId?: string;
   outputTokens?: number;
   totalTokens?: number;
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
      metadata: AddMessageMetadata = {}
   ) {
      const encrypted = encryptMessageContent(content);

      await database.query(
         `
            INSERT INTO conversation_messages (
               conversation_id,
               role,
               content,
               content_iv,
               content_auth_tag,
               openai_response_id,
               model_name,
               input_tokens,
               output_tokens,
               total_tokens
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         `,
         [
            conversationId,
            role,
            encrypted.content,
            encrypted.contentIv,
            encrypted.contentAuthTag,
            metadata.openAiResponseId ?? null,
            metadata.modelName ?? null,
            metadata.inputTokens ?? null,
            metadata.outputTokens ?? null,
            metadata.totalTokens ?? null,
         ]
      );
   },

   async getMessages(conversationId: string): Promise<StoredMessage[]> {
      const rows = await database.query<ConversationMessageRow[]>(
         `
            SELECT
               id,
               role,
               content,
               content_iv,
               content_auth_tag,
               openai_response_id,
               model_name,
               input_tokens,
               output_tokens,
               total_tokens,
               created_at
            FROM conversation_messages
            WHERE conversation_id = ?
            ORDER BY created_at ASC, id ASC
         `,
         [conversationId]
      );

      return rows.map((row) => ({
         id: row.id,
         role: row.role,
         content: decryptMessageContent(
            row.content,
            row.content_iv,
            row.content_auth_tag
         ),
         openAiResponseId: row.openai_response_id,
         modelName: row.model_name,
         inputTokens: row.input_tokens,
         outputTokens: row.output_tokens,
         totalTokens: row.total_tokens,
         createdAt: row.created_at,
      }));
   },
};

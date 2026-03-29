import type { RowDataPacket } from 'mysql2';

import { database } from '../../db/mysql';
import {
   decryptMessageContent,
   encryptMessageContent,
} from '../../security/message-crypto';
import type { AddMessageMetadata, StoredMessage } from './conversation.types';

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

export const conversationMessageRepository = {
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

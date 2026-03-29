import { afterEach, beforeAll, describe, expect, it } from 'bun:test';
import { randomUUID } from 'crypto';
import type { RowDataPacket } from 'mysql2';

import { database, initializeDatabase } from '../../db/mysql';
import { runMigrations } from '../../db/migrate';
import { conversationMessageRepository } from './conversation-message.repository';
import { conversationSessionRepository } from './conversation-session.repository';

type RawConversationMessageRow = RowDataPacket & {
   content: string;
   content_auth_tag: string | null;
   content_iv: string | null;
   conversation_id: string;
   input_tokens: number | null;
   model_name: string | null;
   openai_response_id: string | null;
   output_tokens: number | null;
   role: 'user' | 'bot';
   total_tokens: number | null;
};

const createdConversationIds = new Set<string>();

const trackConversation = (conversationId: string) => {
   createdConversationIds.add(conversationId);
   return conversationId;
};

const cleanupConversation = async (conversationId: string) => {
   await database.query(
      'DELETE FROM conversation_messages WHERE conversation_id = ?',
      [conversationId]
   );
   await database.query(
      'DELETE FROM conversation_sessions WHERE conversation_id = ?',
      [conversationId]
   );
};

beforeAll(async () => {
   await runMigrations();
   await initializeDatabase();
});

afterEach(async () => {
   for (const conversationId of createdConversationIds) {
      await cleanupConversation(conversationId);
   }

   createdConversationIds.clear();
});

describe('conversation repositories integration', () => {
   it('persists and retrieves session state from MySQL', async () => {
      const conversationId = trackConversation(randomUUID());

      await conversationSessionRepository.setLastResponseId(
         conversationId,
         'resp_test_1'
      );

      const storedResponseId =
         await conversationSessionRepository.getLastResponseId(conversationId);

      expect(storedResponseId).toBe('resp_test_1');
   });

   it('stores encrypted message rows and returns decrypted history', async () => {
      const conversationId = trackConversation(randomUUID());

      await conversationMessageRepository.addMessage(
         conversationId,
         'user',
         'como posso comecar?',
         {
            openAiResponseId: 'resp_test_2',
            modelName: 'gpt-4o-mini',
            inputTokens: 12,
            outputTokens: 24,
            totalTokens: 36,
         }
      );

      const rawRows = await database.query<RawConversationMessageRow[]>(
         `
            SELECT
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
            FROM conversation_messages
            WHERE conversation_id = ?
         `,
         [conversationId]
      );

      expect(rawRows).toHaveLength(1);
      expect(rawRows[0]?.content).not.toBe('como posso comecar?');
      expect(rawRows[0]?.content_iv).toBeString();
      expect(rawRows[0]?.content_auth_tag).toBeString();

      const messages =
         await conversationMessageRepository.getMessages(conversationId);

      expect(messages).toHaveLength(1);
      const firstMessage = messages[0];

      expect(firstMessage).toBeDefined();
      expect(firstMessage).toEqual({
         id: firstMessage!.id,
         role: 'user',
         content: 'como posso comecar?',
         openAiResponseId: 'resp_test_2',
         modelName: 'gpt-4o-mini',
         inputTokens: 12,
         outputTokens: 24,
         totalTokens: 36,
         createdAt: firstMessage!.createdAt,
      });
   });
});

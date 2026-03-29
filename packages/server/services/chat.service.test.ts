import { afterEach, describe, expect, it, mock } from 'bun:test';

import { conversationRepository } from '../repositories/conversation.repository';
import { openAiChatService } from './openai-chat.service';
import { chatService } from './chat.service';

afterEach(() => {
   mock.restore();
});

describe('chatService.sendMessage', () => {
   it('stores user and bot messages and updates conversation state', async () => {
      const originalAddMessage = conversationRepository.addMessage;
      const originalGetLastResponseId =
         conversationRepository.getLastResponseId;
      const originalSetLastResponseId =
         conversationRepository.setLastResponseId;
      const originalCreateResponse = openAiChatService.createResponse;

      const addMessageMock = mock(async () => undefined);
      const getLastResponseIdMock = mock(async () => 'resp_prev');
      const setLastResponseIdMock = mock(async () => undefined);
      const createResponseMock = mock(async () => ({
         id: 'resp_new',
         model: 'gpt-4o-mini',
         output_text: 'general answer',
         usage: {
            input_tokens: 10,
            input_tokens_details: {
               cached_tokens: 0,
            },
            output_tokens: 20,
            output_tokens_details: {
               reasoning_tokens: 0,
            },
            total_tokens: 30,
         },
      }));

      conversationRepository.addMessage = addMessageMock;
      conversationRepository.getLastResponseId = getLastResponseIdMock;
      conversationRepository.setLastResponseId = setLastResponseIdMock;
      openAiChatService.createResponse =
         createResponseMock as unknown as typeof openAiChatService.createResponse;

      const response = await chatService.sendMessage(
         'how does it work?',
         '550e8400-e29b-41d4-a716-446655440000'
      );

      expect(addMessageMock).toHaveBeenNthCalledWith(
         1,
         '550e8400-e29b-41d4-a716-446655440000',
         'user',
         'how does it work?'
      );
      expect(createResponseMock).toHaveBeenCalledWith(
         'how does it work?',
         'resp_prev'
      );
      expect(setLastResponseIdMock).toHaveBeenCalledWith(
         '550e8400-e29b-41d4-a716-446655440000',
         'resp_new'
      );
      expect(addMessageMock).toHaveBeenNthCalledWith(
         2,
         '550e8400-e29b-41d4-a716-446655440000',
         'bot',
         'general answer',
         {
            openAiResponseId: 'resp_new',
            modelName: 'gpt-4o-mini',
            inputTokens: 10,
            outputTokens: 20,
            totalTokens: 30,
         }
      );
      expect(response).toEqual({
         id: 'resp_new',
         message: 'general answer',
      });

      conversationRepository.addMessage = originalAddMessage;
      conversationRepository.getLastResponseId = originalGetLastResponseId;
      conversationRepository.setLastResponseId = originalSetLastResponseId;
      openAiChatService.createResponse = originalCreateResponse;
   });
});

describe('chatService.deleteConversation', () => {
   it('delegates conversation deletion to the repository', async () => {
      const originalDeleteConversation =
         conversationRepository.deleteConversation;
      const deleteConversationMock = mock(async () => true);
      conversationRepository.deleteConversation = deleteConversationMock;

      const result = await chatService.deleteConversation(
         '550e8400-e29b-41d4-a716-446655440000'
      );

      expect(deleteConversationMock).toHaveBeenCalledWith(
         '550e8400-e29b-41d4-a716-446655440000'
      );
      expect(result).toBe(true);

      conversationRepository.deleteConversation = originalDeleteConversation;
   });
});

describe('chatService.cleanupExpiredConversations', () => {
   it('delegates retention cleanup to the repository', async () => {
      const originalCleanupExpiredConversations =
         conversationRepository.cleanupExpiredConversations;
      const cleanupExpiredConversationsMock = mock(async () => ({
         cutoffDate: '2026-01-01T00:00:00.000Z',
         deletedExpiredMessageCount: 2,
         deletedOrphanedMessageCount: 1,
         deletedSessionCount: 1,
      }));
      conversationRepository.cleanupExpiredConversations =
         cleanupExpiredConversationsMock;

      const result = await chatService.cleanupExpiredConversations(90);

      expect(cleanupExpiredConversationsMock).toHaveBeenCalledWith(90);
      expect(result).toEqual({
         cutoffDate: '2026-01-01T00:00:00.000Z',
         deletedExpiredMessageCount: 2,
         deletedOrphanedMessageCount: 1,
         deletedSessionCount: 1,
      });

      conversationRepository.cleanupExpiredConversations =
         originalCleanupExpiredConversations;
   });
});

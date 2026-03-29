import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import type { Server } from 'http';

import { createApp } from '../app';
import { chatService } from '../services/chat.service';

const TEST_CONVERSATION_ID = '550e8400-e29b-41d4-a716-446655440000';

let server: Server;
let baseUrl: string;

const startTestServer = async () =>
   new Promise<Server>((resolve) => {
      const app = createApp();
      const startedServer = app.listen(0, () => resolve(startedServer));
   });

beforeEach(async () => {
   server = await startTestServer();
   const address = server.address();

   if (!address || typeof address === 'string') {
      throw new Error('Failed to resolve test server address.');
   }

   baseUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
   mock.restore();

   await new Promise<void>((resolve, reject) => {
      server.close((error) => {
         if (error) {
            reject(error);
            return;
         }

         resolve();
      });
   });
});

describe('chat controller integration', () => {
   it('returns 400 for invalid chat payloads through Express', async () => {
      const response = await fetch(`${baseUrl}/api/chat`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({
            prompt: '   ',
            conversationId: 'bad-id',
         }),
      });

      const body = (await response.json()) as {
         error: string;
      };

      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid chat request.');
      expect(response.headers.get('x-request-id')).toBeString();
   });

   it('returns the chat response for valid requests through Express', async () => {
      const originalSendMessage = chatService.sendMessage;
      const sendMessageMock = mock(async () => ({
         id: 'resp_controller_test',
         message: 'resposta geral',
      }));
      chatService.sendMessage = sendMessageMock;

      const response = await fetch(`${baseUrl}/api/chat`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            Origin: 'http://localhost:5173',
         },
         body: JSON.stringify({
            prompt: 'como funciona?',
            conversationId: TEST_CONVERSATION_ID,
         }),
      });

      const body = (await response.json()) as {
         message: string;
      };

      expect(response.status).toBe(200);
      expect(body).toEqual({ message: 'resposta geral' });
      expect(response.headers.get('access-control-allow-origin')).toBe(
         'http://localhost:5173'
      );
      expect(sendMessageMock).toHaveBeenCalledWith(
         'como funciona?',
         TEST_CONVERSATION_ID
      );

      chatService.sendMessage = originalSendMessage;
   });

   it('returns history through the Express route', async () => {
      const originalGetMessageHistory = chatService.getMessageHistory;
      const getMessageHistoryMock = mock(async () => [
         {
            id: 1,
            role: 'user' as const,
            content: 'ola',
            openAiResponseId: null,
            modelName: null,
            inputTokens: null,
            outputTokens: null,
            totalTokens: null,
            createdAt: '2026-03-29T00:00:00.000Z',
         },
      ]);
      chatService.getMessageHistory = getMessageHistoryMock;

      const response = await fetch(
         `${baseUrl}/api/conversations/${TEST_CONVERSATION_ID}/messages`
      );
      const body = (await response.json()) as {
         messages: Array<{ content: string }>;
      };

      expect(response.status).toBe(200);
      expect(body.messages).toHaveLength(1);
      expect(body.messages[0]?.content).toBe('ola');
      expect(getMessageHistoryMock).toHaveBeenCalledWith(TEST_CONVERSATION_ID);

      chatService.getMessageHistory = originalGetMessageHistory;
   });

   it('deletes a conversation through the Express route', async () => {
      const originalDeleteConversation = chatService.deleteConversation;
      const deleteConversationMock = mock(async () => true);
      chatService.deleteConversation = deleteConversationMock;

      const response = await fetch(
         `${baseUrl}/api/conversations/${TEST_CONVERSATION_ID}`,
         {
            method: 'DELETE',
         }
      );

      expect(response.status).toBe(204);
      expect(deleteConversationMock).toHaveBeenCalledWith(TEST_CONVERSATION_ID);

      chatService.deleteConversation = originalDeleteConversation;
   });

   it('rejects disallowed origins before controller execution', async () => {
      const response = await fetch(`${baseUrl}/api/chat`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            Origin: 'https://malicious.example',
         },
         body: JSON.stringify({
            prompt: 'como funciona?',
            conversationId: TEST_CONVERSATION_ID,
         }),
      });

      const body = (await response.json()) as {
         error: string;
      };

      expect(response.status).toBe(403);
      expect(body.error).toBe('Origin not allowed.');
   });
});

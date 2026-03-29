import { afterEach, describe, expect, it, mock } from 'bun:test';
import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/app-error';
import { chatService } from '../services/chat.service';
import { chatController } from './chat.controller';

const createResponse = () => {
   const res = {
      json: mock(() => res),
      send: mock(() => res),
      status: mock(() => res),
   } as unknown as Response;

   return res;
};

afterEach(() => {
   mock.restore();
});

describe('chatController.sendMessage', () => {
   it('returns a validation error for invalid payloads', async () => {
      const req = {
         body: { prompt: '   ', conversationId: 'bad-id' },
      } as Request;
      const res = createResponse();
      const next = mock(() => undefined);

      await chatController.sendMessage(
         req,
         res,
         next as unknown as NextFunction
      );

      expect(next).toHaveBeenCalledTimes(1);
      const calls = (next as unknown as { mock: { calls: unknown[][] } }).mock
         .calls;
      const error = calls[0]?.[0];
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).statusCode).toBe(400);
   });

   it('returns the chat service response for valid payloads', async () => {
      const req = {
         body: {
            prompt: 'hello',
            conversationId: '550e8400-e29b-41d4-a716-446655440000',
         },
      } as Request;
      const res = createResponse();
      const next = mock(() => undefined);
      const originalSendMessage = chatService.sendMessage;
      const sendMessageMock = mock(async () => ({
         id: 'resp_1',
         message: 'hi there',
      }));
      chatService.sendMessage = sendMessageMock;

      await chatController.sendMessage(
         req,
         res,
         next as unknown as NextFunction
      );

      expect(sendMessageMock).toHaveBeenCalledWith(
         'hello',
         '550e8400-e29b-41d4-a716-446655440000'
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'hi there' });
      expect(next).not.toHaveBeenCalled();
      expect(sendMessageMock).toHaveBeenCalledTimes(1);

      chatService.sendMessage = originalSendMessage;
   });
});

describe('chatController.deleteConversation', () => {
   it('returns 204 for a valid conversation id', async () => {
      const req = {
         params: {
            conversationId: '550e8400-e29b-41d4-a716-446655440000',
         },
      } as unknown as Request;
      const res = createResponse();
      const next = mock(() => undefined);
      const originalDeleteConversation = chatService.deleteConversation;
      const deleteConversationMock = mock(async () => true);
      chatService.deleteConversation = deleteConversationMock;

      await chatController.deleteConversation(
         req,
         res,
         next as unknown as NextFunction
      );

      expect(deleteConversationMock).toHaveBeenCalledWith(
         '550e8400-e29b-41d4-a716-446655440000'
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();

      chatService.deleteConversation = originalDeleteConversation;
   });
});

import type { NextFunction, Request, Response } from 'express';
import z from 'zod';

import { AppError } from '../errors/app-error.js';
import { chatService } from '../services/chat.service.js';

const chatSchema = z.object({
   prompt: z
      .string()
      .trim()
      .min(1, 'Prompt is required.')
      .max(1000, 'Prompt is too long (max 1000 characters)'),
   conversationId: z.uuid(),
});

const conversationParamsSchema = z.object({
   conversationId: z.uuid(),
});

export const chatController = {
   async sendMessage(req: Request, res: Response, next: NextFunction) {
      const parseResult = chatSchema.safeParse(req.body);

      if (!parseResult.success) {
         next(
            new AppError(
               'Invalid chat request.',
               400,
               parseResult.error.flatten()
            )
         );
         return;
      }

      try {
         const { prompt, conversationId } = parseResult.data;
         const response = await chatService.sendMessage(prompt, conversationId);

         res.json({ message: response.message });
      } catch (error) {
         next(error);
      }
   },

   async getMessageHistory(req: Request, res: Response, next: NextFunction) {
      const parseResult = conversationParamsSchema.safeParse(req.params);

      if (!parseResult.success) {
         next(
            new AppError(
               'Invalid conversation id.',
               400,
               parseResult.error.flatten()
            )
         );
         return;
      }

      try {
         const messages = await chatService.getMessageHistory(
            parseResult.data.conversationId
         );

         res.json({ messages });
      } catch (error) {
         next(error);
      }
   },
};

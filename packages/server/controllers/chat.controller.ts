import type { NextFunction, Request, Response } from 'express';
import z from 'zod';

import { chatService } from '../services/chat.service';
import { AppError } from '../errors/app-error';

const chatSchema = z.object({
   prompt: z
      .string()
      .trim()
      .min(1, 'Prompt is required.')
      .max(1000, 'Prompt is too long (max 1000 characters)'),
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
};

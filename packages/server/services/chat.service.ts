import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

import { env } from '../config/env';
import { AppError } from '../errors/app-error';
import {
   conversationRepository,
   type StoredMessage,
} from '../repositories/conversation.repository';
import template from '../prompts/chatbot.txt';

const client = new OpenAI({
   apiKey: env.OPEN_API_KEY,
});

const projectInfo = fs.readFileSync(
   path.join(__dirname, '..', 'prompts', 'helenaexplora.md'),
   'utf-8'
);
const instructions = template.replace('{{projectInfo}}', projectInfo);

type ChatResponse = {
   id: string;
   message: string;
};

const OPENAI_TIMEOUT_MS = 20_000;

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number) => {
   let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

   try {
      return await Promise.race([
         promise,
         new Promise<T>((_, reject) => {
            timeoutHandle = setTimeout(() => {
               reject(
                  new AppError(
                     'The AI service took too long to respond. Please try again.',
                     504
                  )
               );
            }, timeoutMs);
         }),
      ]);
   } finally {
      if (timeoutHandle) {
         clearTimeout(timeoutHandle);
      }
   }
};

export const chatService = {
   async sendMessage(
      prompt: string,
      conversationId: string
   ): Promise<ChatResponse> {
      try {
         await conversationRepository.addMessage(
            conversationId,
            'user',
            prompt
         );

         const previousResponseId =
            await conversationRepository.getLastResponseId(conversationId);

         const response = await withTimeout(
            client.responses.create({
               model: 'gpt-4o-mini',
               instructions,
               input: prompt,
               temperature: 0.2,
               max_output_tokens: 200,
               previous_response_id: previousResponseId,
            }),
            OPENAI_TIMEOUT_MS
         );

         await conversationRepository.setLastResponseId(
            conversationId,
            response.id
         );
         await conversationRepository.addMessage(
            conversationId,
            'bot',
            response.output_text,
            {
               openAiResponseId: response.id,
               modelName: String(response.model),
               inputTokens: response.usage?.input_tokens,
               outputTokens: response.usage?.output_tokens,
               totalTokens: response.usage?.total_tokens,
            }
         );

         return {
            id: response.id,
            message: response.output_text,
         };
      } catch (error) {
         if (error instanceof AppError) {
            throw error;
         }

         const statusCode =
            typeof error === 'object' &&
            error !== null &&
            'status' in error &&
            typeof error.status === 'number'
               ? error.status
               : 502;

         throw new AppError(
            'Failed to generate a response from the AI service.',
            statusCode
         );
      }
   },

   async getMessageHistory(conversationId: string): Promise<StoredMessage[]> {
      return conversationRepository.getMessages(conversationId);
   },
};

import OpenAI from 'openai';

import { env } from '../config/env';
import { AppError } from '../errors/app-error';
import { promptService } from './prompt.service';

const client = new OpenAI({
   apiKey: env.OPEN_API_KEY,
});

const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_TEMPERATURE = 0.2;
const OPENAI_MAX_OUTPUT_TOKENS = 200;
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

const createOpenAiServiceError = (error: unknown) => {
   if (error instanceof AppError) {
      return error;
   }

   const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof error.status === 'number'
         ? error.status
         : 502;

   return new AppError(
      'Failed to generate a response from the AI service.',
      statusCode
   );
};

export const openAiChatService = {
   async createResponse(prompt: string, previousResponseId?: string) {
      try {
         return await withTimeout(
            client.responses.create({
               model: OPENAI_MODEL,
               instructions: promptService.getInstructions(),
               input: prompt,
               temperature: OPENAI_TEMPERATURE,
               max_output_tokens: OPENAI_MAX_OUTPUT_TOKENS,
               previous_response_id: previousResponseId,
            }),
            OPENAI_TIMEOUT_MS
         );
      } catch (error) {
         throw createOpenAiServiceError(error);
      }
   },
};

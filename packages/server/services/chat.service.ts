import {
   conversationRepository,
   type ConversationRetentionCleanupResult,
   type StoredMessage,
} from '../repositories/conversation.repository.js';
import { openAiChatService } from './openai-chat.service.js';

type ChatResponse = {
   id: string;
   message: string;
};

export const chatService = {
   async sendMessage(
      prompt: string,
      conversationId: string
   ): Promise<ChatResponse> {
      await conversationRepository.addMessage(conversationId, 'user', prompt);

      const previousResponseId =
         await conversationRepository.getLastResponseId(conversationId);

      const response = await openAiChatService.createResponse(
         prompt,
         previousResponseId
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
   },

   async getMessageHistory(conversationId: string): Promise<StoredMessage[]> {
      return conversationRepository.getMessages(conversationId);
   },

   async deleteConversation(conversationId: string) {
      return conversationRepository.deleteConversation(conversationId);
   },

   async cleanupExpiredConversations(
      retentionDays: number
   ): Promise<ConversationRetentionCleanupResult> {
      return conversationRepository.cleanupExpiredConversations(retentionDays);
   },
};

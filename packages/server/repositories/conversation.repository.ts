import { conversationMessageRepository } from './conversation/conversation-message.repository.js';
import { conversationSessionRepository } from './conversation/conversation-session.repository.js';
import { pool } from '../db/pool.js';

export type {
   AddMessageMetadata,
   StoredMessage,
} from './conversation/conversation.types.js';
export type { ConversationRetentionCleanupResult } from './conversation/conversation.types.js';

export const conversationRepository = {
   getLastResponseId: conversationSessionRepository.getLastResponseId,
   setLastResponseId: conversationSessionRepository.setLastResponseId,
   addMessage: conversationMessageRepository.addMessage,
   getMessages: conversationMessageRepository.getMessages,
   async deleteConversation(conversationId: string) {
      const connection = await pool.getConnection();

      try {
         await connection.beginTransaction();

         const deletedMessageCount =
            await conversationMessageRepository.deleteByConversationId(
               connection,
               conversationId
            );
         const deletedSessionCount =
            await conversationSessionRepository.deleteByConversationId(
               connection,
               conversationId
            );

         await connection.commit();

         return deletedMessageCount > 0 || deletedSessionCount > 0;
      } catch (error) {
         await connection.rollback();
         throw error;
      } finally {
         connection.release();
      }
   },
   async cleanupExpiredConversations(retentionDays: number) {
      const connection = await pool.getConnection();
      const cutoffDate = new Date(
         Date.now() - retentionDays * 24 * 60 * 60 * 1000
      );

      try {
         await connection.beginTransaction();

         const deletedExpiredMessageCount =
            await conversationMessageRepository.deleteExpiredConversationMessages(
               connection,
               cutoffDate
            );
         const deletedOrphanedMessageCount =
            await conversationMessageRepository.deleteExpiredOrphanedMessages(
               connection,
               cutoffDate
            );
         const deletedSessionCount =
            await conversationSessionRepository.deleteExpiredSessions(
               connection,
               cutoffDate
            );

         await connection.commit();

         return {
            cutoffDate: cutoffDate.toISOString(),
            deletedExpiredMessageCount,
            deletedOrphanedMessageCount,
            deletedSessionCount,
         };
      } catch (error) {
         await connection.rollback();
         throw error;
      } finally {
         connection.release();
      }
   },
};

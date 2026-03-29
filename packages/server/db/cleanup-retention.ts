import { env } from '../config/env.js';
import { initializeDatabase } from './mysql.js';
import { logger } from '../lib/logger.js';
import { chatService } from '../services/chat.service.js';

const runRetentionCleanup = async () => {
   await initializeDatabase();

   const result = await chatService.cleanupExpiredConversations(
      env.RETENTION_DAYS
   );

   logger.info('Conversation retention cleanup completed', {
      retentionDays: env.RETENTION_DAYS,
      ...result,
   });
};

if (import.meta.main) {
   void runRetentionCleanup()
      .then(() => {
         process.exit(0);
      })
      .catch((error) => {
         logger.error('Conversation retention cleanup failed', {
            error: error instanceof Error ? error.message : String(error),
         });
         process.exit(1);
      });
}

import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';

import { database } from '../../db/mysql.js';

type ConversationSessionRow = RowDataPacket & {
   last_response_id: string;
};

export const conversationSessionRepository = {
   async getLastResponseId(conversationId: string) {
      const rows = await database.query<ConversationSessionRow[]>(
         `
            SELECT last_response_id
            FROM conversation_sessions
            WHERE conversation_id = ?
            LIMIT 1
         `,
         [conversationId]
      );

      return rows[0]?.last_response_id;
   },

   async setLastResponseId(conversationId: string, responseId: string) {
      await database.query(
         `
            INSERT INTO conversation_sessions (conversation_id, last_response_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE
               last_response_id = VALUES(last_response_id),
               updated_at = CURRENT_TIMESTAMP
         `,
         [conversationId, responseId]
      );
   },

   async deleteByConversationId(
      connection: PoolConnection,
      conversationId: string
   ) {
      const [result] = await connection.query<ResultSetHeader>(
         `
            DELETE FROM conversation_sessions
            WHERE conversation_id = ?
         `,
         [conversationId]
      );

      return result.affectedRows;
   },

   async deleteExpiredSessions(connection: PoolConnection, cutoffDate: Date) {
      const [result] = await connection.query<ResultSetHeader>(
         `
            DELETE FROM conversation_sessions
            WHERE updated_at < ?
         `,
         [cutoffDate]
      );

      return result.affectedRows;
   },
};

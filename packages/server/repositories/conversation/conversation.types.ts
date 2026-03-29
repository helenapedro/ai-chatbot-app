export type StoredMessage = {
   content: string;
   createdAt: string;
   id: number;
   inputTokens: number | null;
   modelName: string | null;
   openAiResponseId: string | null;
   outputTokens: number | null;
   role: 'user' | 'bot';
   totalTokens: number | null;
};

export type AddMessageMetadata = {
   inputTokens?: number;
   modelName?: string;
   openAiResponseId?: string;
   outputTokens?: number;
   totalTokens?: number;
};

export type ConversationRetentionCleanupResult = {
   cutoffDate: string;
   deletedExpiredMessageCount: number;
   deletedOrphanedMessageCount: number;
   deletedSessionCount: number;
};

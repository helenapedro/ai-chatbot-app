export type ChatFormData = {
   message: string;
};

export type ChatResponse = {
   message: string;
};

export type Message = {
   content: string;
   role: 'user' | 'bot';
};

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

export type MessageHistoryResponse = {
   messages: StoredMessage[];
};

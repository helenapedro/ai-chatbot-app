// TODO modify repository and store the data in a database
const conversations = new Map<string, string>();

export const conversationRepository = {
     getLastResponseId(conversationId: string) {
          return conversations.get(conversationId)
     },

     setLastResponseId(conversationId: string, responseId: string) {
          conversations.set(conversationId, responseId);
     },
};

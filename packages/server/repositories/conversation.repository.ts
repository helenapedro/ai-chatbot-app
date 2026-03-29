import { conversationMessageRepository } from './conversation/conversation-message.repository.js';
import { conversationSessionRepository } from './conversation/conversation-session.repository.js';

export type {
   AddMessageMetadata,
   StoredMessage,
} from './conversation/conversation.types.js';

export const conversationRepository = {
   getLastResponseId: conversationSessionRepository.getLastResponseId,
   setLastResponseId: conversationSessionRepository.setLastResponseId,
   addMessage: conversationMessageRepository.addMessage,
   getMessages: conversationMessageRepository.getMessages,
};

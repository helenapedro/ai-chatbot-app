import { conversationMessageRepository } from './conversation/conversation-message.repository';
import { conversationSessionRepository } from './conversation/conversation-session.repository';

export type {
   AddMessageMetadata,
   StoredMessage,
} from './conversation/conversation.types';

export const conversationRepository = {
   getLastResponseId: conversationSessionRepository.getLastResponseId,
   setLastResponseId: conversationSessionRepository.setLastResponseId,
   addMessage: conversationMessageRepository.addMessage,
   getMessages: conversationMessageRepository.getMessages,
};

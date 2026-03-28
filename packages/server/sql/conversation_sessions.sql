CREATE TABLE IF NOT EXISTS conversation_sessions (
   conversation_id CHAR(36) NOT NULL PRIMARY KEY,
   last_response_id VARCHAR(255) NOT NULL,
   updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversation_messages (
   id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
   conversation_id CHAR(36) NOT NULL,
   role VARCHAR(16) NOT NULL,
   content TEXT NOT NULL,
   openai_response_id VARCHAR(255) NULL,
   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   INDEX idx_conversation_messages_conversation_id_created_at (conversation_id, created_at, id),
   CONSTRAINT chk_conversation_messages_role
      CHECK (role IN ('user', 'bot'))
);


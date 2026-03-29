# Server

Express API for the chat app. The server exposes a small REST surface and uses the OpenAI Responses API to continue a conversation based on the last response ID stored for each `conversationId`.

## Requirements

- Bun
- An OpenAI API key
- A MySQL-compatible database

## Setup

Install dependencies from the repo root:

```bash
bun install
```

Create a local env file in `packages/server/.env`:

```env
OPEN_API_KEY=your_openai_api_key
HELENA_EXPLORA_SITE_URL=https://helenaexplora.hmpedro.com/
CLIENT_ORIGIN=http://localhost:8080/,https://helenaexplora.hmpedro.com/
PORT=3000
CHATBOT_ENCRYPTION_KEY=your_64_character_hex_key
CHATBOT_DB_HOST=127.0.0.1
CHATBOT_DB_PORT=3306
CHATBOT_DB_NAME=your_database_name
CHATBOT_DB_USER=your_database_user
CHATBOT_DB_PASSWORD=your_database_password
```

The server also supports optional settings:

```env
JSON_BODY_LIMIT=16kb
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
TRUST_PROXY=false
CHATBOT_DB_CONNECTION_LIMIT=10
```

The code currently reads `OPEN_API_KEY`, `HELENA_EXPLORA_SITE_URL`, `CHATBOT_ENCRYPTION_KEY`, `CHATBOT_DB_HOST`, `CHATBOT_DB_PORT`, `CHATBOT_DB_NAME`, `CHATBOT_DB_USER`, and `CHATBOT_DB_PASSWORD`, so use those exact variable names.

## Run

Start in watch mode:

```bash
bun run dev
```

Start normally:

```bash
bun run start
```

The server listens on `http://localhost:3000` by default.

## Database

On startup, the server creates the `conversation_sessions` table automatically if it does not already exist.

If you want to create it manually in phpMyAdmin, run the SQL from `packages/server/sql/conversation_sessions.sql`.

Stored message `content` is encrypted at the application layer with AES-256-GCM before it is written to MySQL.

## API

### `GET /`

Returns a plain text health-style response.

### `GET /api/hello`

Returns:

```json
{ "message": "Hi Helena!" }
```

### `POST /api/chat`

Sends a user prompt to OpenAI and continues the conversation using the last response ID associated with the provided `conversationId`.

Request body:

```json
{
   "prompt": "Write a short welcome message",
   "conversationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Validation rules:

- `prompt` is required, trimmed, and must be between 1 and 1000 characters
- `conversationId` is required and must be a valid UUID

Successful response:

```json
{
   "message": "Welcome! ..."
}
```

Error responses:

- `400` for invalid request payloads
- `500` if the server cannot generate a response

### `GET /api/conversations/:conversationId/messages`

Returns the stored message history for a conversation.

Successful response:

```json
{
   "messages": [
      {
         "id": 1,
         "role": "user",
         "content": "Hello",
         "openAiResponseId": null,
         "modelName": null,
         "inputTokens": null,
         "outputTokens": null,
         "totalTokens": null,
         "createdAt": "2026-03-28T21:25:28.000Z"
      },
      {
         "id": 2,
         "role": "bot",
         "content": "Hi, how can I help?",
         "openAiResponseId": "resp_123",
         "modelName": "gpt-4o-mini",
         "inputTokens": 123,
         "outputTokens": 42,
         "totalTokens": 165,
         "createdAt": "2026-03-28T21:25:29.000Z"
      }
   ]
}
```

## Notes

- Conversation state is stored in MySQL in `conversation_sessions`
- Full message history is stored in MySQL in `conversation_messages`
- Message content is encrypted before storage
- Bot messages store OpenAI model and token usage metadata
- The OpenAI model is currently `gpt-4o-mini`

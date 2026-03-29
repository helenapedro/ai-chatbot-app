# Server

Express API for the chat app. The server exposes a small REST surface and uses the OpenAI Responses API to continue a conversation based on the last response ID stored for each `conversationId`.

## Requirements

- Node.js 24
- An OpenAI API key
- A MySQL-compatible database

## Setup

If you are working inside this monorepo, install dependencies from the repo root:

```bash
npm install
```

If you want to deploy the server as a standalone Node app, use `packages/server` as the app root and install dependencies there:

```bash
npm install
```

Create a local env file from `.env.example`:

```env
OPEN_API_KEY=your_openai_api_key
HELENA_EXPLORA_SITE_URL=https://helenaexplora.hmpedro.com/
CLIENT_ORIGIN=http://localhost:5173,http://localhost:8080,https://helenaexplora.hmpedro.com
PORT=3000
JSON_BODY_LIMIT=16kb
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
TRUST_PROXY=false
CHATBOT_ENCRYPTION_KEY=your_64_character_hex_key
CHATBOT_DB_HOST=127.0.0.1
CHATBOT_DB_PORT=3306
CHATBOT_DB_NAME=your_database_name
CHATBOT_DB_USER=your_database_user
CHATBOT_DB_PASSWORD=your_database_password
CHATBOT_DB_CONNECTION_LIMIT=10
```

The code currently reads `OPEN_API_KEY`, `HELENA_EXPLORA_SITE_URL`, `CHATBOT_ENCRYPTION_KEY`, `CHATBOT_DB_HOST`, `CHATBOT_DB_PORT`, `CHATBOT_DB_NAME`, `CHATBOT_DB_USER`, and `CHATBOT_DB_PASSWORD`, so use those exact variable names.

Run database migrations before starting the server:

```bash
npm run build
npm run migrate
```

## Run

Start in watch mode:

```bash
npm run dev
```

Start normally:

```bash
npm start
```

The server listens on `http://localhost:3000` by default.

## Standalone Deployment

To deploy this package on its own, your deploy root should contain the contents of `packages/server`, not the whole monorepo root.

Required files and directories at deploy time:

- `package.json`
- `Procfile`
- `dist/`
- `prompts/`
- `.env` or equivalent platform-managed env vars

The prompt loader reads `prompts/chatbot.txt` and `prompts/helenaexplora.md` from the package root at runtime, so keep the `prompts/` directory alongside `dist/`.

Typical standalone flow:

```bash
npm install
npm run build
npm run migrate
npm start
```

Heroku-style process types are already defined in `Procfile`:

```Procfile
release: npm run migrate
web: npm start
```

## Database

Database schema changes are handled through explicit migrations.
The server startup now validates database connectivity, but it does not create or alter schema automatically.

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

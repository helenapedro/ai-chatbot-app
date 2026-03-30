# Server

Backend API for the Helena Explora chatbot. This service accepts chat requests, coordinates OpenAI Responses API calls, persists conversation state in MySQL, stores encrypted message history, and exposes the endpoints needed for a frontend to restore and manage chat sessions.

Skills:

- designing and documenting a small but production-oriented REST API
- structuring code by responsibility across controllers, services, repositories, middleware, and database utilities
- validating input and centralizing error handling
- integrating with an external AI service behind a service boundary
- persisting application state in a relational database instead of memory
- handling operational concerns such as health checks, migrations, logging, CORS, rate limiting, and data retention

## What This Service Does

The API is focused on one product use case: answering questions about studying in the United States through the Helena Explora chatbot.

At runtime, the server:

1. receives a user prompt and a `conversationId`
2. loads the project-specific system prompt
3. looks up the previous OpenAI response for that conversation
4. sends the next request to the OpenAI Responses API
5. stores the assistant response and conversation metadata
6. returns the response to the client

The backend also supports restoring chat history and deleting stored conversations.

## Architecture

The server follows a layered structure:

- `controllers/`
  Request validation and HTTP response handling
- `services/`
  Application orchestration and external API coordination
- `repositories/`
  Database persistence for sessions and messages
- `middleware/`
  CORS, rate limiting, request logging, and centralized error handling
- `db/`
  Connection pool, migrations, and retention cleanup runner
- `security/`
  Message encryption helpers
- `prompts/`
  Prompt templates and project-specific AI instructions

This split keeps each layer focused:

- controllers know HTTP
- services know workflow
- repositories know SQL and persistence
- middleware handles cross-cutting concerns

## Key Engineering Decisions

### Persistent conversation state

The first version used in-memory storage. That was replaced with MySQL so conversations survive server restarts and can be restored by the client.

### Encrypted message storage

Stored chat content is encrypted at the application layer with AES-256-GCM before being written to MySQL. The server decrypts content only when it needs to return message history to the client.

### Explicit migrations

Schema changes are handled through versioned migrations instead of startup-time schema mutation. This makes deployment more predictable and is closer to how production systems are operated.

### Structured logging

The service logs request metadata, handled errors, and operational events in structured JSON format. The goal is to make troubleshooting easier without logging plaintext chat content.

### Prompt isolation

Prompt loading is isolated behind a service and backed by template files in `prompts/`. This keeps AI behavior configurable without mixing prompt text into route or controller logic.

## Technology

- Node.js 24
- Express 5
- MySQL
- OpenAI Responses API
- TypeScript
- Zod
- Bun test runner for local tests

## Requirements

- Node.js 24
- A MySQL-compatible database
- An OpenAI API key

## Environment Variables

Create a local `.env` file from `.env.example`.

Required:

- `OPEN_API_KEY`
- `HELENA_EXPLORA_SITE_URL`
- `CHATBOT_ENCRYPTION_KEY`
- `CHATBOT_DB_HOST`
- `CHATBOT_DB_PORT`
- `CHATBOT_DB_NAME`
- `CHATBOT_DB_USER`
- `CHATBOT_DB_PASSWORD`

Optional:

- `CLIENT_ORIGIN`
- `PORT`
- `JSON_BODY_LIMIT`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `RETENTION_DAYS`
- `TRUST_PROXY`
- `CHATBOT_DB_CONNECTION_LIMIT`

Example:

```env
OPEN_API_KEY=your_openai_api_key
HELENA_EXPLORA_SITE_URL=https://helenaexplora.hmpedro.com/
CLIENT_ORIGIN=http://localhost:5173,http://localhost:8080,https://helenaexplora.hmpedro.com
PORT=3000
JSON_BODY_LIMIT=16kb
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
RETENTION_DAYS=90
TRUST_PROXY=false
CHATBOT_ENCRYPTION_KEY=your_64_character_hex_key
CHATBOT_DB_HOST=127.0.0.1
CHATBOT_DB_PORT=3306
CHATBOT_DB_NAME=your_database_name
CHATBOT_DB_USER=your_database_user
CHATBOT_DB_PASSWORD=your_database_password
CHATBOT_DB_CONNECTION_LIMIT=10
```

## Local Development

If you are using the monorepo setup, dependencies are typically installed from the repo root.

Build the server:

```bash
npm run build
```

Run database migrations:

```bash
npm run migrate
```

Start the server:

```bash
npm start
```

The API listens on `http://localhost:3000` by default.

## Standalone Deployment

This package can be deployed independently from the rest of the monorepo. The deployment root should be the contents of `packages/server`, not the repository root.

Expected runtime files:

- `package.json`
- `Procfile`
- `dist/`
- `prompts/`

Typical deployment flow:

```bash
npm install
npm run build
npm run migrate
npm start
```

Heroku-style process types are already defined:

```Procfile
release: npm run migrate
web: npm start
```

## API

### `GET /`

Simple health-style response.

### `GET /healthz`

Basic liveness check.

### `GET /readyz`

Readiness check that verifies database connectivity.

### `POST /api/chat`

Continues a conversation using the provided `conversationId`.

Request:

```json
{
   "prompt": "Write a short welcome message",
   "conversationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Validation rules:

- `prompt` is required, trimmed, and must be between 1 and 1000 characters
- `conversationId` is required and must be a valid UUID

Success response:

```json
{
   "message": "Welcome! ..."
}
```

### `GET /api/conversations/:conversationId/messages`

Returns stored message history for the conversation.

Example response:

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
      }
   ]
}
```

### `DELETE /api/conversations/:conversationId`

Deletes the session row and all stored messages for the given conversation.

Success response:

- `204 No Content`

## Data Model

### `conversation_sessions`

Stores one row per conversation:

- `conversation_id`
- `last_response_id`
- `updated_at`

### `conversation_messages`

Stores the encrypted message history:

- `id`
- `conversation_id`
- `role`
- encrypted `content`
- encryption metadata (`content_iv`, `content_auth_tag`)
- OpenAI response metadata
- token usage metadata
- `created_at`

## Operations

### Migrations

Database schema changes are versioned under `db/migrations/`.

Run them with:

```bash
npm run migrate
```

### Retention cleanup

Expired data cleanup is handled by:

```bash
npm run cleanup:retention
```

This command deletes:

- conversations whose session `updated_at` is older than `RETENTION_DAYS`
- orphaned old messages left behind when a session row was never created

For small traffic, this can be run manually. For higher traffic, it should be scheduled.

## Testing

The server includes unit and integration tests for:

- controller validation
- service orchestration
- repository persistence
- encrypted message storage
- Express route behavior

Examples:

```bash
bun test
bun run test:integration
```

## Production Readiness Features

This backend includes several production-oriented concerns beyond basic request handling:

- environment validation at startup
- centralized error handling
- structured request and error logging
- CORS allowlist support
- rate limiting
- persistent MySQL-backed conversation state
- encrypted message storage
- readiness and health endpoints
- explicit schema migrations
- retention cleanup tooling

## What This Project Demonstrates

From a Software Development I/II perspective, this server shows the ability to:

- build a real API around a practical product requirement
- refactor from a demo architecture to a more production-oriented one
- separate concerns cleanly across modules
- reason about persistence, encryption, and external service boundaries
- improve maintainability with migrations, tests, and documentation
- think about deployment and operations, not only feature code

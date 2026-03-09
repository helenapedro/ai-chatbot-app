# Server

Express API for the chat app. The server exposes a small REST surface and uses the OpenAI Responses API to continue a conversation based on the last response ID stored for each `conversationId`.

## Requirements

- Bun
- An OpenAI API key

## Setup

Install dependencies from the repo root:

```bash
bun install
```

Create a local env file in `packages/server/.env`:

```env
OPEN_API_KEY=your_openai_api_key
PORT=3000
```

The code currently reads `OPEN_API_KEY`, so use that exact variable name.

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

## Notes

- Conversation state is currently stored in memory in `conversation.repository.ts`
- Restarting the server clears all saved conversation history
- The OpenAI model is currently `gpt-4o-mini`

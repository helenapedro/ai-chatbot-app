# Frontend Handoff

## Purpose

This document is for someone who does not have a frontend yet and wants to build one on top of the Helena Explora chat API.

The backend already exists and supports:

- sending chat messages
- continuing a conversation through a persistent `conversationId`
- restoring stored message history
- encrypted-at-rest message storage in MySQL

This handoff explains what kind of frontend should be built, how it should talk to the API, and which product constraints matter.

## Product Scope

The assistant is not a general chatbot.

It should only provide general information about studying in the United States.

Important product rules:

- questions about U.S. universities and studying in the U.S. are allowed
- questions about studying in other countries must be refused and redirected
- the assistant should not provide individualized consulting
- the assistant should not provide step-by-step admissions instructions
- the assistant should stay educational, general, and welcoming

The frontend should support that product goal and should not frame the assistant as a general-purpose search or advice tool.

## Backend Base Behavior

The backend is an Express API.

The chat flow depends on a client-generated `conversationId`.
That means the frontend is responsible for:

- creating a `conversationId`
- persisting it on the client side if the session should survive refreshes
- reusing it for future requests

If a frontend does not persist the `conversationId`, every refresh becomes a new conversation.

## Endpoints

### `POST /api/chat`

Send a user message and receive the assistant reply.

Request body:

```json
{
  "prompt": "How can I study in the United States?",
  "conversationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Success response:

```json
{
  "message": "Assistant response text"
}
```

Error behavior:

- `400` for invalid request payloads
- `429` if rate limit is hit
- `500` or `502` style failures when the backend or upstream AI call fails

Frontend expectation:

- render the user message immediately
- submit the request
- append the returned assistant message when the request succeeds
- show a simple inline error when the request fails

### `GET /api/conversations/:conversationId/messages`

Restore stored conversation history.

Success response:

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

Frontend expectation:

- call this endpoint on app load if a stored `conversationId` exists
- map `messages` into the UI chat thread
- order messages as returned
- do not expose token metadata unless product actually needs it

### `GET /healthz`

Basic server health endpoint.

### `GET /readyz`

Readiness endpoint. Returns non-ready if the database is unavailable.

These are mainly useful for infrastructure, but they can also help local integration checks.

## Session Model

Recommended frontend behavior:

1. On first load, check `localStorage` for a saved `conversationId`.
2. If missing, create a new UUID and save it.
3. Use that `conversationId` for both history restore and future chat sends.
4. Offer a visible "new conversation" action that clears the stored id and creates a new one.

Without step 4, users can get stuck in one long conversation thread with no clear reset behavior.

## Recommended Frontend UX

Minimum useful experience:

- chat message list
- multiline text input
- send button
- loading state while waiting for response
- inline error state
- automatic history restore
- clear "new conversation" action

Recommended nice-to-haves:

- copy message action
- markdown rendering for assistant messages
- automatic scroll to latest message
- subtle audio feedback
- clear indication when an old conversation has been restored

## Content / Prompt Constraints

The frontend should not try to "fix" the product scope in the UI alone.
The backend prompt already constrains the assistant, but the frontend should still align with it.

Suggested UI copy:

- placeholder text should suggest U.S. study questions
- helper text should frame the assistant as an educational guide
- avoid labels like "Ask me anything"

Good examples:

- "Ask about studying in the United States..."
- "Get general information about U.S. universities and student life"

Bad examples:

- "Ask anything"
- "Get personalized admissions advice"
- "Plan your move anywhere in the world"

## CORS / Deployment Notes

The backend currently allows requests from configured origins through `CLIENT_ORIGIN`.

Current intended origins include:

- `http://localhost:8080/`
- `https://helenaexplora.hmpedro.com/`

If a new frontend is deployed elsewhere, backend CORS must be updated.

## Error Handling Guidance

A frontend should handle these cases explicitly:

- invalid request input
- server unavailable
- AI request failed
- rate-limited requests
- history restore failed

Recommended behavior:

- keep user-facing errors short
- do not expose backend stack traces
- allow the user to retry

## Accessibility Guidance

A new frontend should include:

- keyboard-accessible input and send action
- clear focus states
- an `aria-live` strategy for assistant replies
- loading announcements for screen readers

## Security / Privacy Notes

The backend stores messages encrypted at rest, but the frontend still handles plaintext in memory.

That means the frontend should:

- avoid logging user messages to the console
- avoid unnecessary analytics payloads with raw message content
- avoid exposing internal metadata unless needed

## Suggested Build Order

If someone is starting from zero, this is the most practical order:

1. Build a basic chat layout.
2. Add `conversationId` creation and storage.
3. Integrate `GET /api/conversations/:conversationId/messages`.
4. Integrate `POST /api/chat`.
5. Add loading and error states.
6. Add "new conversation".
7. Add polish such as markdown, copy, audio, and accessibility improvements.

## Final Guidance

The main architectural idea is simple:

- the frontend owns the conversation id
- the backend owns the conversation history
- the frontend should feel focused, lightweight, and clearly limited to U.S. study topics

If a new frontend is being built from scratch, the most important thing is not visual complexity. It is getting the session model, API integration, and product framing right.

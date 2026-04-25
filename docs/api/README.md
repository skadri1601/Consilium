# Consilium API Documentation

The Consilium API is a RESTful API built with NestJS. All endpoints require authentication via Clerk JWT tokens.

## Base URL

- **Development**: `http://localhost:4000/api/v1`
- **Production**: `https://api.myconsilium.xyz/api/v1`

## Authentication

All API requests require a Bearer token in the Authorization header:

```http
Authorization: Bearer <clerk_jwt_token>
```

Get your token from Clerk after signing in. The token is automatically included in requests from the frontend.

## Interactive Documentation

Swagger UI is available at:
- **Development**: http://localhost:4000/api/docs
- **Production**: https://api.myconsilium.xyz/api/docs

## Endpoints

### Health

#### GET /health
Check API health status.

**Response:**
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" }
  }
}
```

#### GET /health/ready
Readiness check for container orchestration.

#### GET /health/live
Liveness check for container orchestration.

### Debates

#### POST /debates
Start a new debate session.

**Request:**
```json
{
  "topic": "Build a REST API with authentication using Node.js and PostgreSQL",
  "models": ["gpt-5.4-mini", "claude-haiku-4-5-20251001"]
}
```

**Response:**
```json
{
  "id": "debate-123",
  "userId": "user-456",
  "topic": "Build a REST API...",
  "status": "processing",
  "modelsUsed": ["gpt-5.4-mini", "claude-haiku-4-5-20251001"],
  "totalCost": 0,
  "createdAt": "2026-01-10T12:00:00Z"
}
```

#### GET /debates
List user's debate sessions.

**Query Parameters:**
- `limit` (number, default: 20): Number of results
- `offset` (number, default: 0): Pagination offset

**Response:**
```json
[
  {
    "id": "debate-123",
    "topic": "Build a REST API...",
    "status": "completed",
    "modelsUsed": ["gpt-5.4-mini"],
    "totalCost": 0.0123,
    "goldenPrompt": "Create a REST API...",
    "createdAt": "2026-01-10T12:00:00Z",
    "rounds": []
  }
]
```

#### GET /debates/:id
Get specific debate session details.

**Response:**
```json
{
  "id": "debate-123",
  "topic": "Build a REST API...",
  "status": "completed",
  "goldenPrompt": "Create a REST API...",
  "rounds": [
    {
      "id": "round-1",
      "roundNumber": 1,
      "status": "completed",
      "messages": [
        {
          "id": "msg-1",
          "agentId": "gpt-5.4-mini",
          "modelUsed": "gpt-5.4-mini",
          "content": "Agent response...",
          "promptTokens": 100,
          "completionTokens": 200,
          "cost": 0.001,
          "latencyMs": 1500
        }
      ]
    }
  ]
}
```

#### GET /debates/:id/stream
Stream debate progress via Server-Sent Events (SSE).

**Query Parameters:**
- `token` (string): Clerk JWT token (for SSE authentication)

**Event Types:**
- `debate:start`: Debate started
- `round:start`: New round started
- `agent:start`: Agent started responding
- `agent:chunk`: Agent response chunk
- `agent:complete`: Agent completed
- `synthesis:start`: Synthesis started
- `debate:complete`: Debate completed
- `debate:error`: Error occurred

**Example Event:**
```
event: agent:chunk
data: {"event":"agent:chunk","agentId":"gpt-5.4-mini","chunk":"This is a chunk of text..."}
```

### API Keys

#### GET /api-keys
Get user's API keys (masked).

**Response:**
```json
{
  "openaiKey": "sk-...****",
  "anthropicKey": null,
  "googleKey": null
}
```

#### PUT /api-keys
Update user's API keys.

**Request:**
```json
{
  "openaiKey": "sk-...",
  "anthropicKey": "sk-ant-...",
  "googleKey": "AIza..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "API keys updated"
}
```

#### POST /api-keys/test
Test an API key.

**Request:**
```json
{
  "provider": "openai",
  "key": "sk-..."
}
```

**Response:**
```json
{
  "valid": true,
  "message": "API key is valid"
}
```

### Users

#### GET /users/me
Get current user profile.

**Response:**
```json
{
  "id": "user-123",
  "clerkId": "user_clerk_123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2026-01-10T12:00:00Z"
}
```

#### PUT /users/me
Update current user profile.

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

### Analytics

#### GET /analytics
Get analytics data.

**Response:**
```json
{
  "totalDebates": 42,
  "totalCost": 1.23,
  "debatesByDay": [
    { "date": "2026-01-10", "count": 5 },
    { "date": "2026-01-09", "count": 3 }
  ],
  "modelUsage": {
    "gpt-5.4-mini": 20,
    "claude-haiku-4-5-20251001": 15,
    "gemini-3-flash-preview": 7
  }
}
```

### Waitlist

#### POST /waitlist
Join the waitlist.

**Request:**
```json
{
  "email": "user@example.com",
  "source": "landing_page"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully joined waitlist",
  "id": "waitlist-123"
}
```

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

### Common Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error
- `503`: Service Unavailable

## Rate Limiting

Rate limits are applied per user:
- **Login**: 5 attempts per 15 minutes
- **API**: 100 requests per minute
- **Debate creation**: 10 per hour

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641900000
```

## SSE Streaming

SSE endpoints require special handling:

1. Include token in query string: `?token=<jwt_token>`
2. Set `Accept: text/event-stream` header
3. Handle events as they arrive
4. Reconnect on disconnect

**JavaScript Example:**
```javascript
const eventSource = new EventSource(
  `${API_URL}/api/v1/debates/${debateId}/stream?token=${token}`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.event, data);
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  eventSource.close();
};
```

## Postman Collection

Import the [Postman Collection](./consilium-api.postman.json) for easy testing.

## SDKs

### TypeScript/JavaScript

```typescript
import { ConsiliumClient } from '@myconsilium/sdk';

const client = new ConsiliumClient({
  apiUrl: 'https://api.myconsilium.xyz',
  token: 'your-clerk-token'
});

// Start a debate
const debate = await client.debates.create({
  topic: 'Build a REST API...',
  models: ['gpt-5.4-mini', 'claude-haiku-4-5-20251001']
});

// Stream progress
const stream = await client.debates.stream(debate.id);
for await (const event of stream) {
  console.log(event);
}
```

## Webhooks

### Clerk Webhooks

Consilium receives webhooks from Clerk for user events:

**Endpoint:** `POST /api/v1/webhooks/clerk`

**Events:**
- `user.created`
- `user.updated`
- `user.deleted`
- `session.ended`
- `session.revoked`

**Verification:** Webhook signature is verified using `CLERK_WEBHOOK_SECRET`.

## Support

For API issues:
- Check [Swagger UI](http://localhost:4000/api/docs) for interactive docs (or `https://api.myconsilium.xyz/api/docs` for the hosted API)
- Review error responses for details
- Email <support@myconsilium.xyz>

The Consilium source repository is private as of April 2026. The CLI (`@myconsilium/cli`), TypeScript SDK (`@myconsilium/sdk`), and Python SDK (`consilium`) remain publicly distributed.


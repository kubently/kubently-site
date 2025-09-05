---
layout: page
title: API Reference
permalink: /api/
---

# API Reference

Kubently provides a comprehensive REST API for creating debug sessions, executing kubectl commands, and managing cluster interactions.

## Base URL

```
http://your-kubently-api:8080
```

## Authentication

All API requests require authentication via API key in the `Authorization` header:

```http
Authorization: Bearer your-api-key-here
```

## Endpoints

### Health Check

#### GET /health

Returns the health status of the API service.

**Response**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-20T10:30:45Z",
  "uptime_seconds": 3600
}
```

### Session Management

#### POST /debug/session

Create a new debugging session for a cluster.

**Request Body**
```json
{
  "cluster_id": "production-cluster",
  "metadata": {
    "user": "debugging-agent",
    "correlation_id": "trace-123"
  }
}
```

**Response**
```json
{
  "session_id": "sess_abc123def456",
  "cluster_id": "production-cluster",
  "status": "active",
  "created_at": "2024-01-20T10:30:45Z",
  "expires_at": "2024-01-20T11:30:45Z"
}
```

#### GET /debug/session/{session_id}

Get information about a specific debug session.

**Response**
```json
{
  "session_id": "sess_abc123def456",
  "cluster_id": "production-cluster",
  "status": "active",
  "created_at": "2024-01-20T10:30:45Z",
  "expires_at": "2024-01-20T11:30:45Z",
  "last_activity": "2024-01-20T10:32:15Z",
  "commands_executed": 5
}
```

#### DELETE /debug/session/{session_id}

Close a debug session and clean up resources.

**Response**
```json
{
  "session_id": "sess_abc123def456",
  "status": "closed",
  "closed_at": "2024-01-20T10:35:00Z"
}
```

#### GET /debug/sessions

List all active debug sessions (admin only).

**Query Parameters**
- `cluster_id` (optional): Filter by cluster ID
- `status` (optional): Filter by session status
- `limit` (optional): Maximum number of sessions to return (default: 50)

**Response**
```json
{
  "sessions": [
    {
      "session_id": "sess_abc123def456",
      "cluster_id": "production-cluster",
      "status": "active",
      "created_at": "2024-01-20T10:30:45Z",
      "last_activity": "2024-01-20T10:32:15Z"
    }
  ],
  "total": 1
}
```

### Command Execution

#### POST /debug/execute

Execute a kubectl command within a debug session.

**Request Body**
```json
{
  "cluster_id": "production-cluster",
  "session_id": "sess_abc123def456",
  "command_type": "get",
  "args": ["pods", "-A", "--limit=10"],
  "timeout": 30
}
```

**Parameters**
- `cluster_id` (required): Target cluster identifier
- `session_id` (required): Active debug session ID
- `command_type` (required): kubectl command type (get, describe, explain, etc.)
- `args` (required): Command arguments as array of strings
- `timeout` (optional): Command timeout in seconds (default: 30)

**Supported Command Types**
- `get` - Retrieve resources
- `describe` - Detailed resource information
- `explain` - Resource documentation
- `version` - Cluster version information
- `cluster-info` - Cluster information

**Response**
```json
{
  "result_id": "res_xyz789abc123",
  "session_id": "sess_abc123def456",
  "status": "completed",
  "output": "NAMESPACE     NAME                    READY   STATUS    RESTARTS   AGE\nkube-system   coredns-558bd4d5db-abc  1/1     Running   0          5m",
  "error": null,
  "execution_time_ms": 234,
  "executed_at": "2024-01-20T10:32:15Z"
}
```

#### GET /debug/result/{result_id}

Retrieve the result of a previously executed command.

**Response**
```json
{
  "result_id": "res_xyz789abc123",
  "session_id": "sess_abc123def456",
  "status": "completed",
  "output": "command output here",
  "error": null,
  "execution_time_ms": 234,
  "executed_at": "2024-01-20T10:32:15Z"
}
```

### Cluster Management

#### GET /clusters

List available clusters (admin only).

**Response**
```json
{
  "clusters": [
    {
      "cluster_id": "production-cluster",
      "name": "Production Cluster",
      "status": "connected",
      "agent_version": "1.0.0",
      "last_seen": "2024-01-20T10:32:00Z"
    }
  ]
}
```

#### GET /clusters/{cluster_id}/status

Get the status of a specific cluster.

**Response**
```json
{
  "cluster_id": "production-cluster",
  "status": "connected",
  "agent_version": "1.0.0",
  "last_seen": "2024-01-20T10:32:00Z",
  "active_sessions": 2,
  "queue_depth": 0
}
```

## Error Responses

All endpoints may return these common error responses:

### 400 Bad Request
```json
{
  "error": "invalid_request",
  "message": "Missing required field: cluster_id",
  "details": {
    "field": "cluster_id",
    "code": "missing_required_field"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "unauthorized",
  "message": "Invalid or missing API key"
}
```

### 404 Not Found
```json
{
  "error": "not_found",
  "message": "Session not found: sess_abc123def456"
}
```

### 429 Too Many Requests
```json
{
  "error": "rate_limited",
  "message": "Rate limit exceeded",
  "details": {
    "limit": 100,
    "window": "1m",
    "retry_after": 30
  }
}
```

### 500 Internal Server Error
```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred",
  "details": {
    "request_id": "req_xyz123abc456"
  }
}
```

### 503 Service Unavailable
```json
{
  "error": "service_unavailable",
  "message": "Cluster agent is not connected",
  "details": {
    "cluster_id": "production-cluster",
    "last_seen": "2024-01-20T09:30:00Z"
  }
}
```

## Rate Limiting

API requests are rate limited per API key:
- **Standard endpoints**: 100 requests per minute
- **Command execution**: 50 requests per minute
- **Session creation**: 20 requests per minute

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642681860
```

## A2A (Agent-to-Agent) Headers

For multi-agent systems, include these additional headers:

```http
X-Correlation-ID: unique-trace-id
X-Service-Identity: calling-service-name
X-Request-Timeout: 30
```

## WebSocket API (Future)

*Coming soon: Real-time WebSocket API for streaming command output and session events.*

## SDK Examples

### Python SDK

```python
import kubently

# Initialize client
client = kubently.Client(
    endpoint="http://your-kubently-api:8080",
    api_key="your-api-key"
)

# Create session and execute commands
async with client.debug_session("production-cluster") as session:
    # Get all pods
    result = await session.execute("get", ["pods", "-A"])
    print(result.output)
    
    # Describe specific pod
    result = await session.execute("describe", ["pod", "my-pod", "-n", "default"])
    print(result.output)
```

### JavaScript SDK

```javascript
const kubently = require('kubently-js');

const client = new kubently.Client({
  endpoint: 'http://your-kubently-api:8080',
  apiKey: 'your-api-key'
});

// Create session and execute commands
const session = await client.createDebugSession('production-cluster');

try {
  // Get all pods
  const podsResult = await client.execute(session.sessionId, 'get', ['pods', '-A']);
  console.log(podsResult.output);
  
  // Describe specific pod
  const describeResult = await client.execute(session.sessionId, 'describe', ['pod', 'my-pod', '-n', 'default']);
  console.log(describeResult.output);
} finally {
  await client.closeSession(session.sessionId);
}
```

### cURL Examples

```bash
# Create a debug session
curl -X POST http://your-kubently-api:8080/debug/session \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"cluster_id": "production-cluster"}'

# Execute a kubectl command
curl -X POST http://your-kubently-api:8080/debug/execute \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "cluster_id": "production-cluster",
    "session_id": "sess_abc123def456",
    "command_type": "get",
    "args": ["pods", "-A"]
  }'

# Close the session
curl -X DELETE http://your-kubently-api:8080/debug/session/sess_abc123def456 \
  -H "Authorization: Bearer your-api-key"
```

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:
```
http://your-kubently-api:8080/openapi.json
```

Interactive API documentation (Swagger UI) is available at:
```
http://your-kubently-api:8080/docs
```
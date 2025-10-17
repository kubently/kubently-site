---
layout: page
title: API Reference
permalink: /api/
---

Kubently provides a comprehensive REST API for debugging sessions, kubectl command execution, and A2A (Agent-to-Agent) protocol support for multi-agent systems.

## Base URLs

```
# Main API (includes A2A endpoints)
http://your-kubently-api:8080

# A2A Protocol Endpoints (mounted on main API port)
http://your-kubently-api:8080/a2a
```

**Note**: The A2A protocol endpoints are mounted on the main API service port (8080) under the `/a2a` path. This allows a single ingress/load balancer to handle both standard API calls and A2A protocol communications.

## Authentication

Kubently uses a deliberate dual-header authentication strategy:

### Client Authentication (External APIs)
External clients (CLI, A2A services, multi-agent systems) use the `X-API-Key` header:
```http
X-API-Key: your-api-key-here
```

### Executor Authentication (Internal)
Internal executors connecting from clusters use the standard Authorization header:
```http
Authorization: Bearer executor-token-here
X-Cluster-ID: cluster-name
```

### OAuth/OIDC Support
Kubently supports OAuth 2.0 and OIDC for enterprise authentication:
```http
Authorization: Bearer jwt-token-here
```

This separation allows OIDC/JWT implementation for human users without conflicting with machine-to-machine authentication.

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

Execute a kubectl command within a debug session. Commands are validated against configurable security modes.

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

## A2A (Agent-to-Agent) Protocol

### Overview

Kubently includes full A2A protocol support for multi-agent systems, enabling natural language interactions with Kubernetes clusters through LLM providers integrated in the cnoe_agent_utils LLMFactory (including Google, Anthropic, OpenAI, and others).

### A2A Endpoints

#### POST /a2a/sessions

Create a new A2A session for natural language debugging.

**Request Body**
```json
{
  "query": "Check if there are any pods in crashloopbackoff state",
  "cluster_id": "kind",  // Optional, defaults to configured cluster
  "thread_id": "thread-123"  // Optional, for conversation continuity
}
```

**Response** (Server-Sent Events stream)
```
data: {"type": "tool_call", "tool": "execute_kubectl", "parameters": {"command": "get pods -A"}}
data: {"type": "content", "content": "I found 2 pods in CrashLoopBackOff state..."}
data: {"type": "done"}
```

### A2A Headers

For multi-agent systems, include these additional headers:

```http
X-Correlation-ID: unique-trace-id
X-Service-Identity: calling-service-name
X-Request-Timeout: 30
```

### Tool Call Visibility

The A2A protocol exposes actual tool calls made by the agent, enabling:
- Full observability of kubectl commands executed
- Performance monitoring and optimization
- Audit logging and compliance tracking
- Test automation and validation

Example tool call event:
```json
{
  "type": "tool_call",
  "tool": "execute_kubectl",
  "parameters": {
    "cluster_id": "production",
    "command": "describe",
    "resource": "pod/failing-app",
    "namespace": "default"
  },
  "timestamp": "2024-01-20T10:30:45Z"
}
```

## Usage Examples

### Using the CLI (Recommended)

The Kubently CLI provides the easiest way to interact with Kubently:

```bash
# Initialize configuration
kubently init

# Start interactive debug session
kubently debug production-cluster

# Ask natural language questions
You> What pods are running in the default namespace?
You> Show me any pods with issues
You> Describe the failing pod in namespace myapp
```

See the [CLI Guide](/guides/cli/) for complete documentation.

### Using curl (Direct API Access)

```bash
# Create a debug session
curl -X POST http://your-kubently-api:8080/debug/session \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"cluster_id": "production-cluster"}'

# Execute a kubectl command
curl -X POST http://your-kubently-api:8080/debug/execute \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "cluster_id": "production-cluster",
    "session_id": "sess_abc123def456",
    "command_type": "get",
    "args": ["pods", "-A"]
  }'

# Close the session
curl -X DELETE http://your-kubently-api:8080/debug/session/sess_abc123def456 \
  -H "X-API-Key: your-api-key"
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
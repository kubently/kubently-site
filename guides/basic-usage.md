---
layout: page
title: Basic Usage
permalink: /guides/basic-usage/
---

# Basic Usage Guide

This guide covers the fundamental concepts and everyday usage patterns for Kubently.

## Core Concepts

### Sessions

A **debug session** is a temporary context for executing kubectl commands against a specific cluster. Sessions provide:

- **Isolation**: Each session is independent
- **Security**: Commands are scoped to the session
- **Efficiency**: Connection reuse and caching
- **Cleanup**: Automatic resource cleanup

### Commands

Kubently supports a subset of kubectl commands focused on **read-only operations**:

- `get` - Retrieve resources
- `describe` - Detailed resource information  
- `explain` - Resource documentation
- `version` - Cluster version information
- `cluster-info` - Cluster information

### Results

Command results include:
- **Output**: The actual kubectl command output
- **Execution time**: How long the command took
- **Status**: Success or error state
- **Metadata**: Session and timing information

## Basic Workflow

### 1. Create a Session

```bash
# Using curl
curl -X POST http://your-api:8080/debug/session \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"cluster_id": "production"}'
```

Response:
```json
{
  "session_id": "sess_abc123def456",
  "cluster_id": "production", 
  "status": "active",
  "created_at": "2024-01-20T10:30:45Z",
  "expires_at": "2024-01-20T11:30:45Z"
}
```

### 2. Execute Commands

```bash
# Get all pods
curl -X POST http://your-api:8080/debug/execute \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "cluster_id": "production",
    "session_id": "sess_abc123def456", 
    "command_type": "get",
    "args": ["pods", "-A"]
  }'
```

Response:
```json
{
  "result_id": "res_xyz789abc123",
  "session_id": "sess_abc123def456",
  "status": "completed",
  "output": "NAMESPACE     NAME                    READY   STATUS    RESTARTS   AGE\nkube-system   coredns-558bd4d5db-abc  1/1     Running   0          5m",
  "execution_time_ms": 234,
  "executed_at": "2024-01-20T10:32:15Z"
}
```

### 3. Close the Session

```bash
# Clean up
curl -X DELETE http://your-api:8080/debug/session/sess_abc123def456 \
  -H "X-API-Key: your-api-key"
```

## Common Commands

### Resource Discovery

```bash
# List all pods
{
  "command_type": "get",
  "args": ["pods", "-A"]
}

# List nodes
{
  "command_type": "get", 
  "args": ["nodes"]
}

# List services
{
  "command_type": "get",
  "args": ["services", "-A"]
}

# List deployments
{
  "command_type": "get",
  "args": ["deployments", "-A"]
}
```

### Resource Details

```bash
# Describe a specific pod
{
  "command_type": "describe",
  "args": ["pod", "my-pod", "-n", "default"]
}

# Describe a node
{
  "command_type": "describe", 
  "args": ["node", "worker-node-1"]
}

# Get pod details with more info
{
  "command_type": "get",
  "args": ["pod", "my-pod", "-n", "default", "-o", "yaml"]
}
```

### Filtering and Sorting

```bash
# Get pods with specific labels
{
  "command_type": "get",
  "args": ["pods", "-l", "app=nginx", "-A"]
}

# Get events sorted by time
{
  "command_type": "get", 
  "args": ["events", "--sort-by=.metadata.creationTimestamp"]
}

# Get pods in specific namespace
{
  "command_type": "get",
  "args": ["pods", "-n", "production"]
}

# Get resources with field selectors
{
  "command_type": "get",
  "args": ["pods", "-A", "--field-selector=status.phase!=Running"]
}
```

### Resource Documentation

```bash
# Explain pod resource
{
  "command_type": "explain",
  "args": ["pod"]
}

# Explain specific field
{
  "command_type": "explain",
  "args": ["pod.spec.containers"]
}
```

### Cluster Information

```bash
# Get cluster version
{
  "command_type": "version"
}

# Get cluster info
{
  "command_type": "cluster-info"
}
```

## Output Formats

Kubently supports different output formats:

### JSON Output
```bash
{
  "command_type": "get",
  "args": ["pods", "-n", "default", "-o", "json"]
}
```

### YAML Output  
```bash
{
  "command_type": "get",
  "args": ["deployment", "nginx", "-n", "default", "-o", "yaml"]
}
```

### Wide Output (More Columns)
```bash
{
  "command_type": "get", 
  "args": ["pods", "-A", "-o", "wide"]
}
```

### Custom Columns
```bash
{
  "command_type": "get",
  "args": ["pods", "-A", "-o", "custom-columns=NAME:.metadata.name,STATUS:.status.phase,NODE:.spec.nodeName"]
}
```

## Session Management

### Session Lifecycle

1. **Creation**: `POST /debug/session`
2. **Active**: Execute commands
3. **Expiration**: Auto-cleanup after 1 hour
4. **Manual Close**: `DELETE /debug/session/{id}`

### Session Information

```bash
# Get session details
curl -X GET http://your-api:8080/debug/session/sess_abc123def456 \
  -H "X-API-Key: your-api-key"
```

Response:
```json
{
  "session_id": "sess_abc123def456",
  "cluster_id": "production",
  "status": "active", 
  "created_at": "2024-01-20T10:30:45Z",
  "expires_at": "2024-01-20T11:30:45Z",
  "last_activity": "2024-01-20T10:32:15Z",
  "commands_executed": 5
}
```

### Multiple Sessions

You can have multiple active sessions:

```bash
# Session for different clusters
curl -X POST http://your-api:8080/debug/session \
  -d '{"cluster_id": "staging"}'

curl -X POST http://your-api:8080/debug/session \
  -d '{"cluster_id": "development"}'
```

## Error Handling

### Common Error Responses

**Invalid Command:**
```json
{
  "error": "invalid_command",
  "message": "Command type 'create' is not allowed", 
  "details": {
    "allowed_commands": ["get", "describe", "explain", "version", "cluster-info"]
  }
}
```

**Session Not Found:**
```json
{
  "error": "session_not_found",
  "message": "Session sess_invalid not found"
}
```

**Cluster Unavailable:**
```json
{
  "error": "cluster_unavailable", 
  "message": "Cluster 'production' agent is not connected",
  "details": {
    "last_seen": "2024-01-20T09:30:00Z"
  }
}
```

**Command Timeout:**
```json
{
  "error": "command_timeout",
  "message": "Command timed out after 30 seconds"
}
```

### Error Recovery

1. **Retry with exponential backoff**
2. **Check cluster connectivity** 
3. **Verify session is still active**
4. **Create new session if expired**

## Performance Tips

### Efficient Queries

```bash
# Use limits to avoid large responses
{
  "command_type": "get",
  "args": ["pods", "-A", "--limit=50"]
}

# Use field selectors to filter server-side
{
  "command_type": "get", 
  "args": ["pods", "-A", "--field-selector=status.phase=Running"]
}

# Use label selectors efficiently
{
  "command_type": "get",
  "args": ["pods", "-l", "app=nginx,version=v1.0"]
}
```

### Session Reuse

```bash
# Reuse sessions for multiple related commands
session_id="sess_abc123def456"

# Execute multiple commands in the same session
curl -X POST .../debug/execute -d '{"session_id": "'$session_id'", ...}'
curl -X POST .../debug/execute -d '{"session_id": "'$session_id'", ...}'
curl -X POST .../debug/execute -d '{"session_id": "'$session_id'", ...}'
```

### Caching

Results are cached briefly to improve performance:
- Same command in same session may return cached result
- Cache TTL is typically 30 seconds
- Cache is automatically invalidated when session closes

## Best Practices

### Security
- Always use HTTPS in production
- Rotate API keys regularly
- Use least privilege access patterns
- Close sessions when done

### Performance  
- Reuse sessions for related commands
- Use field/label selectors to reduce data transfer
- Set appropriate timeouts
- Limit result sets with `--limit`

### Debugging Workflow
1. Start with broad queries (`get pods -A`)
2. Narrow down to specific resources
3. Use `describe` for detailed information
4. Check events for troubleshooting context
5. Clean up sessions when done

### Monitoring
- Track session creation/cleanup
- Monitor command execution times
- Alert on high error rates
- Log security-relevant events

## Next Steps

- [Multi-Agent Integration](/guides/multi-agent/) - Connect with AI systems
- [Security Guide](/guides/security/) - Production security practices
- [API Reference](/api/) - Complete API documentation
- [Troubleshooting](/guides/troubleshooting/) - Common issues and solutions
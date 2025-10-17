---
layout: page
title: Multi-Agent Systems Integration
permalink: /guides/multi-agent/
---

Kubently is designed from the ground up to work seamlessly with AI agents and multi-agent systems. This guide covers how to integrate Kubently with LLMs, AI agents, and Agent-to-Agent (A2A) communication systems.

## Overview

Kubently provides several integration methods for AI systems:

1. **A2A Protocol** - Native Agent-to-Agent communication with streaming responses
2. **Direct REST API** - Standard HTTP API for basic integration
3. **CLI Integration** - Command-line interface for scripts and automation

## A2A (Agent-to-Agent) Communication

### What is A2A?

A2A (Agent-to-Agent) communication allows AI agents to communicate directly with Kubently without human intervention, enabling automated cluster debugging and maintenance workflows.

### A2A Headers

When making requests to Kubently from AI agents, include these headers:

```http
X-API-Key: service-scoped-key
X-Correlation-ID: unique-trace-id
X-Service-Identity: calling-service-name
X-Request-Timeout: 30
Content-Type: application/json
```

### A2A Workflow Example

```python
import requests
import uuid

class KubentlyA2AClient:
    def __init__(self, api_endpoint, api_key, service_identity):
        self.api_endpoint = api_endpoint
        self.api_key = api_key
        self.service_identity = service_identity
    
    def _headers(self, correlation_id=None):
        return {
            "X-API-Key": self.api_key,
            "X-Correlation-ID": correlation_id or str(uuid.uuid4()),
            "X-Service-Identity": self.service_identity,
            "X-Request-Timeout": "30",
            "Content-Type": "application/json"
        }
    
    async def debug_pod_issues(self, cluster_id, namespace=None):
        """Automated pod debugging workflow"""
        correlation_id = str(uuid.uuid4())
        
        # Create debug session
        session_resp = requests.post(
            f"{self.api_endpoint}/debug/session",
            headers=self._headers(correlation_id),
            json={"cluster_id": cluster_id}
        )
        session = session_resp.json()
        session_id = session["session_id"]
        
        try:
            # Get pods with issues
            pods_resp = requests.post(
                f"{self.api_endpoint}/debug/execute",
                headers=self._headers(correlation_id),
                json={
                    "cluster_id": cluster_id,
                    "session_id": session_id,
                    "command_type": "get",
                    "args": ["pods", "-A", "--field-selector=status.phase!=Running"]
                }
            )
            
            # Analyze results and take actions
            pods = pods_resp.json()
            return await self._analyze_pod_issues(pods, session_id, cluster_id)
            
        finally:
            # Clean up session
            requests.delete(
                f"{self.api_endpoint}/debug/session/{session_id}",
                headers=self._headers(correlation_id)
            )
```

## A2A Protocol Integration

### What is the A2A Protocol?

The A2A (Agent-to-Agent) protocol is an industry-standard protocol for agent communication. Kubently implements the A2A protocol specification, providing a streaming interface for LLM agents to interact with Kubernetes clusters.

### A2A Endpoint

The A2A server is mounted at `/a2a/` on the main Kubently API:

```bash
# A2A endpoint
http://your-kubently-api:8080/a2a/

# Example A2A request
curl -X POST http://localhost:8080/a2a/ \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "message/stream",
    "params": {
      "message": {
        "messageId": "msg-1",
        "role": "user",
        "parts": [{"partId": "part-1", "text": "List all pods in the default namespace"}]
      }
    },
    "id": 1
  }'
```

### Internal Tools

Kubently's A2A server uses LangGraph/LangChain to provide an LLM agent with access to these internal tools:

- **`list_clusters()`** - List all available Kubernetes clusters
- **`execute_kubectl(cluster_id, command, namespace, extra_args)`** - Execute kubectl commands with safety validation
- **`todo_write(todos)`** - Manage systematic debugging workflow and track investigation progress

These tools are used internally by the A2A server's LLM agent and are not directly exposed as external APIs.

### Using the A2A Protocol

The easiest way to interact with Kubently's A2A server is through the CLI:

```bash
# Start interactive A2A session
kubently debug production-cluster

# Ask natural language questions
You> What pods are in crashloopbackoff?
You> Show me the events for the failing pod
You> What's causing the database connection issues?
```

See the [CLI Guide](/guides/cli/) for more details.

## LLM Prompt Engineering

### System Prompt for Kubernetes Debugging

This is the system prompt used by Kubently's built-in A2A agent:

```markdown
You are a Kubernetes debugging assistant with access to kubectl commands.

## Available Tools

You have access to these internal tools:
- list_clusters(): List all available Kubernetes clusters
- execute_kubectl(cluster_id, command, namespace, extra_args): Execute kubectl commands
- todo_write(todos): Track your debugging investigation steps

## Debugging Workflow

1. **Cluster Selection**
   - If the user doesn't specify a cluster, use list_clusters() to show options
   - Ask the user which cluster to investigate

2. **Assessment Phase**
   - Use execute_kubectl to gather initial cluster state (nodes, pods, events)
   - Identify problematic resources
   - Use todo_write to track your investigation plan

3. **Investigation Phase**
   - Focus on specific namespaces or resources
   - Use describe commands for detailed information
   - Check resource relationships and dependencies
   - Update your todo list as you progress

4. **Analysis Phase**
   - Correlate findings across different resource types
   - Identify root causes and contributing factors
   - Suggest remediation steps

5. **Summary Phase**
   - Summarize findings and recommendations
   - Complete remaining todos

## Security Guidelines

- Only use read-only kubectl commands (get, describe, logs, top, explain)
- Never attempt dangerous operations (delete, create, apply, patch, etc.)
- Commands with dangerous verbs will be blocked automatically
- Respect namespace boundaries and RBAC permissions

## Best Practices

- Be systematic and thorough in your investigations
- Use todo_write to track your debugging steps
- Start with broad queries, then narrow down
- Use field selectors and label selectors efficiently
- Cross-reference events with resource states
- Provide clear, actionable recommendations
```

### Example LLM Interaction

```markdown
Human: The pods in my production cluster are crashing. Can you help debug this?

Agent: I'll help debug your production cluster. Let me start by checking for problematic pods.

[Tool: execute_kubectl]
cluster_id: production
command: get pods -A --field-selector=status.phase!=Running

[Result: Found 3 pods not running]
- default/app-backend-7f8d9c-xyz (CrashLoopBackOff, 15 restarts)
- default/app-worker-6b5c8d-abc (CrashLoopBackOff, 12 restarts)
- monitoring/prometheus-9d4e2f-def (ImagePullBackOff)

[Tool: execute_kubectl]
cluster_id: production
command: describe pod app-backend-7f8d9c-xyz -n default

[Analysis]
I've identified the issues:

1. **app-backend and app-worker** - Both crashing due to database connection failure
   - Error: "Connection refused to postgres:5432"
   - Root cause: PostgreSQL service is not accessible
   - Recommendation: Check if postgres service and pods are running

2. **prometheus** - Image pull failure
   - Error: "Failed to pull image prometheus:v2.50.0"
   - Root cause: Image tag doesn't exist in registry
   - Recommendation: Verify image tag or use latest stable version

Would you like me to investigate the PostgreSQL connectivity issue further?
```

## Next Steps

- [A2A Integration Guide](/guides/a2a-integration/)
- [Basic Usage](/guides/basic-usage/)
- [API Reference](/api/)
- [Security Guide](/guides/security/)

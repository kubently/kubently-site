---
layout: page
title: Multi-Agent Systems Integration
permalink: /guides/multi-agent/
---

# Multi-Agent Systems Integration

Kubently is designed from the ground up to work seamlessly with AI agents and multi-agent systems. This guide covers how to integrate Kubently with LLMs, AI agents, and Agent-to-Agent (A2A) communication systems.

## Overview

Kubently provides several integration methods for AI systems:

1. **Direct API Integration** - REST API for basic integration
2. **A2A Protocol Support** - Agent-to-Agent communication
3. **MCP Tool Exposure** - Model Context Protocol for LLM tools
4. **Webhook Integration** - Asynchronous event handling

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

## MCP (Model Context Protocol) Integration

### Available MCP Tools

Kubently exposes these tools via MCP for LLM integration:

```python
# MCP Tool Definitions
mcp_tools = [
    {
        "name": "create_debug_session",
        "description": "Create a new Kubernetes debugging session",
        "parameters": {
            "cluster_id": {"type": "string", "required": True},
            "correlation_id": {"type": "string", "required": False}
        }
    },
    {
        "name": "execute_kubectl",
        "description": "Execute a kubectl command in a debug session",
        "parameters": {
            "session_id": {"type": "string", "required": True},
            "command": {"type": "string", "required": True},
            "timeout": {"type": "number", "default": 30}
        }
    },
    {
        "name": "get_command_result",
        "description": "Get the result of a previously executed command",
        "parameters": {
            "result_id": {"type": "string", "required": True}
        }
    },
    {
        "name": "close_session",
        "description": "Close a debug session and clean up resources",
        "parameters": {
            "session_id": {"type": "string", "required": True}
        }
    }
]
```

### MCP Server Implementation

```python
from mcp import Server
import kubently_client

class KubentlyMCPServer(Server):
    def __init__(self, kubently_endpoint, api_key):
        super().__init__("kubently-mcp-server")
        self.client = kubently_client.Client(kubently_endpoint, api_key)
        
    @self.tool("create_debug_session")
    async def create_debug_session(self, cluster_id: str, correlation_id: str = None):
        """Create a new debugging session"""
        session = await self.client.create_session(cluster_id, correlation_id)
        return {
            "session_id": session.id,
            "cluster_id": session.cluster_id,
            "status": session.status
        }
    
    @self.tool("execute_kubectl")
    async def execute_kubectl(self, session_id: str, command: str, timeout: int = 30):
        """Execute a kubectl command"""
        # Parse command into components
        parts = command.split()
        command_type = parts[0] if parts else "get"
        args = parts[1:] if len(parts) > 1 else []
        
        result = await self.client.execute_command(
            session_id=session_id,
            command_type=command_type,
            args=args,
            timeout=timeout
        )
        
        return {
            "result_id": result.id,
            "output": result.output,
            "status": result.status,
            "execution_time_ms": result.execution_time_ms
        }
```

## LLM Prompt Engineering

### System Prompt for Kubernetes Debugging

```markdown
You are a Kubernetes debugging assistant with access to the Kubently API.

## Available Tools

You have access to these Kubently tools:
- create_debug_session(cluster_id): Create a new debugging session
- execute_kubectl(session_id, command): Execute kubectl commands
- get_command_result(result_id): Get command results
- close_session(session_id): Close debugging session

## Debugging Workflow

1. **Assessment Phase**
   - Create a debug session for the target cluster
   - Gather initial cluster state (nodes, pods, events)
   - Identify problematic resources

2. **Investigation Phase**
   - Focus on specific namespaces or resources
   - Use describe commands for detailed information
   - Check resource relationships and dependencies

3. **Analysis Phase**
   - Correlate findings across different resource types
   - Identify root causes and contributing factors
   - Suggest remediation steps

4. **Cleanup Phase**
   - Close the debug session when done
   - Summarize findings and recommendations

## Security Guidelines

- Only use read-only kubectl commands (get, describe, logs via events)
- Never attempt to modify cluster state
- Respect namespace boundaries and RBAC permissions
- Always close sessions when debugging is complete

## Best Practices

- Start with broad queries, then narrow down
- Use field selectors and label selectors efficiently
- Cross-reference events with resource states
- Provide clear, actionable recommendations
```

### Example LLM Interaction

```markdown
Human: The pods in my production cluster are crashing. Can you help debug this?
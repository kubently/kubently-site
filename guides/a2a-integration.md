---
layout: page
title: A2A and Multi-Agent Integration
permalink: /guides/a2a-integration/
parent: Guides
---

Kubently provides native support for Agent-to-Agent (A2A) communication and multi-agent system integration, enabling AI agents to collaborate on Kubernetes debugging tasks.

## Overview

The A2A integration allows multiple AI agents to:
- Share debugging context across services
- Coordinate complex troubleshooting workflows  
- Access Kubernetes clusters through a unified interface
- Maintain conversation history and state

## Architecture

```
┌─────────────────────────────────────────────────┐
│             Multi-Agent Orchestrator             │
└─────────────┬───────────────────────────────────┘
              │ A2A Protocol
              ▼
┌─────────────────────────────────────────────────┐
│         Kubently API (Port 8080)                │
│  ┌──────────────────────────────────────────┐  │
│  │     Main API Endpoints                    │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │     A2A Protocol Endpoints (/a2a/*)      │  │
│  │  ┌──────────┐  ┌──────────┐             │  │
│  │  │  Session │  │  Tool    │             │  │
│  │  │  Handler │  │  Handler │             │  │
│  │  └──────────┘  └──────────┘             │  │
│  └──────────────────────────────────────────┘  │
└─────────────┬───────────────────────────────────┘
              │ Internal Commands
              ▼
┌─────────────────────────────────────────────────┐
│         Kubently Executors (per cluster)        │
└─────────────────────────────────────────────────┘
```

**Note**: A2A endpoints are mounted on the main API service port (8080) under the `/a2a` path. This simplifies deployment by requiring only a single service port.

## Configuration

### Enable A2A Support

A2A protocol support is enabled by default and served on the main API port:

```yaml
# values.yaml for Helm deployment
api:
  env:
    A2A_ENABLED: "true"  # Default: true
  service:
    port: 8080  # Single port serves both API and A2A endpoints
```

### Agent Registration

Agents register themselves with the A2A server:

```python
# Example agent session creation for A2A
import httpx

async def create_a2a_session():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://kubently-api:8080/a2a/sessions",
            headers={"X-API-Key": "your-api-key"},
            json={
                "query": "Check for pods in CrashLoopBackOff state",
                "cluster_id": "prod-cluster"
            }
        )
        # Returns streaming SSE response with tool calls and content
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                data = json.loads(line[6:])
                yield data
```

## A2A Communication Protocol

### Message Format

A2A messages follow a standardized format:

```json
{
  "conversation_id": "conv-123",
  "from_agent": "agent-1",
  "to_agent": "agent-2",
  "message_type": "request",
  "content": {
    "action": "debug_pod",
    "parameters": {
      "cluster_id": "prod-cluster",
      "namespace": "default",
      "pod": "app-xyz"
    }
  }
}
```

### Supported Actions

- `debug_pod`: Debug a specific pod
- `get_logs`: Retrieve pod logs
- `describe_resource`: Get resource details
- `list_resources`: List resources in namespace
- `execute_command`: Run kubectl command

## Integration Examples

### With LangChain

```python
from langchain.tools import Tool
from kubently_client import KubentlyA2AClient

# Initialize A2A client
a2a_client = KubentlyA2AClient(
    base_url="http://kubently-api:8080",
    agent_id="langchain-agent"
)

# Create LangChain tool
kubently_tool = Tool(
    name="KuberneteDebugger",
    func=a2a_client.execute_debug,
    description="Debug Kubernetes clusters and pods"
)

# Use in agent chain
from langchain.agents import initialize_agent
agent = initialize_agent(
    tools=[kubently_tool],
    llm=llm,
    agent="zero-shot-react-description"
)
```

### With AutoGen

```python
from autogen import AssistantAgent
from kubently_client import KubentlyA2AClient

class KubernetesDebugAgent(AssistantAgent):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.kubently = KubentlyA2AClient(
            base_url="http://kubently-api:8080"
        )
    
    async def debug_cluster(self, cluster_id, query):
        """Execute debugging query on cluster"""
        response = await self.kubently.send_message({
            "action": "execute_command",
            "cluster_id": cluster_id,
            "command": f"kubectl {query}"
        })
        return response["result"]
```

### With Custom AI Tools

Kubently provides REST API endpoints for AI tool integration:

```python
# Tool definition for AI agents
async def kubently_debug_tool(cluster_id: str, command: str):
    """Debug Kubernetes clusters via Kubently API"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://kubently-api:8080/debug/execute",
            json={
                "cluster_id": cluster_id,
                "command": command
            },
            headers={"X-API-Key": "YOUR_API_KEY"}
        )
        return response.json()
```

## Multi-Cluster Orchestration

### Cluster Discovery

Agents can discover available clusters:

```python
async def discover_clusters():
    response = await client.get("/clusters")
    return response.json()

# Response
{
    "clusters": [
        {
            "id": "prod-cluster",
            "name": "Production",
            "region": "us-west-2",
            "status": "healthy"
        },
        {
            "id": "staging-cluster",
            "name": "Staging",
            "region": "us-east-1",
            "status": "healthy"
        }
    ]
}
```

### Cross-Cluster Queries

Execute commands across multiple clusters:

```python
async def multi_cluster_debug(query):
    clusters = await discover_clusters()
    results = {}
    
    for cluster in clusters["clusters"]:
        response = await client.post(
            "/debug/execute",
            json={
                "cluster_id": cluster["id"],
                "command": query
            }
        )
        results[cluster["id"]] = response.json()
    
    return results
```

## Security

### Agent Authentication

Each agent must authenticate using tokens:

```yaml
# Agent token configuration
apiKeys:
  - "agent-1-token-xxx"
  - "agent-2-token-yyy"
```

### Rate Limiting

A2A requests are rate-limited per agent:
- Default: 100 requests/minute
- Configurable per agent ID

### Audit Logging

All A2A interactions are logged:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "agent_id": "agent-1",
  "action": "execute_command",
  "cluster_id": "prod-cluster",
  "command": "kubectl get pods",
  "result": "success"
}
```

## Best Practices

1. **Use Conversation IDs**: Maintain context across agent interactions
2. **Implement Retry Logic**: Handle transient failures gracefully
3. **Cache Results**: Reduce redundant cluster queries
4. **Monitor Agent Health**: Track agent availability and performance
5. **Secure Communications**: Always use TLS in production

## Example: Multi-Agent Debugging Workflow

```python
# Orchestrator agent coordinates debugging
async def debug_application_issue(namespace, app_name):
    # Step 1: Monitoring agent checks metrics
    metrics = await monitoring_agent.check_metrics(app_name)
    
    # Step 2: If issues found, logging agent gets logs
    if metrics["status"] == "unhealthy":
        logs = await logging_agent.get_recent_logs(
            namespace, app_name, last="5m"
        )
    
    # Step 3: Kubernetes agent debugs pods
    debug_info = await kubernetes_agent.debug_pods(
        namespace, 
        selector=f"app={app_name}"
    )
    
    # Step 4: AI agent analyzes all data
    analysis = await ai_agent.analyze({
        "metrics": metrics,
        "logs": logs,
        "debug_info": debug_info
    })
    
    return analysis
```

## Monitoring A2A Interactions

View A2A metrics and traces:

```bash
# Check A2A health (via main API)
curl http://kubently-api:8080/health

# Check A2A sessions
curl http://kubently-api:8080/a2a/sessions \
  -H "X-API-Key: your-api-key"
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure A2A endpoints are enabled and port 8080 is accessible
2. **Authentication Failed**: Verify agent tokens are correctly configured
3. **Timeout Errors**: Check network connectivity between agents and Kubently
4. **Rate Limit Exceeded**: Implement exponential backoff in agent code

### Debug Mode

Enable debug logging for A2A interactions:

```yaml
api:
  env:
    LOG_LEVEL: "DEBUG"
    A2A_DEBUG: "true"
```

## Next Steps

- [Multi-Agent Systems Guide](/guides/multi-agent/)
- [API Reference](/api/)
- [Security Best Practices](/guides/security/)
- [Basic Usage Guide](/guides/basic-usage/)
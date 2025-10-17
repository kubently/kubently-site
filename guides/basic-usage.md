---
layout: page
title: Basic Usage
permalink: /guides/basic-usage/
---

This guide covers the fundamental concepts and everyday usage patterns for Kubently.

## Core Concepts

### Interactive Debugging

Kubently uses an **AI-powered conversational interface** for Kubernetes debugging. Instead of memorizing kubectl commands, you describe what you're looking for in natural language.

The Kubently agent:
- **Understands** your questions in plain English
- **Plans** systematic investigations
- **Executes** kubectl commands automatically
- **Analyzes** results and provides insights
- **Tracks** investigation progress with todos

### Supported Operations

Kubently focuses on **read-only** debugging operations:

- `get` - Retrieve resources
- `describe` - Detailed resource information
- `logs` - Container logs
- `top` - Resource usage
- `explain` - Resource documentation
- `version` - Cluster version
- `cluster-info` - Cluster information

Dangerous operations (delete, create, apply, patch, etc.) are automatically blocked for safety.

### Sessions and Context

The A2A agent maintains conversation context:
- **Thread continuity**: Follows up on previous questions
- **Investigation tracking**: Uses todo lists to ensure thoroughness
- **Cluster memory**: Remembers which cluster you're debugging
- **Automatic cleanup**: Context cleared when appropriate

## Basic Workflow (CLI)

### 1. Start Debugging

```bash
# Start interactive session
kubently debug

# Or specify a cluster
kubently debug production
```

### 2. Ask Questions

Use natural language to investigate your cluster:

```bash
You> What pods are running in the kube-system namespace?

Agent> Let me check that for you...

[Tool: execute_kubectl]
cluster_id: production
command: get pods -n kube-system

I found 12 pods running in kube-system:
- coredns-5d78c9869d-abc123 (Running)
- etcd-control-plane (Running)
- kube-apiserver-control-plane (Running)
... [full output]
```

### 3. Follow Up and Investigate

The agent maintains context:

```bash
You> Are any of those pods having issues?

Agent> Let me check for any pods with problems...

[Tool: execute_kubectl]
cluster_id: production
command: get pods -n kube-system --field-selector=status.phase!=Running

Good news! All 12 pods in kube-system are Running. No issues detected.

You> What about other namespaces?

Agent> I'll check all namespaces for problematic pods...

[Tool: execute_kubectl]
cluster_id: production
command: get pods -A --field-selector=status.phase!=Running

I found 2 pods with issues:
- app-backend-7f8d9c-xyz in namespace 'default' (CrashLoopBackOff)
- prometheus-9d4e2f-def in namespace 'monitoring' (ImagePullBackOff)

Would you like me to investigate why these pods are failing?
```

## Common Usage Patterns

### Resource Discovery

```bash
You> List all deployments in the production namespace
You> Show me all services across all namespaces
You> What nodes are in my cluster?
You> List all pods with the label app=nginx
```

### Debugging Issues

```bash
You> Are there any pods crashing?
You> Show me pods that are not running
You> What events have occurred in the last 10 minutes?
You> Why is pod xyz failing?
```

### Resource Details

```bash
You> Describe the nginx deployment
You> Show me detailed information about pod abc-123
You> What's the configuration of service my-api?
You> Get the YAML for deployment backend
```

### Resource Usage

```bash
You> What's the CPU and memory usage on my nodes?
You> Show me the top 10 pods by memory usage
You> Which pods are using the most CPU?
You> What's the resource usage in namespace production?
```

### Filtering and Analysis

```bash
You> Find all pods with restarts greater than 5
You> Show me pods older than 7 days
You> List all services of type LoadBalancer
You> What pods are in pending state?
```

## A2A Integration (Multi-Agent Systems)

For multi-agent systems, Kubently implements the A2A (Agent-to-Agent) protocol.

### A2A Endpoint

```
POST http://your-kubently-api:8080/a2a/
```

### Example A2A Request

```json
{
  "jsonrpc": "2.0",
  "method": "message/stream",
  "params": {
    "message": {
      "messageId": "msg-123",
      "role": "user",
      "parts": [
        {
          "partId": "part-1",
          "text": "Check if there are any pods in crashloopbackoff in the production cluster"
        }
      ]
    }
  },
  "id": 1
}
```

### A2A Response (Server-Sent Events)

```
data: {"type": "tool_call", "tool": "execute_kubectl", "parameters": {"cluster_id": "production", "command": "get pods -A"}}
data: {"type": "content", "content": "I found 2 pods in CrashLoopBackOff state..."}
data: {"type": "done"}
```

### A2A Features

- **Streaming responses**: Real-time updates via SSE
- **Tool call visibility**: See exactly what kubectl commands are executed
- **Context management**: Multi-turn conversations with thread IDs
- **Automatic investigation**: Agent plans and executes systematic debugging

See the [Multi-Agent Integration Guide](/guides/multi-agent/) for complete A2A documentation.

## Agent Investigation Workflow

The Kubently agent follows a systematic approach:

### 1. Cluster Selection
If you don't specify a cluster, the agent will:
- List available clusters
- Ask you to choose one

### 2. Assessment Phase
The agent starts by understanding the problem:
- Gathers initial cluster state
- Identifies areas of concern
- Creates a todo list for investigation

### 3. Investigation Phase
The agent systematically checks each concern:
- Executes targeted kubectl commands
- Analyzes output for anomalies
- Updates todo list as it progresses
- Follows leads to deeper issues

### 4. Analysis Phase
The agent correlates findings:
- Identifies root causes
- Explains relationships between issues
- Suggests remediation steps

### 5. Summary
The agent provides:
- Clear explanation of problems found
- Recommended next steps
- Opportunity for follow-up questions

## Best Practices

### Effective Questions

**Good:**
- "Show me pods that are failing"
- "Why is the nginx deployment not ready?"
- "What's using the most memory?"

**Less Effective:**
- "Debug" (too vague)
- "Fix my cluster" (Kubently is read-only)
- Single-word queries (provide context)

### Investigation Tips

1. **Start broad, then narrow**: Begin with "Are there any issues?" then drill into specifics
2. **Ask follow-ups**: The agent maintains context across questions
3. **Be specific about namespaces**: If investigating a specific app, mention the namespace
4. **Request explanations**: Ask "Why?" to get deeper analysis

### Multi-Cluster Usage

```bash
# Add multiple clusters
kubently cluster add production
kubently cluster add staging
kubently cluster add development

# List clusters
kubently cluster list

# Debug specific cluster
kubently debug production
```

### Security Considerations

- Kubently is **read-only by default** - no destructive operations
- Commands are **validated** before execution
- **RBAC permissions** are enforced at the Kubernetes level
- **Dangerous verbs** (delete, create, etc.) are blocked
- Sessions use **API key authentication**

## Troubleshooting

### Agent Not Responding

```bash
# Check API connectivity
curl http://localhost:8080/health

# Check logs
kubectl logs -l app=kubently-api -n kubently
```

### No Clusters Available

```bash
# List registered clusters
kubently cluster list

# Add a cluster
kubently cluster add my-cluster

# Check cluster status
kubently cluster status my-cluster
```

### Commands Timing Out

- Check executor connectivity: `kubectl logs -l app=kubently-executor -n kubently`
- Verify network connectivity between API and executors
- Check Redis connectivity

See the [Troubleshooting Guide](/guides/troubleshooting/) for more help.

## Next Steps

- [CLI Guide](/guides/cli/) - Complete CLI documentation
- [Multi-Agent Integration](/guides/multi-agent/) - A2A protocol and multi-agent systems
- [Security Guide](/guides/security/) - Production security practices
- [API Reference](/api/) - REST API for custom integrations
- [Troubleshooting](/guides/troubleshooting/) - Common issues and solutions

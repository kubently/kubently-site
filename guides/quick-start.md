---
layout: page
title: Quick Start Guide
permalink: /guides/quick-start/
---

# Quick Start Guide

This guide will get you up and running with Kubently in under 10 minutes.

## Prerequisites

Before you begin, ensure you have:
- A running Kubernetes cluster (local or remote)
- `kubectl` configured and working
- Docker (for local development)
- Python 3.13+ (optional, for CLI tools)

## Step 1: Deploy Kubently

### Option A: Using Kind (Local Development)

```bash
# Clone the repository
git clone https://github.com/adickinson/kubently.git
cd kubently

# Create a Kind cluster with Kubently
./deployment/scripts/kind-deploy.sh
```

### Option B: Existing Kubernetes Cluster

```bash
# Clone the repository
git clone https://github.com/adickinson/kubently.git
cd kubently

# Deploy to your cluster
kubectl apply -f deployment/kubernetes/namespace.yaml
kubectl apply -f deployment/kubernetes/redis/
kubectl apply -f deployment/kubernetes/api/
kubectl apply -f deployment/kubernetes/agent/

# Generate and apply secrets
export API_KEY=$(openssl rand -base64 32)
export AGENT_TOKEN=$(openssl rand -hex 32)

kubectl create secret generic kubently-api-config \
  --from-literal=api-keys="$API_KEY" \
  --from-literal=agent-tokens='{"default":"'$AGENT_TOKEN'"}' \
  -n kubently

kubectl create secret generic kubently-agent-token \
  --from-literal=token="$AGENT_TOKEN" \
  -n kubently
```

## Step 2: Verify Installation

```bash
# Check that all pods are running
kubectl get pods -n kubently

# Wait for all pods to be Ready
kubectl wait --for=condition=Ready pod -l app=kubently-api -n kubently --timeout=300s
kubectl wait --for=condition=Ready pod -l app=kubently-agent -n kubently --timeout=300s
```

Expected output:
```
NAME                              READY   STATUS    RESTARTS   AGE
kubently-agent-7b8c9d4f5-xyz123   1/1     Running   0          2m
kubently-api-5f6d7e8g9-abc456     1/1     Running   0          2m
redis-6789abc-def012              1/1     Running   0          2m
```

## Step 3: First API Call

### Get the API Endpoint

```bash
# For Kind clusters
export API_ENDPOINT="localhost:8080"

# For other clusters, get the service endpoint
# kubectl port-forward svc/kubently-api 8080:8080 -n kubently &
# export API_ENDPOINT="localhost:8080"
```

### Create a Debug Session

```bash
# Create a debugging session
curl -X POST http://$API_ENDPOINT/debug/session \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"cluster_id": "default"}' | jq
```

Expected response:
```json
{
  "session_id": "sess_abc123def456",
  "cluster_id": "default",
  "status": "active",
  "created_at": "2024-01-20T10:30:45Z"
}
```

### Execute Your First Command

```bash
# Store the session ID
export SESSION_ID="sess_abc123def456"  # Replace with actual session ID

# Execute a kubectl command
curl -X POST http://$API_ENDPOINT/debug/execute \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "cluster_id": "default",
    "session_id": "'$SESSION_ID'",
    "command_type": "get",
    "args": ["pods", "-A", "--limit=5"]
  }' | jq
```

Expected response:
```json
{
  "result_id": "res_xyz789abc123",
  "status": "completed",
  "output": "NAMESPACE     NAME                    READY   STATUS    RESTARTS   AGE\nkube-system   coredns-558bd4d5db-abc  1/1     Running   0          5m\n...",
  "error": null,
  "execution_time_ms": 234
}
```

## Step 4: Explore More Commands

### List Nodes
```bash
curl -X POST http://$API_ENDPOINT/debug/execute \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "cluster_id": "default",
    "session_id": "'$SESSION_ID'",
    "command_type": "get",
    "args": ["nodes"]
  }'
```

### Describe a Pod
```bash
curl -X POST http://$API_ENDPOINT/debug/execute \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "cluster_id": "default",
    "session_id": "'$SESSION_ID'",
    "command_type": "describe",
    "args": ["pod", "coredns-558bd4d5db-abc", "-n", "kube-system"]
  }'
```

### Get Events
```bash
curl -X POST http://$API_ENDPOINT/debug/execute \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "cluster_id": "default",
    "session_id": "'$SESSION_ID'",
    "command_type": "get",
    "args": ["events", "--sort-by=.metadata.creationTimestamp"]
  }'
```

## Step 5: Using the CLI (Optional)

### Install the CLI
```bash
# Install from the repository
cd kubently-cli
pip install -e .

# Or install from PyPI (when available)
# pip install kubently-cli
```

### Configure the CLI
```bash
# Set up configuration
kubently config set-api-endpoint http://$API_ENDPOINT
kubently config set-api-key $API_KEY
```

### Use the CLI
```bash
# Create a session
kubently session create --cluster-id default

# Execute commands
kubently exec get pods -A
kubently exec describe node <node-name>
kubently exec get events --sort-by=.metadata.creationTimestamp

# List active sessions
kubently session list

# Close session
kubently session close <session-id>
```

## Common Patterns

### Debugging Pod Issues
```bash
# Get pods with issues
kubently exec get pods -A --field-selector=status.phase!=Running

# Describe problematic pods
kubently exec describe pod <pod-name> -n <namespace>

# Check pod logs (if available via events)
kubently exec get events --field-selector=involvedObject.name=<pod-name>
```

### Resource Investigation
```bash
# Check resource usage
kubently exec top nodes
kubently exec top pods -A

# Get resource quotas
kubently exec get resourcequota -A

# Check persistent volumes
kubently exec get pv,pvc -A
```

## Next Steps

Now that you have Kubently running:

1. **Explore the [API Reference](../api.md)** - Learn about all available endpoints
2. **Read the [Security Guide](security.md)** - Understand security best practices
3. **Try [Multi-Agent Integration](multi-agent.md)** - Connect with AI systems
4. **Set up [Monitoring](monitoring.md)** - Monitor your Kubently deployment

## Troubleshooting

### Common Issues

**Agent Not Connecting**
```bash
# Check agent logs
kubectl logs -l app=kubently-agent -n kubently

# Verify API connectivity
kubectl exec -it deploy/kubently-agent -n kubently -- \
  curl -v http://kubently-api:8080/health
```

**Authentication Errors**
```bash
# Verify your API key
echo $API_KEY

# Check API logs
kubectl logs -l app=kubently-api -n kubently | grep -i auth
```

**Session Creation Fails**
```bash
# Check API health
curl http://$API_ENDPOINT/health

# Verify Redis connectivity
kubectl logs -l app=kubently-api -n kubently | grep -i redis
```

For more troubleshooting help, see the [Troubleshooting Guide](troubleshooting.md).
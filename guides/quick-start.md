---
layout: page
title: Quick Start Guide
permalink: /guides/quick-start/
---

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
git clone https://github.com/kubently/kubently.git
cd kubently

# Create a Kind cluster with Kubently
./deployment/scripts/kind-deploy.sh
```

### Option B: Existing Kubernetes Cluster

```bash
# Clone the repository
git clone https://github.com/kubently/kubently.git
cd kubently

# Deploy to your cluster
kubectl apply -f deployment/kubernetes/namespace.yaml
kubectl apply -f deployment/kubernetes/redis/
kubectl apply -f deployment/kubernetes/api/
kubectl apply -f deployment/kubernetes/executor/

# Generate and apply secrets
export API_KEY=$(openssl rand -base64 32)
export EXECUTOR_TOKEN=$(openssl rand -hex 32)

kubectl create secret generic kubently-api-config \
  --from-literal=api-keys="$API_KEY" \
  --from-literal=executor-tokens='{"default":"'$EXECUTOR_TOKEN'"}' \
  -n kubently

kubectl create secret generic kubently-executor-token \
  --from-literal=token="$EXECUTOR_TOKEN" \
  -n kubently
```

## Step 2: Verify Installation

```bash
# Check that all pods are running
kubectl get pods -n kubently

# Wait for all pods to be Ready
kubectl wait --for=condition=Ready pod -l app=kubently-api -n kubently --timeout=300s
kubectl wait --for=condition=Ready pod -l app=kubently-executor -n kubently --timeout=300s
```

Expected output:
```
NAME                              READY   STATUS    RESTARTS   AGE
kubently-executor-7b8c9d4f5-xyz123   1/1     Running   0          2m
kubently-api-5f6d7e8g9-abc456     1/1     Running   0          2m
redis-6789abc-def012              1/1     Running   0          2m
```

## Step 3: Install and Configure the CLI

### Install the CLI

```bash
# Navigate to the CLI directory
cd kubently-cli/nodejs

# Install dependencies and build
npm install && npm run build

# Create global CLI command
npm link
```

### Configure the CLI

```bash
# Initialize configuration interactively
kubently init

# You'll be prompted for:
# - API URL: http://localhost:8080
# - API Key: (use the $API_KEY from Step 1)
```

Alternatively, use environment variables:

```bash
# Set environment variables
export KUBENTLY_API_URL="http://localhost:8080"
export KUBENTLY_API_KEY="$API_KEY"
```

## Step 4: Start Your First Debug Session

### Interactive Debugging

The easiest way to get started is with the interactive debug mode:

```bash
# Start an interactive debug session
kubently debug

# Or specify a cluster
kubently debug default
```

This opens an interactive terminal where you can ask natural language questions:

```
🚀 Kubently CLI v2.0.0

Connected to: http://localhost:8080
Cluster: default

You> What pods are running in the kube-system namespace?

Agent> Let me check that for you...

I found the following pods in the kube-system namespace:
- coredns-558bd4d5db-abc (Running)
- etcd-kind-control-plane (Running)
- kube-apiserver-kind-control-plane (Running)
...

You> Are there any pods with issues?

Agent> Checking for problematic pods across all namespaces...

All pods appear to be healthy. No pods found in CrashLoopBackOff,
Error, or Pending states.
```

### CLI Commands

You can also use discrete commands for cluster management:

```bash
# List all registered clusters
kubently cluster list

# Check cluster status
kubently cluster status default

# Add a new cluster
kubently cluster add production
```

## Common Patterns

### Debugging Pod Issues

Use the interactive CLI for natural language debugging:

```bash
kubently debug

You> Show me all pods that are not running
You> Describe the pod named <pod-name> in namespace <namespace>
You> What events are related to pod <pod-name>?
```

### Resource Investigation

Ask the agent to investigate resources:

```bash
kubently debug

You> What is the resource usage on my nodes?
You> Show me all resource quotas
You> Are there any persistent volume issues?
```

## Next Steps

Now that you have Kubently running:

1. **Read the [CLI Guide](/guides/cli/)** - Complete CLI documentation and advanced features
2. **Try [Multi-Agent Integration](/guides/multi-agent/)** - Connect with A2A multi-agent systems
3. **Read the [Security Guide](/guides/security/)** - Understand security best practices
4. **Explore the [API Reference](/api/)** - REST API documentation for custom integrations
5. **Review [Troubleshooting](/guides/troubleshooting/)** - Common issues and solutions

## Troubleshooting

### Common Issues

**Executor Not Connecting**
```bash
# Check executor logs
kubectl logs -l app=kubently-executor -n kubently

# Verify API connectivity
kubectl exec -it deploy/kubently-executor -n kubently -- \
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

For more troubleshooting help, see the [Troubleshooting Guide](/guides/troubleshooting/).
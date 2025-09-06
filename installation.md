---
layout: page
title: Installation
permalink: /installation/
---

# Installation Guide

This guide covers installing Kubently in various environments, from local development to production clusters.

<div class="alert alert-info">
💡 <strong>Quick Start:</strong> New to Kubently? Check out our <a href="/guides/quick-start/">Quick Start Guide</a> for the fastest way to get running!
</div>

## Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- Helm 3.x installed (recommended)
- Docker for building images (optional)

## Installation Methods

### Method 1: Helm Chart (Recommended)

#### Quick Install

```bash
# Add Redis dependency
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Create namespace
kubectl create namespace kubently

# Deploy Kubently with default settings
helm install kubently ./deployment/helm/kubently \
  --namespace kubently \
  --set api.image.tag=sse \
  --set executor.image.tag=sse
```

#### Production Install

```bash
# Generate secure API key
export API_KEY=$(openssl rand -hex 32)

# Create values file
cat > values-prod.yaml <<EOF
api:
  replicaCount: 3  # Horizontal scaling
  image:
    repository: kubently/api
    tag: sse
  resources:
    requests:
      cpu: 250m
      memory: 384Mi
    limits:
      cpu: 1000m
      memory: 768Mi

executor:
  image:
    repository: kubently/executor
    tag: sse
  env:
    EXECUTOR_TYPE: sse  # Use SSE for instant delivery
    LOG_LEVEL: INFO

redis:
  enabled: true
  master:
    persistence:
      enabled: true
      size: 8Gi
EOF

# Deploy with production values
helm upgrade --install kubently ./deployment/helm/kubently \
  --namespace kubently \
  --values values-prod.yaml
```

### Method 2: Kubernetes Manifests

```bash
# Clone the repository
git clone https://github.com/your-org/kubently.git
cd kubently

# Deploy Redis
kubectl apply -f deployment/kubernetes/redis/

# Deploy the API service (with SSE support)
kubectl apply -f deployment/kubernetes/api/

# Deploy the Executor 
kubectl apply -f deployment/kubernetes/executor/

# Verify deployment
kubectl get pods -n kubently
```

### Method 3: Docker Compose (Development)

```bash
# Clone and navigate to the project
git clone https://github.com/your-org/kubently.git
cd kubently

# Start with Docker Compose
docker-compose -f deployment/docker-compose.yaml up -d

# Verify services are running
docker-compose ps
```

### Method 4: Kind Cluster (Local Testing)

```bash
# Create Kind cluster
kind create cluster --config deployment/kind-config.yaml

# Deploy using the convenience script
./deployment/scripts/kind-deploy.sh
```

## Configuration

### Environment Variables

#### API Service Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `KUBENTLY_REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `KUBENTLY_API_PORT` | API service port | `8080` |
| `KUBENTLY_API_KEYS` | Comma-separated API keys | Required |
| `KUBENTLY_EXECUTOR_TOKENS` | JSON map of cluster to tokens | Required |

#### Executor Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `KUBENTLY_API_URL` | Central API URL | Required |
| `CLUSTER_ID` | Unique cluster identifier | Required |
| `KUBENTLY_TOKEN` | Authentication token | Required |
| `POLL_INTERVAL` | Normal polling interval (seconds) | `10` |
| `FAST_POLL_INTERVAL` | Active session polling (seconds) | `0.5` |

### Creating Secrets

#### Generate API Keys and Executor Tokens

```bash
# Generate API keys
export API_KEY=$(openssl rand -base64 32)
export EXECUTOR_TOKEN=$(openssl rand -hex 32)

echo "API Key: $API_KEY"
echo "Executor Token: $EXECUTOR_TOKEN"
```

#### Create Kubernetes Secrets

```bash
# Create API secret
kubectl create secret generic kubently-api-config \
  --from-literal=api-keys="$API_KEY" \
  --from-literal=executor-tokens='{"cluster-1":"'$EXECUTOR_TOKEN'"}' \
  -n kubently

# Create executor secret
kubectl create secret generic kubently-executor-token \
  --from-literal=token="$EXECUTOR_TOKEN" \
  -n kubently
```

## Verification

### Test the Installation

```bash
# Get the API endpoint
export API_ENDPOINT=$(kubectl get service kubently-api -n kubently -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Create a debugging session
curl -X POST http://$API_ENDPOINT:8080/debug/session \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"cluster_id": "cluster-1"}'

# Execute a test command
curl -X POST http://$API_ENDPOINT:8080/debug/execute \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "cluster_id": "cluster-1",
    "session_id": "session-id-from-above",
    "command_type": "get",
    "args": ["pods", "-A", "--limit=5"]
  }'
```

### Health Checks

```bash
# Check API health
curl http://$API_ENDPOINT:8080/health

# Check executor logs
kubectl logs -l app=kubently-executor -n kubently

# Check Redis connection
kubectl logs -l app=kubently-api -n kubently | grep -i redis
```

## Troubleshooting

### Common Issues

#### Executor Not Connecting
```bash
# Check executor logs
kubectl logs -l app=kubently-executor -n kubently

# Verify network connectivity
kubectl exec -it deploy/kubently-executor -n kubently -- \
  curl -v http://kubently-api:8080/health
```

#### API Authentication Errors
```bash
# Verify API keys are correctly configured
kubectl get secret kubently-api-config -n kubently -o yaml

# Check API logs for authentication errors
kubectl logs -l app=kubently-api -n kubently | grep -i auth
```

#### Redis Connection Issues
```bash
# Check Redis status
kubectl get pods -l app=redis -n kubently

# Test Redis connectivity
kubectl exec -it deploy/kubently-api -n kubently -- \
  redis-cli -h redis ping
```

## Security Considerations

1. **API Keys**: Use strong, unique API keys for each client
2. **Executor Tokens**: Generate unique tokens for each cluster
3. **Network Security**: Consider network policies to restrict traffic
4. **RBAC**: Review and customize the executor's Kubernetes permissions
5. **TLS**: Enable TLS/SSL for production deployments

## Next Steps

- [Quick Start Guide](guides/quick-start.md) - Learn basic usage
- [API Reference](api.md) - Explore the full API
- [Architecture](architecture.md) - Understand the system design
- [Security Guide](guides/security.md) - Security best practices
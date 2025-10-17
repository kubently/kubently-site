---
layout: page
title: Installation
permalink: /installation/
---

This guide covers installing Kubently in various environments, from local development to production clusters.

<div class="alert alert-info">
💡 <strong>Quick Start:</strong> New to Kubently? Check out our <a href="/guides/quick-start/">Quick Start Guide</a> for the fastest way to get running!
</div>

## Prerequisites

- Kubernetes cluster (1.28+) or Kind for local testing
- kubectl configured
- Helm 3.x installed (required for Helm deployment)
- At least one LLM API key (Google, Anthropic, OpenAI, or any LLMFactory-supported provider)

## Installation Methods

### Method 1: Helm Chart (Recommended)

<div class="alert alert-warning">
⚠️ <strong>Security Note:</strong> While TLS is sufficient for securing connections, we strongly recommend keeping the ingress restricted to non-public IP addresses until the authentication/authorization system is more mature.
</div>

#### Quick Install with Test Script

```bash
# Set your LLM API key (at least one required)
# Supports any LLMFactory-compatible provider:
export GOOGLE_API_KEY=your-api-key      # For Google LLMs
# OR
export ANTHROPIC_API_KEY=your-api-key   # For Claude
# OR
export OPENAI_API_KEY=your-api-key      # For GPT models

# Deploy using the test script (includes TLS setup)
./deploy-test.sh

# Test the deployment
./test-a2a.sh
```

#### Manual Helm Install

```bash
# Create namespace
kubectl create namespace kubently

# Create LLM API key secret
kubectl create secret generic llm-api-keys \
  --from-literal=google-key=$GOOGLE_API_KEY \
  --namespace kubently

# Deploy Kubently with test values
helm install kubently ./deployment/helm/kubently \
  --namespace kubently \
  --values deployment/helm/test-values.yaml
```

#### Production Install

```bash
# Set LLM API keys (choose your provider)
export GOOGLE_API_KEY=your-api-key  # Or use ANTHROPIC_API_KEY/OPENAI_API_KEY
export API_KEY=$(openssl rand -hex 32)

# Create production values file
cat > values-prod.yaml <<EOF
# TLS Configuration (strongly recommended)
tls:
  enabled: true
  mode: "internal"  # Use "external" for public certificates

api:
  replicaCount: 3  # Horizontal scaling
  apiKeys:
    - "$API_KEY"  # Add multiple keys as needed
  resources:
    requests:
      cpu: 250m
      memory: 384Mi
    limits:
      cpu: 1000m
      memory: 768Mi

executor:
  enabled: true
  replicaCount: 1
  # Configure RBAC security mode
  rbacRules: []  # Will use default read-only rules

kubentlyExecutor:
  securityMode: "readOnly"  # Options: readOnly, extendedReadOnly, fullAccess
  commandWhitelist:
    enabled: true
    maxArguments: 20
    timeoutSeconds: 30

redis:
  enabled: true
  master:
    persistence:
      enabled: true
      size: 8Gi

ingress:
  enabled: false  # Keep disabled for internal access only
  # If you must enable, restrict to private IPs:
  # annotations:
  #   nginx.ingress.kubernetes.io/whitelist-source-range: "10.0.0.0/8,172.16.0.0/12"
EOF

# Create LLM secret
kubectl create secret generic llm-api-keys \
  --from-literal=google-key=$GOOGLE_API_KEY \
  --namespace kubently

# Deploy with production values
helm upgrade --install kubently ./deployment/helm/kubently \
  --namespace kubently \
  --values values-prod.yaml
```

### Method 2: Kubernetes Manifests

```bash
# Clone the repository
git clone https://github.com/kubently/kubently.git
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

### Method 3: Kind Cluster (Local Testing)

```bash
# Create Kind cluster with specific configuration
kind create cluster --name kubently --config deployment/kind-config.yaml

# Set context
kubectl config use-context kind-kubently

# Deploy using the test script (set one of these)
export GOOGLE_API_KEY=your-api-key     # Or ANTHROPIC_API_KEY, OPENAI_API_KEY
./deploy-test.sh

# Port-forward for local access
kubectl port-forward -n kubently svc/kubently-api 8080:8080
```

### Method 4: Docker Compose (Development)

```bash
# Clone and navigate to the project
git clone https://github.com/kubently/kubently.git
cd kubently

# Start with Docker Compose
docker-compose -f deployment/docker-compose.yaml up -d

# Verify services are running
docker-compose ps
```


## Configuration

### Environment Variables

#### API Service Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection URL | `redis://redis:6379` |
| `PORT` | API service port | `8080` |
| `API_PORT` | API port (same as PORT) | `8080` |
| `A2A_ENABLED` | Enable A2A protocol | `true` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `SESSION_TTL` | Session time-to-live | `300` |
| `MAX_COMMANDS_PER_FETCH` | Commands per fetch | `10` |
| `COMMAND_TIMEOUT` | Command timeout (seconds) | `30` |

#### Executor Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `KUBENTLY_API_URL` | Central API URL | Required |
| `CLUSTER_ID` | Unique cluster identifier | Namespace name |
| `KUBENTLY_TOKEN` | Authentication token | Auto-generated |
| `LOG_LEVEL` | Logging level | `INFO` |

#### LLM Configuration (Required - at least one)

| Variable | Description | Provider |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Google API key | Google LLM models |
| `ANTHROPIC_API_KEY` | Anthropic API key | Claude models |
| `OPENAI_API_KEY` | OpenAI API key | GPT models |

Kubently uses the cnoe_agent_utils LLMFactory to support multiple LLM providers. You only need to configure one provider, and the system will automatically use the available LLM. The LLMFactory currently integrates Google, Anthropic, and OpenAI providers, with support for additional providers as they are added to cnoe_agent_utils.

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

#### Using the CLI

The Kubently CLI provides an interactive terminal interface for debugging Kubernetes clusters. For complete installation instructions and usage guide, see the [CLI Guide](/guides/cli/).

**Quick Test:**

```bash
# Install the Node.js CLI
cd kubently-cli/nodejs
npm install && npm run build && npm link

# Initialize configuration
kubently init

# Start debugging
kubently debug
```

See the [CLI Guide](/guides/cli/) for detailed documentation on all CLI commands and features.

#### Using the Test Automation

```bash
# Run comprehensive test suite
cd test-automation
./run_tests.sh --api-key test-api-key

# Run specific scenario
./run_tests.sh test-and-analyze --api-key test-api-key --scenario 14-service-port-mismatch
```

#### Using Direct API Calls

```bash
# Port-forward if needed
kubectl port-forward -n kubently svc/kubently-api 8080:8080 &

# Test A2A endpoint
curl -X POST http://localhost:8080/a2a/sessions \
  -H "X-API-Key: test-api-key" \
  -H "Content-Type: application/json" \
  -d '{"query": "check if there are any pods in crashloopbackoff"}'
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

<div class="alert alert-warning">
⚠️ <strong>Important:</strong> While TLS provides secure communication, we strongly recommend keeping the ingress restricted to non-public IP addresses until the authentication/authorization system is more mature.
</div>

1. **API Keys**: Use strong, unique API keys for each client (X-API-Key header)
2. **Executor Tokens**: Automatically generated or manually configured per cluster
3. **Network Security**: Keep ingress on private IPs only for now
4. **RBAC**: Fully configurable via Helm values - defaults to read-only
5. **TLS**: Enabled by default with cert-manager integration
6. **OAuth/OIDC**: Supported for enterprise authentication
7. **Command Whitelisting**: Dynamic security modes (readOnly, extendedReadOnly, fullAccess)

## Next Steps

- [Quick Start Guide](/guides/quick-start/) - Learn basic usage
- [API Reference](/api/) - Explore the full API
- [Architecture](/architecture/) - Understand the system design
- [Security Guide](/guides/security/) - Security best practices
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
- Node.js 18+ (if installing CLI from source)

## Installation Methods

### Method 1: Helm Chart (Recommended)

<div class="alert alert-warning">
⚠️ <strong>Security Note:</strong> While TLS is supported, we strongly recommend keeping the ingress restricted to non-public IP addresses until the authentication/authorization system is more mature.
</div>

#### 1. Create Namespace and Secrets

First, create the namespace and necessary secrets for LLM API keys and Redis authentication.

```bash
# Create namespace
kubectl create namespace kubently

# 1. Create LLM API keys secret
# Supports any LLMFactory-compatible provider. Set at least one.
kubectl create secret generic kubently-api-keys \
  --from-literal=GOOGLE_API_KEY=your-google-key \
  --from-literal=ANTHROPIC_API_KEY=your-anthropic-key \
  --from-literal=OPENAI_API_KEY=your-openai-key \
  --namespace kubently

# 2. Create Redis password secret (Recommended)
kubectl create secret generic kubently-redis-password \
  --from-literal=password="$(openssl rand -base64 32)" \
  --namespace kubently
```

#### 2. Configure Helm Values

Create a `values.yaml` file to configure your deployment. Here is a minimal example:

```yaml
# values.yaml
api:
  # Configure your preferred LLM provider
  env:
    LLM_PROVIDER: "anthropic-claude" # or "openai", "google-gemini"
    LOG_LEVEL: "INFO"
  
  # Reference the secret created above
  existingSecret: "kubently-api-keys"

redis:
  enabled: true
  auth:
    enabled: true
    existingSecret: "kubently-redis-password"

executor:
  enabled: true
  security:
    mode: "readOnly" # Options: readOnly, extendedReadOnly, fullAccess
```

#### 3. Install with Helm

Deploy Kubently using the Helm chart located in the repository:

```bash
# Clone the repository if you haven't already
git clone https://github.com/kubently/kubently.git
cd kubently

# Install the chart
helm install kubently ./deployment/helm/kubently \
  --namespace kubently \
  --values values.yaml
```

### Method 2: Kubernetes Manifests (Generated)

If you prefer using raw Kubernetes manifests (YAML files) instead of Helm, you can generate them from the Helm chart.

```bash
# Clone the repository
git clone https://github.com/kubently/kubently.git
cd kubently

# Generate manifests
helm template kubently ./deployment/helm/kubently \
  --namespace kubently \
  --values values.yaml \
  > kubently-manifests.yaml

# Apply to cluster
kubectl create namespace kubently
kubectl apply -f kubently-manifests.yaml
```

### Method 3: Kind Cluster (Local Testing)

For local development and testing, you can use Kind (Kubernetes in Docker).

```bash
# Create a Kind cluster
kind create cluster --name kubently --config deployment/kind-config.yaml

# Create namespace
kubectl create namespace kubently

# Create secrets (replace with your actual keys)
kubectl create secret generic kubently-api-keys \
  --from-literal=ANTHROPIC_API_KEY=your-key \
  --namespace kubently

kubectl create secret generic kubently-redis-password \
  --from-literal=password="local-dev-password" \
  --namespace kubently

# Deploy using Helm (using default values is fine for local testing)
helm install kubently ./deployment/helm/kubently \
  --namespace kubently \
  --set api.existingSecret=kubently-api-keys \
  --set redis.auth.existingSecret=kubently-redis-password

# Port-forward for local access
kubectl port-forward -n kubently svc/kubently-api 8080:8080
```

### Method 4: Docker Compose (Development)

Ideal for purely local development without a full Kubernetes cluster.

```bash
# Clone and navigate to the project
git clone https://github.com/kubently/kubently.git
cd kubently

# Create a .env file with your API keys
echo "ANTHROPIC_API_KEY=your-key" > .env

# Start with Docker Compose
docker-compose -f deployment/docker-compose.yaml up -d

# Verify services are running
docker-compose -f deployment/docker-compose.yaml ps
```

## CLI Installation

The Kubently CLI provides an interactive terminal interface for debugging.

### Install from NPM (Recommended)

```bash
npm install -g @kubently/cli
```

Or using npx (no installation required):

```bash
npx @kubently/cli
```

### Install from Source

If you want to contribute or use the latest development version:

```bash
# Clone the repository
git clone https://github.com/kubently/kubently.git
cd kubently/kubently-cli/nodejs

# Install dependencies and build
npm install
npm run build

# Link globally
npm link
```

## Configuration

### Environment Variables

These variables are configured in your `values.yaml` under `api.env` or passed to the container directly.

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_PROVIDER` | Selected LLM Provider | `anthropic-claude` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `PORT` | API service port | `8080` |
| `A2A_ENABLED` | Enable A2A protocol | `true` |
| `SESSION_TTL` | Session time-to-live | `300` |
| `MAX_COMMANDS_PER_FETCH` | Commands per fetch | `10` |
| `COMMAND_TIMEOUT` | Command timeout (seconds) | `30` |

### Executor Configuration

The Executor runs within the cluster to execute commands. Configure these in `values.yaml` under `executor`.

| Parameter | Description | Default |
|-----------|-------------|---------|
| `executor.security.mode` | Security level (`readOnly`, `extendedReadOnly`, `fullAccess`) | `readOnly` |
| `executor.clusterId` | Unique ID for the cluster (defaults to namespace if empty) | `""` |
| `executor.token` | Authentication token (optional, auto-generated/managed by secret) | `""` |

### LLM Providers

Kubently supports multiple LLM providers via the `cnoe_agent_utils` LLMFactory.

| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | For Google Gemini models |
| `ANTHROPIC_API_KEY` | For Anthropic Claude models |
| `OPENAI_API_KEY` | For OpenAI GPT models |

You must provide at least one API key via Kubernetes Secrets.

## Verification

### Test the Installation

#### Using the CLI

```bash
# Initialize configuration
kubently init

# Start debugging
kubently debug
```

#### Health Checks

```bash
# Check API health (requires port-forward)
curl http://localhost:8080/health

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

#### Redis Connection Issues
```bash
# Check Redis status
kubectl get pods -l app=redis -n kubently

# Test Redis connectivity
kubectl exec -it deploy/kubently-api -n kubently -- \
  redis-cli -h redis ping
```

## Security Considerations

1. **API Keys**: Use Kubernetes Secrets for all sensitive keys.
2. **Executor Tokens**: Managed via Secrets; rotate if compromised.
3. **Network Security**: Keep ingress internal or behind VPN/Authentication until OAuth is configured.
4. **RBAC**: The Helm chart allows defining custom `executor.rbacRules`.
5. **Command Whitelisting**: Use `readOnly` mode for lowest privilege.

## Next Steps

- [Quick Start Guide](/guides/quick-start/) - Learn basic usage
- [API Reference](/api/) - Explore the full API
- [Architecture](/architecture/) - Understand the system design
- [Security Guide](/guides/security/) - Security best practices
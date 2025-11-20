---
layout: page
title: Quick Start Guide
permalink: /guides/quick-start/
---

This guide will get you up and running with Kubently in under 10 minutes.

## Prerequisites

Before you begin, ensure you have:
- Docker (for local development)
- Kubernetes cluster & Helm (if deploying to Kubernetes)
- Node.js 18+ (for the CLI)

## Step 1: Deploy Kubently

Choose the option that best fits your needs.

### Option 1: Local Development (Docker Compose)

The fastest way to run Kubently locally without a Kubernetes cluster.

```bash
# Clone the repository
git clone https://github.com/kubently/kubently.git
cd kubently

# Create a .env file with your API key (e.g., Anthropic, OpenAI, or Google)
echo "ANTHROPIC_API_KEY=your-key-here" > .env

# Start the services
docker-compose -f deployment/docker-compose.yaml up -d

# Verify services are running
docker-compose -f deployment/docker-compose.yaml ps
```

### Option 2: Kubernetes (Helm)

Deploy to Kind or any standard Kubernetes cluster.

```bash
# Clone the repository
git clone https://github.com/kubently/kubently.git
cd kubently

# Create namespace
kubectl create namespace kubently

# Create API Key Secret
kubectl create secret generic kubently-api-keys \
  --from-literal=ANTHROPIC_API_KEY=your-key \
  --namespace kubently

# Install with Helm
helm install kubently ./deployment/helm/kubently \
  --namespace kubently \
  --set api.existingSecret=kubently-api-keys
```

## Step 2: Verify Installation

Ensure the system is running and healthy.

**If using Docker Compose:**
```bash
# Check API health
curl http://localhost:8080/health
```

**If using Kubernetes:**
```bash
# Wait for pods to be ready
kubectl wait --for=condition=Ready pod -l app.kubernetes.io/name=kubently -n kubently --timeout=300s

# Port-forward the API
kubectl port-forward -n kubently svc/kubently-api 8080:8080
```

## Step 3: Install and Configure the CLI

### Install the CLI

```bash
# Install globally via NPM
npm install -g @kubently/cli
```

### Configure the CLI

```bash
# Initialize configuration interactively
kubently init

# You'll be prompted for:
# - API URL: http://localhost:8080 (default)
# - API Key: (Leave blank if using Docker Compose/Helm defaults for dev)
```

## Step 4: Start Your First Debug Session

### Interactive Debugging

Start an interactive session to troubleshoot your cluster:

```bash
# Start debug mode
kubently debug
```

You can now ask natural language questions like:

> "What pods are running in the kube-system namespace?"
> "Are there any pods in a CrashLoopBackOff state?"
> "Check the logs for the api-server pod."

### CLI Commands

Use discrete commands for quick checks:

```bash
# List registered clusters
kubently cluster list

# Check status
kubently cluster status default
```

## Next Steps

Now that you have Kubently running:

1. **Read the [Installation Guide](/installation/)** - For production deployment details.
2. **Read the [CLI Guide](/guides/cli/)** - Complete CLI documentation.
3. **Explore the [API Reference](/api/)** - Build custom integrations.
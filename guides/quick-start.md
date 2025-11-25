---
layout: page
title: Quick Start Guide
permalink: /guides/quick-start/
---

This guide will get you up and running with Kubently in under 10 minutes.

## Prerequisites

Before you begin, ensure you have:
- A Kubernetes cluster (Kind, Minikube, EKS, GKE, etc.)
- `kubectl` and `helm` installed
- Node.js 18+ (for the CLI)

## Step 1: Deploy Kubently

We recommend deploying Kubently via Helm.

```bash
# Clone the repository to get the chart
git clone https://github.com/kubently/kubently.git
cd kubently

# Create namespace
kubectl create namespace kubently

# Create API Key Secret (Replace with your actual key)
# Supported providers: ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY
kubectl create secret generic kubently-api-keys \
  --from-literal=ANTHROPIC_API_KEY=sk-ant-...
  --namespace kubently

# Install with Helm
helm install kubently ./deployment/helm/kubently \
  --namespace kubently \
  --set api.existingSecret=kubently-api-keys
```

## Step 2: Verify Installation

Ensure the system is running and healthy.

```bash
# Wait for pods to be ready
kubectl wait --for=condition=Ready pod -l app.kubernetes.io/name=kubently -n kubently --timeout=300s

# Port-forward the API (to make it accessible to the CLI)
kubectl port-forward -n kubently svc/kubently-api 8080:8080
```

> **Note:** In a production environment, you would typically expose the service via an Ingress rather than using port-forwarding.

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
# - API Key: (Leave blank if you haven't configured CLI-specific auth yet)
```

## Step 4: Start Your First Debug Session

### Interactive Debugging

Start an interactive session to troubleshoot your cluster:

```bash
# Start debug mode
kubently debug
```

![Kubently Debug Session](/assets/images/cli-screenshot-debug.svg)

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

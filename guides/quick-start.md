---
layout: page
title: Self-Hosted Quick Start
subtitle: The full open-source stack in your own cluster — one command.
permalink: /guides/quick-start/
---

Get from an empty cluster to a working AI debug chat in about a minute, with
everything running in your cluster under your control. Self-hosted Kubently
is the full engine under Apache-2.0 — **free forever**, every capability, no
feature gates. It is a first-class way to run Kubently, not a demo of the
paid one.

<div class="alert alert-info">
☁️ Don't want to run the control plane yourself? The
<a href="/docs/cloud-quickstart/">Cloud quickstart</a> gets you the same
engine with a managed control plane and a free tier — you install only the
outbound-only executor.
</div>

## Prerequisites

- A Kubernetes cluster (Kind, Minikube, EKS, GKE, etc.) with `kubectl` pointed at it
- `helm` 3.x and Node.js 18+ installed
- An LLM API key (Anthropic, OpenAI, or Google)

## The one-command path

```bash
npm install -g @kubently/cli
kubently install
```

That's it. The installer:

1. Creates the `kubently` namespace and all secrets (API keys, Redis password, LLM key)
2. Installs the Helm chart from the published repo (API + Redis + executor)
3. Waits for the executor to connect, port-forwards the API
4. Saves your CLI config and drops you straight into a debug chat

It reads your LLM key from `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_API_KEY`,
or prompts for it. Useful flags:

```bash
kubently install --provider openai        # pick your LLM provider
kubently install --yes --no-chat          # non-interactive (CI, scripts)
kubently install --cluster-id prod-east   # name the cluster yourself
kubently install --help                   # everything else
```

## Start debugging

The installer ends in a chat session. To come back later:

```bash
kubectl -n kubently port-forward svc/kubently-api 8080:8080 &
kubently debug
```

Ask natural language questions like:

> "What pods are running in the kube-system namespace?"
> "Are there any pods in a CrashLoopBackOff state?"
> "Check the logs for the api-server pod."

## Use it from Claude Code or Cursor

Kubently is also an MCP server — add it to your AI editor in one line:

```bash
claude mcp add kubently -- kubently mcp
```

See the [MCP guide](https://github.com/kubently/kubently/blob/main/docs/MCP.md) for
Cursor and generic client config.

## Prefer to do it by hand?

The installer is just automation over the standard Helm flow. For manual
installation, production values, TLS, and multi-cluster executor setup, see the
[Installation Guide](/installation/).

## Turn on the good stuff

The install above gives you chat-driven diagnosis with read-only kubectl.
Most of Kubently's value comes from wiring in more evidence and letting it
work proactively — each is one or two Helm values:

- **[Metrics & logs](/guides/observability/)** — `prometheus.url`, `loki.url`
- **[Change correlation](/guides/change-correlation/)** — Helm + ArgoCD history
- **[Alert-triggered diagnosis](/guides/alerts/)** — Alertmanager → diagnosed RCA in Slack
- **[CI/CD verification](/guides/cicd/)** and **[scheduled checks](/guides/scheduled-checks/)**
- **[Cloud telemetry](/guides/cloud-telemetry/)** — workload identity, zero stored credentials

## Next Steps

1. **Read the [Installation Guide](/installation/)** — production deployment details.
2. **Read the [CLI Guide](/guides/cli/)** — complete CLI documentation.
3. **Explore the [API Reference](/api/)** — build custom integrations.

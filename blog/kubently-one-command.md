---
layout: page
title: "Kubently 2.3: one command to install, MCP everywhere, and alerts that arrive pre-diagnosed"
permalink: /blog/kubently-2-3/
---

*August 2026*

Kubently's job has always been simple to say: **debug Kubernetes clusters by talking to them**. This release is about removing everything that stood between you and that conversation.

## One command, ~75 seconds

The old quickstart was ten manual steps — namespace, three secrets, hand-written values, port-forwards. It's now:

```bash
npm install -g @kubently/cli
kubently install
```

The installer creates the namespace and secrets, installs the published Helm chart (API + Redis + executor), waits for the executor to connect, and drops you straight into a debug chat. On a fresh kind cluster it clocks in at about **75 seconds**, image pulls included. Reruns are idempotent.

```
kubently> why is my nginx pod crashlooping?
```

## Kubently in your editor, via MCP

Kubently is now listed in the [official MCP registry](https://registry.modelcontextprotocol.io) as `io.github.kubently/kubently`, and the CLI ships a stdio bridge so adding it to Claude Code is one line:

```bash
claude mcp add kubently -- kubently mcp
```

Your AI client gets a single natural-language tool — `ask_kubently` — and Kubently's own agent does the investigation: planning, running read-only kubectl across your fleet, and returning a synthesized answer. Cursor and any other MCP client work the same way over streamable HTTP.

## Proactive diagnosis: Alertmanager → Slack

The feature we're most excited about. Point Alertmanager at Kubently's new webhook and set a Slack incoming-webhook URL:

```yaml
receivers:
  - name: kubently
    webhook_configs:
      - url: https://<your-kubently-host>/webhooks/alertmanager
```

Every firing alert gets diagnosed by the agent in the background, and the root-cause analysis lands in Slack — often before you've opened your laptop. In our testing the agent even correctly identified a synthetic always-firing alert as a canary and recommended no action. That's the difference between an alert and an answer.

## The boring-but-important parts

- Helm chart now published at `https://kubently.github.io/kubently` (no more cloning the repo to install)
- Multi-arch images (amd64 + arm64) publish automatically from `main`
- `api.enabled` now defaults to true — a default `helm install` deploys the full stack
- CLI 2.3.1 on npm with first-class unit test coverage

## Get started

```bash
npm install -g @kubently/cli
kubently install
```

Kubently is Apache-2.0 licensed and [open source on GitHub](https://github.com/kubently/kubently). Read-only by default, executor whitelist + RBAC enforced, works with Anthropic, OpenAI, and Google models.

*Questions or feedback? [Open an issue](https://github.com/kubently/kubently/issues) — we'd love to hear how it goes.*

---
layout: page
title: Reference
subtitle: Configuration surfaces, APIs, and system design.
permalink: /docs/reference/
---

Reference material for operating Kubently. The canonical, always-current
source for engine configuration is the open-source repo — pages here give you
the shape of each surface and link to the authoritative files.

## Configuration

- **[Environment variables](/docs/reference/environment-variables/)** — every env var for the API server and executor, grouped by feature.
- **[Helm chart](/docs/reference/helm/)** — chart layout and the values that switch features on.
- **[Installation](/installation/)** — install methods, secrets, and verification for self-hosted deployments.

## APIs & protocols

- **[API Reference](/api/)** — REST endpoints, webhooks, A2A, and MCP.
- **[MCP guide (upstream)](https://github.com/kubently/kubently/blob/main/docs/MCP.md)** — connect Claude Code, Cursor, or any MCP client.
- **[A2A configuration (upstream)](https://github.com/kubently/kubently/blob/main/docs/A2A_CONFIGURATION.md)** — agent-to-agent interop.

## System design

- **[Architecture](/architecture/)** — components, data flow, and the outbound-only executor model.
- **[Security model](/guides/security/)** — allowlists, RBAC, auth, and hardening.
- **[Upstream docs directory](https://github.com/kubently/kubently/tree/main/docs)** — deployment, TLS, OAuth, tracing, and more.

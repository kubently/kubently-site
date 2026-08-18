---
layout: page
title: Integrations (BYO-MCP)
subtitle: Your observability tools, inside the investigation.
permalink: /cloud/integrations/
---

{% include cloud-badge.html %} Kubently can consume tools from **your**
MCP servers — Grafana Cloud, Datadog, or any server speaking streamable-HTTP
MCP — and use them as evidence sources alongside kubectl, Prometheus, logs,
and change history. Your dashboards' data joins the investigation without
Kubently needing product-specific connectors.

- **Managed per-tenant OAuth.** In Kubently Cloud you connect a provider
  from the dashboard; the OAuth grant is stored per tenant and scoped to
  your org. A [Team-plan](/pricing/) feature.
- **Read-scoped by policy.** Connect read-scoped servers; tool
  descriptions and results from third-party servers are treated as untrusted
  input by the engine (sanitized, marked, size-capped).
- **Degrades gracefully.** An unreachable server means those tools are
  simply unavailable — investigations continue on the native evidence
  sources.

## Self-hosted equivalent

The engine supports the same external-MCP mechanism with static
configuration — `mcpServers` in Helm values (bearer tokens referenced from
secrets), or `KUBENTLY_MCP_SERVERS` directly. See the upstream
[MCP client tools doc](https://github.com/kubently/kubently/blob/main/docs/MCP_CLIENT_TOOLS.md).

```yaml
# Helm values (self-hosted)
mcpServers:
  - name: grafana
    url: https://mcp.grafana.example.com/mcp
    bearer_token_env: GRAFANA_MCP_TOKEN
```

<div class="alert alert-info">
📝 Per-provider connection walkthroughs (Grafana Cloud, Datadog) are being
written. The dashboard's integrations page at
<a href="https://cloud.kubently.io">cloud.kubently.io</a> lists currently
supported providers.
</div>

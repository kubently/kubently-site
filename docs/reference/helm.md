---
layout: page
title: Helm Chart
subtitle: Chart layout and the values that switch features on.
permalink: /docs/reference/helm/
---

<div class="alert alert-info">
📌 The canonical reference is the chart itself:
<a href="https://github.com/kubently/kubently/blob/main/deployment/helm/kubently/values.yaml">deployment/helm/kubently/values.yaml</a>
(fully commented) plus the
<a href="https://github.com/kubently/kubently/tree/main/deployment/helm/kubently/examples">examples directory</a>.
</div>

```bash
helm repo add kubently https://kubently.github.io/kubently
helm repo update
```

Self-hosted deployments install the full chart (API + Redis + executor).
Kubently Cloud users install only the executor with the tenant token from the
dashboard — see the [Cloud quickstart](/docs/cloud-quickstart/).

## Top-level values map

| Values block | What it controls |
|--------------|------------------|
| `api` | The API server: LLM provider env, client API keys, Slack webhook (secret-sourced via `api.slackWebhook.existingSecret`) |
| `executor` | In-cluster executor: `clusterId`, `apiUrl`, token, security mode (`readOnly` default), RBAC rules, `executor.cloud.*` for workload-identity cloud telemetry (default off) |
| `redis` | Bundled Redis (pub/sub, sessions, memory, incident history) |
| `prometheus` / `loki` | One URL each; setting it wires the executor env **and** registers the agent tool — unset means the tool doesn't exist |
| `changeCorrelation` | Helm release history (`helmHistory.enabled`) and ArgoCD sync history (`argocd.url` + `existingSecret`) as change-timeline sources |
| `runbooks` | Operator runbooks as values → ConfigMap; hot-reloaded, no pod restart |
| `fleetReport` | Scheduled fleet health digest CronJob (`enabled`, `schedule`, `query`) |
| `scheduledChecks` | Named cron-scheduled investigations; PASS is silent unless `notifyOnPass` |
| `verifyDeployment` | Post-deploy verification; `watch` mode verifies labeled workloads with zero CI changes |
| `mcpServers` | External MCP tool servers (Grafana Cloud, Datadog, …) as evidence sources |
| `gitRemediation` | GitOps propose-only PR remediation — **default off**; repo-scoped token from a manually created secret |
| `ingress` / `networkPolicy` / `autoscaling` / `podDisruptionBudget` | Standard operational knobs |

## The pattern to know

Optional features follow one rule: **off means invisible**. A feature that
isn't configured registers no agent tool and injects no prompt guidance — the
model is never told about a capability it cannot use. And for every external
endpoint (Prometheus, Loki, ArgoCD, cloud APIs), the URL comes from the
executor's local configuration, never from the control plane.

## See also

- [Installation](/installation/) — full install walkthrough, secrets, verification.
- [Environment variables](/docs/reference/environment-variables/) — what the chart's values become.
- [Multi-cluster TLS (upstream)](https://github.com/kubently/kubently/blob/main/docs/MULTI_CLUSTER_TLS.md) and [deployment docs (upstream)](https://github.com/kubently/kubently/blob/main/docs/DEPLOYMENT.md).

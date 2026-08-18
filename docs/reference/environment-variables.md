---
layout: page
title: Environment Variables
subtitle: The engine's configuration surface, grouped by feature.
permalink: /docs/reference/environment-variables/
---

<div class="alert alert-info">
📌 The canonical, always-current reference is
<a href="https://github.com/kubently/kubently/blob/main/docs/ENVIRONMENT_VARIABLES.md">docs/ENVIRONMENT_VARIABLES.md</a>
in the engine repo. This page maps the territory; follow the link for every
variable, default, and example.
</div>

Kubently is configured almost entirely through environment variables on two
components: the **API server** (control plane + agent) and the **executor**
(in-cluster, outbound-only). In self-hosted deployments the Helm chart sets
these from values; in Kubently Cloud the API-side configuration is managed
for you and you only configure the executor side.

## API server

| Area | Key variables | Notes |
|------|---------------|-------|
| Core | `PORT`, `LOG_LEVEL`, `REDIS_URL` | Service basics |
| Auth | `API_KEYS` | Static client keys; Redis-backed dynamic keys supported for control planes |
| LLM | `LLM_PROVIDER`, `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_API_KEY`, `OPENAI_ENDPOINT`, `OPENAI_MAX_TOKENS` | Any LLMFactory-compatible provider; OpenAI-spec endpoints (Azure, vLLM, OpenRouter…) supported |
| A2A | `A2A_ENABLED`, `A2A_PORT` | Agent-to-agent protocol serving |
| Conversation memory | `KUBENTLY_CHECKPOINTER_BACKEND`, `KUBENTLY_CHECKPOINT_TTL_SECONDS` | `redisearch`, `plain-redis`, `memory`, or `none` |
| Incident history | `KUBENTLY_INCIDENT_HISTORY`, `KUBENTLY_INCIDENT_TTL_SECONDS`, `KUBENTLY_INCIDENT_MAX_PER_NAMESPACE` | Searchable past diagnoses; on by default |
| Runbooks | `KUBENTLY_RUNBOOKS_DIR`, `KUBENTLY_RUNBOOKS_MAX_CHARS` | Operator runbook ingestion |
| Proactive ops | `SLACK_WEBHOOK_URL`, `KUBENTLY_CHECKS_FILE` | Alert diagnosis, deploy verification, scheduled checks (webhook URL can come from a secret) |
| GitOps remediation | `gitRemediation` block (Helm) → `KUBENTLY_GITOPS_*` | Default **off**; propose-only PRs |
| External MCP | `KUBENTLY_MCP_SERVERS`, `KUBENTLY_MCP_SERVERS_FILE`, `KUBENTLY_MCP_MAX_OUTPUT_CHARS` | Third-party MCP tool servers as evidence sources |
| Output caps | `KUBENTLY_MAX_OUTPUT_CHARS`, `KUBENTLY_MAX_FLEET_CLUSTERS` | Context-size guards |
| Tracing | `LANGSMITH_*` | Optional production observability |

## Executor

| Area | Key variables | Notes |
|------|---------------|-------|
| Core | `KUBENTLY_API_URL`, `CLUSTER_ID`, executor token | Outbound connection to the control plane |
| Command whitelist | whitelist mode + rules | Read-only enforced in code; `readOnly` / `extendedReadOnly` / `fullAccess` |
| Log search | `LOG_SEARCH_MAX_PODS` and related caps | Logs are searched on-cluster; raw logs never transit the control plane |
| Loki | `LOKI_URL`, `LOKI_MAX_LINES`, tenant header | Tool registers only when the URL is set |
| Prometheus | `PROMETHEUS_URL`, `PROMETHEUS_MAX_SERIES`, `PROMETHEUS_MAX_SAMPLES` | GET-only, two endpoints, executor-local URL |
| Change correlation | Helm `changeCorrelation.*` → helm/ArgoCD env | Read-only `helm history` and ArgoCD sync queries |
| Cloud telemetry | Helm `executor.cloud.*`, `KUBENTLY_CLOUD_REFRESH_INTERVAL`, `KUBENTLY_CLOUD_TOOLS` | Workload identity (EKS Pod Identity / IRSA, GKE WI); code-level operation allowlist |

A deliberate pattern runs through all of the optional evidence sources: the
**executor's own environment** decides which endpoints it may talk to
(Prometheus, Loki, ArgoCD, cloud APIs). The control plane never supplies a
URL, so even a stolen API key cannot aim an executor at an arbitrary
endpoint, and each tool simply doesn't exist for the agent until it's
configured.

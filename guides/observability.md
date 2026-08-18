---
layout: page
title: Metrics & Logs
subtitle: Prometheus, multi-pod log search, and Loki as evidence sources.
permalink: /guides/observability/
---

kubectl tells you what Kubernetes thinks; metrics and logs tell you what your
workloads are actually doing. This guide wires Prometheus and Loki into the
agent's evidence set, so a diagnosis can say *"p99 latency tripled at 09:12,
three minutes after revision 42 rolled out, and 41 pods logged `pool
exhausted` in that window"* instead of *"the pods look fine"*.

## What each source unlocks

| Tool | Needs | What it adds |
|---|---|---|
| `search_pod_logs` | **nothing** — always registered | Regex/substring search across every pod and container matching a label selector, with time bounds, previous-container support for crash investigations |
| `query_prometheus` | `PROMETHEUS_URL` | Instant and range PromQL: latency, saturation, OOM trends, restarts over time |
| `query_loki` | `LOKI_URL` | LogQL range queries over aggregated and historical logs — including pods that have restarted, been rescheduled, or been deleted |

`search_pod_logs` needs no configuration and works on day one. The other two
are **off by default**: when the URL is unset, the tool is not registered, the
system prompt never mentions it, and the executor answers any such query with
a clear "not configured" error.

## The rule that surprises people: URLs are executor-side

Queries execute **on the executor, inside the monitored cluster**, over the
same outbound channel kubectl commands use. The central API never dials
Prometheus or Loki.

That has two consequences:

1. **The URL must be reachable from the executor pod**, not from wherever
   your control plane runs. In-cluster service DNS is the normal answer.
2. **The URL comes exclusively from the executor's own configuration.** The
   control plane cannot supply or override it, so a compromised control plane
   can't aim the executor at an arbitrary host.

On the API side the variable is a **switch only** — its presence registers
the tool and injects the prompt guidance.

<div class="alert alert-warning">
⚠️ <strong>Split deployments (central API + remote executors) need the value
set on BOTH installs.</strong> On the executor install it is the URL the
executor queries; on the API install it only switches the tool on. Set it in
one place only and you get either a tool nobody can use, or an executor
nobody asks.
</div>

## Prerequisites

- A Kubently executor installed and connected in each cluster you want
  metrics/logs from ([quickstart](/guides/quick-start/)).
- Prometheus and/or Loki reachable from the executor pod's network.
- Their in-cluster service names. For the common charts:
  - kube-prometheus-stack → `http://prometheus-operated.monitoring.svc.cluster.local:9090`
  - loki-stack → `http://loki.monitoring.svc.cluster.local:3100`

## Wire it up

### Prometheus

```yaml
# values.yaml
prometheus:
  url: "http://prometheus-operated.monitoring.svc.cluster.local:9090"
```

### Loki

```yaml
# values.yaml
loki:
  url: "http://loki.monitoring.svc.cluster.local:3100"
  # Multi-tenant Loki: sent as the X-Scope-OrgID header (executor-side only)
  tenantId: ""
```

### Apply

```bash
helm upgrade kubently kubently/kubently \
  --namespace kubently --reuse-values -f values.yaml
```

Per-cluster URLs are the norm, not the exception: each cluster's executor
gets the URL of *its own* Prometheus/Loki. Only the API-side switch is
shared.

## Verify

```bash
# The executor picked up the URLs
kubectl exec -n kubently deploy/kubently-executor -- env | grep -E 'PROMETHEUS_URL|LOKI_URL'

# The API registered the tools (the log line appears at agent startup)
kubectl logs -n kubently deploy/kubently-api | grep -iE 'prometheus|loki'
```

Then ask something only metrics can answer:

> Show me container restarts for the shop namespace over the last 6 hours,
> and the memory working set for checkout-api against its limit.

If the tool isn't registered you'll notice immediately — the agent answers
from kubectl alone and never cites a metric.

## Caps and truncation

Everything is capped **before it leaves the executor**, and every cap that
fires announces itself in the output the model reads. That is deliberate: a
silently truncated log search is how an agent concludes "no errors found".

### `search_pod_logs` (executor)

| Variable | Default | Caps |
|---|---|---|
| `LOG_SEARCH_MAX_PODS` | `20` | Pods scanned per search (excess noted) |
| `LOG_SEARCH_MAX_MATCHES_PER_CONTAINER` | `50` | Matching lines shown per container |
| `LOG_SEARCH_MAX_TOTAL_MATCHES` | `200` | Matching lines shown per search |
| `LOG_SEARCH_MAX_LINE_CHARS` | `500` | Individual line length |
| `LOG_SEARCH_MAX_OUTPUT_CHARS` | `20000` | Assembled result size |
| `LOG_SEARCH_TIME_BUDGET` | `50` | Seconds of kubectl fetching before the search stops early (with a note) |

Pods are resolved and logs fetched through the same whitelist-enforced
kubectl runner as ordinary commands, filtered **on the executor** — only
matching lines come back. Raw logs never transit the control plane or the
model's context.

### `query_prometheus` (executor)

Read-only GETs against exactly two paths: `/api/v1/query` and
`/api/v1/query_range`.

| Variable | Default | Caps |
|---|---|---|
| `PROMETHEUS_TIMEOUT` | `30` | Query timeout, seconds |
| `PROMETHEUS_MAX_SERIES` | `50` | Series per query (excess truncated with a note) |
| `PROMETHEUS_MAX_SAMPLES` | `2000` | Total samples per range query (evenly downsampled with a note) |
| `PROMETHEUS_MAX_OUTPUT_CHARS` | `20000` | Serialized result size |

### `query_loki` (executor)

Read-only GETs against exactly one path: `/loki/api/v1/query_range`.

| Variable | Default | Caps |
|---|---|---|
| `LOKI_TIMEOUT` | `30` | Query timeout, seconds |
| `LOKI_MAX_LINES` | `500` | Log lines per query (the request `limit` is clamped to this) |
| `LOKI_MAX_LINE_CHARS` | `500` | Individual line length |
| `LOKI_MAX_OUTPUT_CHARS` | `20000` | Serialized result size |
| `LOKI_TENANT_ID` | — | `X-Scope-OrgID` header for multi-tenant Loki |

### Tuning for busy clusters

Raise caps under `executor.env` in Helm values:

```yaml
executor:
  env:
    LOG_SEARCH_MAX_PODS: "40"
    LOG_SEARCH_MAX_TOTAL_MATCHES: "400"
    PROMETHEUS_MAX_SERIES: "100"
```

Raise them deliberately. Every cap you lift is more text in the model's
context for the same question — the caps exist to keep one noisy namespace
from crowding out the evidence that matters.

## Choosing between the three

The agent picks, but knowing the shape helps you ask better questions:

- **`search_pod_logs`** — "what is *this workload* logging *right now*". Best
  for live crashes; `previous: true` reaches the container that just died.
- **`query_loki`** — "what did *anything* log *back then*". The only source
  that survives pod deletion and rescheduling.
- **`query_prometheus`** — "is this a trend or a blip", "did it regress
  against the pre-deploy window". Also what
  [deployment verification](/guides/cicd/) compares against.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Agent never cites metrics/logs | The API-side switch is unset — the tool was never registered | Set `prometheus.url` / `loki.url` on the **API** install too |
| "Prometheus is not configured" in a result | The API registered the tool but that cluster's executor has no URL | Set the value on the **executor** install for that cluster |
| Connection refused / timeout in results | The URL isn't reachable from the executor pod's network or namespace | `kubectl exec -n kubently deploy/kubently-executor -- wget -qO- <url>/-/healthy`; check NetworkPolicies |
| Loki returns nothing for a real query | Multi-tenant Loki without a tenant id | Set `loki.tenantId` |
| Results end with a truncation note | A cap fired — working as designed | Narrow the selector or time window first; raise the cap only if the question genuinely needs more |

## Related

- [Change correlation](/guides/change-correlation/) — pairing a metric regression with the deploy that caused it.
- [Cloud telemetry](/guides/cloud-telemetry/) — CloudWatch and Cloud Monitoring for what happens outside the cluster.
- [CI/CD integration](/guides/cicd/) — Prometheus is what makes post-deploy verification compare against the pre-deploy window.
- Upstream: [`docs/ENVIRONMENT_VARIABLES.md`](https://github.com/kubently/kubently/blob/main/docs/ENVIRONMENT_VARIABLES.md)

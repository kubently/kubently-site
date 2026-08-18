---
layout: page
title: Multi-Cluster Fleets
subtitle: One question, every cluster, in parallel.
permalink: /guides/multi-cluster/
---

Ask *"which clusters have pods crashlooping right now?"* once and get an
answer from every registered cluster — including the ones behind firewalls and
NAT. This guide covers registering clusters on both paths, how fan-out
actually behaves, and the caps that keep one noisy cluster from drowning the
rest.

Each cluster runs a lightweight executor that dials **outbound** to the
control plane. No inbound ingress, no public endpoint on your clusters, no
shared kubeconfig, and no per-cluster credential to distribute to the agent.

## Adding clusters

### Kubently Cloud {% include cloud-badge.html %}

The dashboard gives you a copy-paste Helm command per cluster, carrying your
tenant token:

```bash
helm repo add kubently https://kubently.github.io/kubently
helm install kubently-agent kubently/kubently \
  --namespace kubently-system \
  --create-namespace \
  --set api.enabled=false \
  --set redis.enabled=false \
  --set executor.enabled=true \
  --set executor.clusterId=<CLUSTER_ID> \
  --set executor.token=<TOKEN> \
  --set executor.apiUrl=<API_URL>
```

It is **one chart** — `kubently/kubently` — with the API and Redis
subcomponents switched off. "Install just the executor" means exactly that;
there is no separate executor chart. (Self-hosted installs the same chart
with `api.enabled=true` and `redis.enabled=true`.)

The cluster appears in your dashboard when the executor connects. Repeat per
cluster, with a distinct `<CLUSTER_ID>` each time. Multi-cluster fleets are a
[Team-plan](https://cloud.kubently.io/pricing) feature; see the
[Cloud quickstart](/docs/cloud-quickstart/).

### Self-hosted

Register as many executors as you like against your own API. Each cluster
needs its **own unique cluster id and its own token**.

**1. Create a token for the cluster**

```bash
kubently admin
# Select "Add Cluster" -> enter a cluster id -> copy the token
```

Or directly:

```bash
curl -X POST https://kubently.yourdomain.com/admin/agents/production-us-west/token \
  -H "X-API-Key: $KUBENTLY_ADMIN_KEY" | jq -r '.token'
```

**2. Install an executor-only release in that cluster**

```bash
kubectl config use-context production-us-west
kubectl create namespace kubently

kubectl create secret generic kubently-executor-token -n kubently \
  --from-literal=token="<paste-token-from-step-1>"
```

```yaml
# executor-values.yaml — executor only, no API and no Redis
api:
  enabled: false
redis:
  enabled: false

executor:
  enabled: true
  clusterId: "production-us-west"          # MUST match the id used for the token
  apiUrl: "https://kubently.yourdomain.com"
  existingSecret: "kubently-executor-token"
  existingSecretKey: "token"
  security:
    mode: "readOnly"
```

```bash
helm install kubently-executor kubently/kubently \
  --namespace kubently -f executor-values.yaml
```

**3. Verify the connection**

```bash
kubectl logs -n kubently -l app.kubernetes.io/component=executor
# -> "SSE connection established"

kubently admin      # "List Clusters" -> production-us-west  ✓ Connected
```

<div class="alert alert-warning">
⚠️ <strong>One replica per executor, always.</strong> Each executor
<em>is</em> a cluster identity. The chart runs a Deployment with a single
replica for automatic restart; running more would register duplicate agents
for the same <code>clusterId</code>.
</div>

If `clusterId` is left empty the executor uses its Kubernetes namespace name
as the id — fine for a single cluster, confusing across a fleet. Set it
explicitly.

## Per-cluster configuration

Evidence sources are **per-executor**, which is the point: each cluster's
executor gets the URL of *its own* Prometheus, Loki, and ArgoCD.

```yaml
# executor-values.yaml for production-us-west
prometheus:
  url: "http://prometheus-operated.monitoring.svc.cluster.local:9090"
loki:
  url: "http://loki.monitoring.svc.cluster.local:3100"
changeCorrelation:
  helmHistory:
    enabled: true
  argocd:
    url: "https://argocd-server.argocd.svc.cluster.local"
    existingSecret: "kubently-argocd-token"
```

<div class="alert alert-warning">
⚠️ <strong>Split deployments need the value on BOTH installs.</strong> On the
executor install, <code>prometheus.url</code> / <code>loki.url</code> /
<code>changeCorrelation.argocd.url</code> are what the executor dials. On the
central API install, the same values only <strong>switch the tool on</strong>
— the control plane never dials them. Set them in one place only and you get
either a tool nobody can use, or an executor nobody asks. See
<a href="/guides/observability/">metrics &amp; logs</a> and
<a href="/guides/change-correlation/">change correlation</a>.
</div>

Security mode is per-cluster too — `executor.security.mode` and the
`commandWhitelist` block live in each cluster's values, so a dev cluster can
run a wider whitelist than production. See [security](/guides/security/).

## How fan-out behaves

The agent's `execute_kubectl_multi` tool runs **one** read-only kubectl
command across many clusters **concurrently**, then aggregates the results.
The behaviors worth knowing:

**Per-cluster isolation.** Each cluster's call is independent — one bad
cluster never sinks the batch. Failures come back as an `ERROR:` line for that
cluster and nothing else.

**An unreachable cluster is never reported as healthy.** HTTP 200 does *not*
mean the command ran: an unreachable executor returns 200 with a timeout
status and no output. Kubently checks the status, not the code — otherwise
"cluster is down" would collapse to "(no matching resources)" and read as
green. This is the single most important correctness property in fleet mode.

**Output is capped per cluster.** Each cluster's block is truncated at **4000
characters**, with a note telling the agent to run `execute_kubectl` against
that cluster for the full output. Single-cluster results are capped at
`KUBENTLY_MAX_OUTPUT_CHARS` (default 20000), with a hint to re-run narrowed
(`--field-selector`, `-o custom-columns=`, `-l <selector>`, `--tail`).

Caps matter more than they look: the conversation checkpointer replays full
history every turn, so an uncapped result costs tokens on **every subsequent
turn**, not just the one that produced it.

**Empty results collapse.** A cluster with nothing matching renders as one
line, so a fleet answer stays readable:

```
=== cluster: prod-east ===
NAME                     READY   STATUS             RESTARTS
checkout-api-7d9f-abcde  0/1     CrashLoopBackOff   14

=== cluster: prod-west === (no matching resources)

=== cluster: staging-eu ===
ERROR: command status: timeout
```

**Fan-out is capped at 10 clusters per call** (`KUBENTLY_MAX_FLEET_CLUSTERS`).
Beyond that the tool returns an error telling the agent to narrow the cluster
list and batch — because each cluster adds up to ~4KB to the agent's context.

```yaml
# values.yaml — raise it deliberately on the API install
api:
  env:
    KUBENTLY_MAX_FLEET_CLUSTERS: "20"
```

Raising it trades context budget for breadth. For a fleet larger than the cap,
the **[fleet health digest](/guides/scheduled-checks/)** is the right tool —
it is built to sweep everything and collapse healthy clusters to one line.

## Asking good fleet questions

- **Name the scope.** *"Across all clusters, are any nodes under memory
  pressure?"* fans out; *"is prod-east healthy?"* doesn't need to.
- **Ask for one thing.** Fan-out runs a single command per call. A question
  needing three different commands across ten clusters is thirty calls and a
  flooded context — split it, or make it a scheduled check.
- **Narrow before you widen.** `-l app=checkout` across ten clusters beats
  `get pods -A` across ten clusters by an order of magnitude in context cost.
- **Trust the ERROR lines.** If a cluster reports an error, the answer for
  that cluster is *unknown*, not *fine*. Say so when you summarize.

## Verify the fleet

```bash
# Registered clusters
kubently admin        # -> List Clusters

# Or from the API
curl -s -H "X-API-Key: $KUBENTLY_API_KEY" \
  https://kubently.yourdomain.com/debug/clusters | jq .

# Per-cluster capabilities (whitelist, and cloud telemetry when enabled)
curl -s -H "X-API-Key: $KUBENTLY_API_KEY" \
  https://kubently.yourdomain.com/api/v1/clusters/production-us-west/capabilities | jq .
```

Then ask a fleet question and confirm every cluster you expect appears as its
own `=== cluster: ... ===` block.

## TLS between executors and a self-hosted control plane

Executors dial out over TLS to `executor.apiUrl`. For terminating TLS at the
API, cert-manager wiring, and cross-cluster certificate topologies, see the
upstream [`docs/MULTI_CLUSTER_TLS.md`](https://github.com/kubently/kubently/blob/main/docs/MULTI_CLUSTER_TLS.md)
and [`docs/TLS_DEPLOYMENT.md`](https://github.com/kubently/kubently/blob/main/docs/TLS_DEPLOYMENT.md).
The chart follows the "user brings certificate" pattern: create the TLS secret
separately and reference it from `ingress.tls`.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Executor shows Disconnected | Wrong token, wrong `apiUrl`, or egress blocked | `kubectl logs -n kubently -l app.kubernetes.io/component=executor`; confirm the token matches the id it was minted for |
| Two entries for one cluster | Two executors registered the same `clusterId`, or a stale registration | Remove the cluster via `kubently admin` and reinstall one executor |
| Cluster id is a namespace name | `executor.clusterId` left empty | Set it explicitly and reinstall |
| `Error: N clusters requested; fleet fan-out is capped at 10` | More clusters than the per-call cap | Narrow the cluster list, batch, raise `KUBENTLY_MAX_FLEET_CLUSTERS`, or use the fleet digest |
| A cluster's block is truncated | The 4000-char per-cluster cap fired | Expected — re-run `execute_kubectl` against that one cluster, or narrow the command |
| One cluster has metrics, another doesn't | Evidence URLs are per-executor | Set `prometheus.url` / `loki.url` on that cluster's executor install too |
| A cluster silently reports nothing wrong | Check for an `ERROR:` line — unreachable is reported, never rendered as healthy | Investigate that executor's connectivity |

## Related

- [Scheduled checks & fleet digests](/guides/scheduled-checks/) — the right tool above the fan-out cap.
- [Metrics & logs](/guides/observability/) and [change correlation](/guides/change-correlation/) — per-cluster evidence wiring.
- [Security](/guides/security/) — per-cluster security modes and the whitelist.
- [Installation](/installation/) — self-hosted install in depth.

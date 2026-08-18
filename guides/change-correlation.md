---
layout: page
title: Change Correlation
subtitle: "What changed before this broke?" — answered from the record.
permalink: /guides/change-correlation/
---

Most sudden failures follow a change. This guide turns on every change source
Kubently can read, so the agent's `get_recent_changes` tool builds one
chronological timeline for a workload or namespace — and the RCA names the
change that correlates with the first error instead of speculating.

The agent is instructed to check this timeline **first** when investigating a
sudden failure.

## What the timeline includes

| Source | Availability | What lands on the timeline |
|---|---|---|
| Rollout history | **Always on** | ReplicaSet revisions with timestamps and images |
| `kubectl rollout history` change-causes | **Always on** | The recorded cause per revision |
| Kubernetes events | **Always on** | Normal *and* Warning events, including children via ownership chains |
| Helm release history | Opt-in: `changeCorrelation.helmHistory.enabled` | Revisions, charts, dates, status from `helm history` / `helm list` |
| ArgoCD sync history | Opt-in: `changeCorrelation.argocd.url` + token | Application sync history and revision metadata |

The always-on sources come through the executor's read-only kubectl surface,
so they need no configuration at all. The two opt-in sources are what this
guide wires up.

Everything is read-only by construction: `helm history` / `helm list` argv is
built **on the executor** from validated fields, and ArgoCD access is fixed
GET paths under `/api/v1/applications`. The control plane never sends raw
arguments for either.

## Prerequisites

- A connected executor in each cluster ([quickstart](/guides/quick-start/)).
- For ArgoCD: a **read-only** ArgoCD API token, and `argocd-server` reachable
  from the executor pod.

## Helm release history

<div class="alert alert-warning">
⚠️ <strong>Understand the trade before enabling.</strong> Helm 3 stores
release records in Secrets, so enabling this grants the executor
<code>get</code>/<code>list</code> on Secrets. The kubectl command whitelist
still blocks <code>kubectl get secrets</code> — only helm's own history/list
output (revisions, charts, dates, status) ever leaves the executor, never
Secret contents. It is opt-in precisely because the RBAC grant is real even
though the exposure is not.
</div>

```yaml
# values.yaml
changeCorrelation:
  helmHistory:
    enabled: true
```

```yaml
# optional executor tuning
executor:
  env:
    HELM_TIMEOUT: "30"             # helm command timeout, seconds
    HELM_MAX_OUTPUT_CHARS: "20000" # hard cap on helm output size
```

There is **no API-side switch** for this one: the tool always asks, and each
executor answers with history or with a clear "not enabled" note. That means
you can enable it per cluster.

## ArgoCD sync history

### 1. Create a read-only token, then the secret

Create the token in ArgoCD for an account with read-only project access, then:

```bash
kubectl create secret generic kubently-argocd-token \
  --from-literal=token="<argocd-readonly-token>" \
  --namespace kubently
```

### 2. Wire it in values

```yaml
# values.yaml — set on the EXECUTOR install (what it dials)
changeCorrelation:
  argocd:
    url: "https://argocd-server.argocd.svc.cluster.local"
    existingSecret: "kubently-argocd-token"
    existingSecretKey: "token"
```

Like Prometheus and Loki, the URL and token come **exclusively from the
executor's own configuration** — the control plane never supplies either, and
never dials ArgoCD itself.

<div class="alert alert-warning">
⚠️ <strong>Split deployments:</strong> set <code>changeCorrelation.argocd.url</code>
on <strong>both</strong> installs. On the executor install it is what the
executor dials; on the API install it only switches the ArgoCD source on.
</div>

Self-signed `argocd-server` certificate? Point `ARGOCD_CA_CERT` at a CA
bundle rather than disabling verification — TLS verification stays on either
way.

| Variable | Default | Description |
|---|---|---|
| `ARGOCD_URL` | — | ArgoCD API base URL, reachable from the executor pod |
| `ARGOCD_TOKEN` | — | Read-only API token, from the secret |
| `ARGOCD_CA_CERT` | — | Path to a CA bundle for a self-signed cert |
| `ARGOCD_TIMEOUT` | `30` | Query timeout, seconds |
| `ARGOCD_MAX_OUTPUT_CHARS` | `20000` | Hard cap on serialized result size |

### 3. Apply

```bash
helm upgrade kubently kubently/kubently \
  --namespace kubently --reuse-values -f values.yaml
```

## Verify

```bash
kubectl exec -n kubently deploy/kubently-executor -- env | grep -E 'HELM_HISTORY_ENABLED|ARGOCD_URL'
```

Then ask a question that can only be answered from the timeline:

> What changed in the shop namespace in the last two hours, and does anything
> line up with checkout-api's first 5xx?

A good answer names a revision and a timestamp. If the Helm or ArgoCD source
is missing you'll see it — the timeline will carry rollouts and events but no
release or sync rows.

## Reading a timeline in an RCA

The agent correlates change timestamps against the **first error**, not
against "now". A well-formed change-correlation citation looks like:

> Root cause: revision 42 (deployed 09:14, ArgoCD sync `a3f19c2`) halved
> `payments/deployment/payments` memory limit 512Mi → 256Mi; working set is
> ~430Mi. First OOMKill at 09:16.

Two minutes between the change and the first error is a strong signal. Two
hours is a hypothesis to test, and the agent is expected to say which it has.

## Where this pairs

- **[Deployment verification](/guides/cicd/)** asks the same question on a
  schedule you control: after each deploy, did anything regress? Change
  correlation is what makes the verdict cite a cause.
- **[GitOps remediation](/guides/gitops-remediation/)** requires a
  change-correlation citation before the agent may propose a fix PR — the
  guardrail is "you must be able to point at the change you're reverting".
- **[Cloud telemetry](/guides/cloud-telemetry/)** extends the timeline past
  the cluster edge: CloudTrail management events (AWS) and GKE audit-log
  slices (GCP) catch the changes that never touched a manifest.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Timeline has rollouts and events but no Helm rows | `HELM_HISTORY_ENABLED` is false on that cluster's executor | Set `changeCorrelation.helmHistory.enabled: true` and upgrade the executor install |
| ArgoCD rows say "not configured" | `ARGOCD_URL` unset on that executor | Set `changeCorrelation.argocd.url` on the **executor** install |
| ArgoCD returns 401/403 | Token expired, or the account lacks read access to that project | Recreate the token; re-create the secret; restart the executor pod |
| TLS error dialing argocd-server | Self-signed certificate | Provide `ARGOCD_CA_CERT` |
| Helm rows appear but truncated | `HELM_MAX_OUTPUT_CHARS` cap fired | Working as designed; raise deliberately under `executor.env` |

## Related

- [Metrics & logs](/guides/observability/) — the "when did it start" half of the correlation.
- [Incident history](/guides/incidents/) — "have we seen this change break this before?"
- Upstream: [`docs/ENVIRONMENT_VARIABLES.md`](https://github.com/kubently/kubently/blob/main/docs/ENVIRONMENT_VARIABLES.md)

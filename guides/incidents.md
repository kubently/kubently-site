---
layout: page
title: Incident History & Postmortems
subtitle: "Have we seen this before?" gets a real answer.
permalink: /guides/incidents/
---

When an investigation concludes with a root cause, Kubently keeps a compact
record of it. Those records become searchable institutional memory: the agent
checks them before concluding a novel root cause for a familiar-looking
failure, and you can search them directly.

**On by default** wherever Redis is available — there is nothing to enable.
This guide covers how to search it well, how retrieval actually scores, how to
tune retention, and where postmortems come from.

## What gets recorded

One record per investigation that reached a root cause:

| Field | Contents |
|---|---|
| `timestamp` | ISO-8601 UTC |
| `cluster_id` | The cluster investigated |
| `resources` | Resources involved, as `namespace/name` |
| `symptoms` | Symptom keywords extracted from the investigation |
| `root_cause` | The root-cause one-liner |
| `resolution` | The resolution, when one was stated |
| `query` | The user question that started the investigation |
| `thread_id` | The conversation it came from |

No raw logs, no manifests, no command output — records are summaries, sized
for retrieval.

<div class="alert alert-info">
🔒 <strong>Records are namespaced per authenticated caller</strong>, using the
same namespace derivation as conversation-memory thread ids. Every key embeds
the namespace, so in a multi-tenant deployment one tenant's incidents are
never visible to another. Core Redis commands only — no RediSearch — so this
works on managed Redis and Upstash.
</div>

## How it is used

### 1. The agent searches on its own

`search_past_incidents` is a first-class agent tool:

```
search_past_incidents(query: str, cluster_id: str | None = None, limit: int = 5)
```

The agent is instructed to reach for it when current symptoms feel like a
recurrence, when you ask about past issues, and **before concluding a novel
root cause for a familiar-looking failure**.

### 2. Strong matches auto-surface

When a new investigation strongly matches a past incident, a one-line note is
injected into context:

```
SIMILAR PAST INCIDENT (2026-07-03): payments memory limit halved by revision 42; working set ~430Mi
```

It is framed as **something to verify against fresh evidence, never to
assume**. When a past incident materially informs the diagnosis, the RCA cites
it — *"same root cause as the 2026-07-03 incident"*.

The threshold is `KUBENTLY_INCIDENT_SURFACE_MIN_SCORE` (default `40`). Raise it
to surface less often; the search tool is unaffected either way.

### 3. You search it directly

Just ask, in chat, Slack, or any [A2A/MCP](/guides/a2a-integration/) client:

> Have we seen checkout-api OOMKilled in prod-east before?

> What were the last five incidents in the shop namespace?

## Searching well

Matching is keyword-based and scored. Knowing the weights tells you what to
put in the question:

| Signal | Weight | Cap |
|---|---|---|
| Resource name (`namespace/name`, either half) | **25** each | 2 hits |
| Cluster (explicit `cluster_id`, or named in the text) | **20** | once |
| Symptom keyword (substring) | **15** each | 3 hits |
| Root-cause / original-question token overlap (stopwords removed) | **5** each | 5 hits |

So a question naming **two resources, the cluster, and three symptoms**
saturates almost the entire scorable range. In practice:

> checkout-api payments CrashLoopBackOff OOMKilled prod-east

beats

> did the payment thing break before

**Prefix matching works both ways** (minimum 4 characters), so a workload name
in your question matches stored pod names carrying ReplicaSet and pod hash
suffixes, and vice versa. You don't need the exact pod name — and shouldn't
use it, since it won't exist next time.

**An empty query lists the most recent incidents**, newest first. That's the
"what happened last week?" query.

## Postmortems

A concluded investigation already contains what a postmortem draft needs: the
timeline, the evidence trail, the root cause, and the resolution where one was
stated.

In **Kubently Cloud** {% include cloud-badge.html %}, that material is
exportable as a postmortem draft — from the incident view in the dashboard at
[cloud.kubently.io](https://cloud.kubently.io), and from Slack by asking the
[Kubently Slack app](/cloud/slack-app/) in the incident thread:

```
@kubently postmortem
```

Because the export draws on the thread's investigation, ask it **in the
thread** where the diagnosis happened — a cold mention starts a new
investigation instead.

<div class="alert alert-info">
📝 <strong>Self-hosted:</strong> postmortem export is a Cloud dashboard and
Slack-app surface; it is not part of the open-source engine's API today, and
no <code>postmortem</code> endpoint or CLI flag exists in the
<a href="https://github.com/kubently/kubently">engine repo</a>. Self-hosted
deployments get the same underlying material by asking the agent in a
conversation thread — <em>"write up what we found as a postmortem: timeline,
root cause, evidence, resolution"</em> — and by pulling the incident record
with <code>search_past_incidents</code>. If a documented export endpoint
lands upstream, this section will point at it.
</div>

## Retention and tuning

Set these under `api.env` in Helm values:

| Variable | Default | Description |
|---|---|---|
| `KUBENTLY_INCIDENT_HISTORY` | `true` | Kill switch. `false` disables recording, the `search_past_incidents` tool, **and** auto-surfacing |
| `KUBENTLY_INCIDENT_TTL_SECONDS` | `7776000` (90 days) | Record TTL. `0` disables expiry |
| `KUBENTLY_INCIDENT_MAX_PER_NAMESPACE` | `200` | Per-caller-namespace cap; oldest records are evicted beyond it |
| `KUBENTLY_INCIDENT_SURFACE_MIN_SCORE` | `40` | Minimum match score before a past incident auto-surfaces. The search tool is unaffected |

```yaml
# values.yaml — keep two years of history, surface more conservatively
api:
  env:
    KUBENTLY_INCIDENT_TTL_SECONDS: "63072000"
    KUBENTLY_INCIDENT_MAX_PER_NAMESPACE: "500"
    KUBENTLY_INCIDENT_SURFACE_MIN_SCORE: "60"
```

```yaml
# values.yaml — turn the whole feature off
api:
  env:
    KUBENTLY_INCIDENT_HISTORY: "false"
```

**Recording and retrieval failures are logged and skipped.** Incident history
can never break an investigation or a response — worst case, the diagnosis
proceeds without institutional memory.

## What this is not

It is **retrieval over stored summaries, not a learning system**. Records are
plain data with a TTL and a cap. Nothing is fine-tuned, no weights are
updated, and a past incident never overrides fresh evidence — the auto-surface
note is explicitly framed as a hypothesis to verify.

That distinction matters operationally: if a record is wrong, it decays on its
TTL or gets evicted by the cap. There is no model state to unwind.

## Verify

```bash
# The feature initialized (logged at agent startup)
kubectl logs -n kubently deploy/kubently-api | grep -i "Incident history"
# -> Incident history enabled (search_past_incidents + auto-surface)
```

Then run an investigation to conclusion, and in a **new** conversation ask:

> Have we seen this before?

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Nothing is ever found | No investigation has concluded with a root cause yet — only concluded ones are recorded | Run a real diagnosis to completion first |
| Feature never initializes | No Redis connection | Incident history requires Redis; check `kubectl get pods -n kubently` |
| Searches return unrelated incidents | The query is too generic — text-overlap hits are only worth 5 each | Name resources, the cluster, and symptom words |
| Past incidents surface too eagerly | `KUBENTLY_INCIDENT_SURFACE_MIN_SCORE` is too low for your data | Raise it; the search tool keeps working unchanged |
| Old incidents vanished early | The per-namespace cap evicted them (oldest first), not the TTL | Raise `KUBENTLY_INCIDENT_MAX_PER_NAMESPACE` |
| One team can't see another's incidents | Working as designed — records are per-caller-namespace | Not configurable; it is the tenant boundary |

## Related

- [Runbooks](/guides/runbooks/) — turn a repeat incident into a procedure the agent follows.
- [Change correlation](/guides/change-correlation/) — the evidence that makes a record's root cause specific.
- [Slack app](/cloud/slack-app/) {% include cloud-badge.html %} — where incident threads live in Cloud.
- Upstream: [the README's incident-history section](https://github.com/kubently/kubently#incident-history)

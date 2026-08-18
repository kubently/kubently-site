---
layout: page
title: Operator Runbooks
subtitle: Your tribal knowledge, injected into every matching investigation.
permalink: /guides/runbooks/
---

Every team has knowledge that isn't in any manifest: *this service's
crashloops are always a bad config sync*, *never restart these pods, escalate
instead*. This guide gets that knowledge into the agent's context, so a
matching investigation follows your procedure and cites the runbook by name in
the RCA.

Runbooks are hand-written markdown files with lightweight YAML frontmatter
that says **when they apply**. When an investigation matches — a chat
question, an [Alertmanager alert](/guides/alerts/), or an A2A call — the best
match is injected as *the operator's runbook for this situation*: the agent
follows it where applicable, notes deviations, and names it in the diagnosis.

**Default: off.** No runbooks directory, no feature.

## Prerequisites

- A running Kubently API ([quickstart](/guides/quick-start/)).
- Somewhere to keep the markdown — Helm values are the normal answer.

## A complete worked example

```markdown
---
name: Payments CrashLoopBackOff
match:
  alerts: ["KubePodCrashLooping", "PaymentsPod*"]
  namespaces: ["payments", "payments-*"]
  workloads: ["payment-api*"]
  topics: ["crashloop", "OOMKilled", "payment service down"]
---
1. Check recent deploys first: payment-api ships through ArgoCD, and 90% of
   crashloops here follow a bad config sync. Use the change timeline before
   reading a single log line.
2. OOMKilled almost always means the JVM heap flag drifted from the container
   memory limit — compare `-Xmx` against `resources.limits.memory` before
   blaming traffic. If they disagree, that is the root cause; say so.
3. If the DB connection pool is exhausted (`pool exhausted` in the logs), do
   NOT restart the pods; escalate to #payments-oncall. Restarts
   thundering-herd the database and turn a degradation into an outage.
4. `payment-api` has a 90-second startup probe. Pods restarting at ~90s are a
   probe timeout, not a crash — check `initialDelaySeconds` before
   investigating the application.
```

That runbook does four things a generic diagnosis cannot: it names the
**likeliest cause first**, gives a **specific comparison** to make, records a
**prohibition** with the reason, and encodes a **known false signal**.

## The frontmatter format

```yaml
---
name: <human-readable name, cited in the RCA>
match:
  alerts:     ["<glob>", ...]   # alert-name globs
  namespaces: ["<glob>", ...]   # namespace globs
  workloads:  ["<glob>", ...]   # workload globs (match derived pod names too)
  topics:     ["<tag>", ...]    # free-text substrings
---
<the runbook body — plain markdown, no required structure>
```

`name` and at least one `match` criterion are what make a runbook useful; a
runbook with no match criteria can never be selected.

## Matching rules, exactly

Matching is **scored** against the investigation's text — whatever reached the
agent, whether that's a chat question, an alert-derived query, or an A2A
message.

| Criterion | How it matches | Weight |
|---|---|---|
| `alerts` | Case-insensitive **glob** against text tokens | **100** |
| `namespaces` | Case-insensitive **glob** against text tokens | **40** |
| `workloads` | Case-insensitive **glob** against text tokens | **40** |
| `topics` | Case-insensitive **substring** of the whole text | **10** |

Each pattern that hits contributes its weight once. Runbooks scoring zero are
never injected; the rest are ordered best-first, ties broken by name so
injection order is deterministic.

The weights encode a judgement worth understanding: **an alert-name hit
outranks any pile of topic hits.** An alert name in the text is exact operator
intent; topics are fuzzy and exist mainly for chat questions that mention no
alert or resource by name.

**Tokenization keeps Kubernetes characters.** Tokens retain hyphens, dots and
underscores, so `payment-api*` matches `payment-api-7f9d8b-x2v` inside a
sentence. That is why workload globs work on derived pod names.

### Writing match criteria that fire

- **Anchor on alert names** for anything Alertmanager routes. `alerts:
  ["KubePodCrashLooping"]` is worth ten topic tags.
- **Use globs for families**: `namespaces: ["payments", "payments-*"]` covers
  the preview namespaces too.
- **Use workload globs, not pod names** — `payment-api*` matches the pods; a
  pod name matches exactly one pod that no longer exists.
- **Keep topics distinctive.** `topics: ["database"]` will match half your
  investigations at weight 10 each. `topics: ["pool exhausted", "connection
  pool"]` matches the ones you meant.

## Wiring it up

### Helm values → ConfigMap (recommended)

Each entry becomes a file in a ConfigMap mounted at `/etc/kubently/runbooks`:

```yaml
# values.yaml
runbooks:
  payments-crashloop.md: |
    ---
    name: Payments CrashLoopBackOff
    match:
      alerts: ["KubePodCrashLooping"]
      namespaces: ["payments"]
      workloads: ["payment-api*"]
      topics: ["crashloop", "OOMKilled"]
    ---
    1. Check recent deploys first: payment-api ships through ArgoCD.
    2. OOMKilled here is almost always the JVM heap flag drifting from the
       container memory limit — compare both before blaming traffic.
    3. Escalate to #payments-oncall if the DB connection pool is the cause.

  checkout-latency.md: |
    ---
    name: Checkout latency regression
    match:
      alerts: ["CheckoutHighLatency*"]
      namespaces: ["shop"]
      topics: ["p99", "latency", "slow checkout"]
    ---
    1. Compare p99 against the pre-deploy window before anything else.
    2. The Redis session store is the usual culprit; check its eviction rate.
```

```bash
helm upgrade kubently kubently/kubently \
  --namespace kubently --reuse-values -f values.yaml
```

**Edits go live without a pod restart.** The store rescans the directory
periodically (mtime + size signature, the same model as the executor command
whitelist), and the kubelet syncs updated ConfigMap volumes in about a minute.

### Outside Helm

Point `KUBENTLY_RUNBOOKS_DIR` at any directory of `*.md` files. A missing
directory means the feature is simply off.

### Configuration

| Variable | Default | Description |
|---|---|---|
| `KUBENTLY_RUNBOOKS_DIR` | `/etc/kubently/runbooks` | Directory of `*.md` runbooks. Missing directory = feature off. Set automatically by Helm when `runbooks` values are provided |
| `KUBENTLY_RUNBOOKS_RELOAD_SECONDS` | `30` | Minimum seconds between directory rescans |
| `KUBENTLY_RUNBOOKS_MAX_CHARS` | `8000` | Cap on total injected runbook characters per investigation |

The character cap (~2k tokens) is a real constraint: **the best match packs
first**, and an oversized best match is *truncated rather than dropped*, with
a truncation note. One complete, best-matching runbook beats fragments of
many. Multi-turn conversations dedupe per thread, so a long investigation
doesn't accumulate duplicate copies.

## Verify

```bash
# The ConfigMap rendered and mounted
kubectl get configmap -n kubently | grep runbook
kubectl exec -n kubently deploy/kubently-api -- ls /etc/kubently/runbooks
```

Then ask a question that should match, and one that shouldn't:

> Why is payment-api crashlooping in payments?

A matched investigation **cites the runbook by name** in its answer and
visibly follows its order — in the example above, it checks recent deploys
before reading logs. If the answer reads like a generic crashloop
investigation, the runbook didn't match; check your globs against the exact
words in the question.

## Managing a runbook library

Runbooks are text in your values file, which means the normal GitOps workflow
applies: they live in your manifests repo, get reviewed in a PR, and roll out
with a `helm upgrade`. A few practices that hold up:

- **One runbook per failure mode**, not per service. A service with three
  distinct failure modes and one runbook produces one vague injection.
- **Write prohibitions with reasons.** "Do NOT restart the pods" gets
  followed; "restarts thundering-herd the database" gets applied to the
  situation you didn't anticipate.
- **Record known false signals** — the 90-second probe in the example above
  saves an entire wrong investigation.
- **Prune what stopped being true.** A stale runbook is worse than none: the
  agent will follow it.
- **Update runbooks from [incident history](/guides/incidents/).** A past
  incident that took an hour to diagnose is next quarter's runbook.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Runbook never gets cited | Score is zero — the match patterns don't appear in the investigation text | Read the actual question; add the alert name or a distinctive topic |
| Wrong runbook wins | Another runbook has an alert hit (100) and yours only has topics (10×n) | Add an `alerts` or `workloads` glob to yours |
| Runbook is cited but truncated | It exceeds `KUBENTLY_RUNBOOKS_MAX_CHARS` | Shorten it, or split by failure mode; raise the cap only deliberately |
| Every investigation cites the same runbook | Over-broad topics or a `*` glob | Narrow the criteria |
| Edits don't take effect | ConfigMap volume sync (~1 min) plus the rescan interval | Wait, then `kubectl exec ... -- cat /etc/kubently/runbooks/<file>` to confirm the pod sees the new text |
| No runbooks load at all | The directory doesn't exist in the pod | `kubectl exec -n kubently deploy/kubently-api -- ls /etc/kubently/runbooks`; check that `runbooks` is non-empty in values |

## Related

- [Alert-triggered diagnosis](/guides/alerts/) — where alert-name matching pays off most.
- [Incident history & postmortems](/guides/incidents/) — the raw material for new runbooks.
- [Scheduled checks](/guides/scheduled-checks/) — runbooks shape these investigations too.
- Upstream: [the README's runbooks section](https://github.com/kubently/kubently#operator-runbooks)

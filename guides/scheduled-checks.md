---
layout: page
title: Proactive Checks
subtitle: Cron-scheduled investigations that stay quiet when things are healthy.
permalink: /guides/scheduled-checks/
---

Alerts are reactive: something has to break loudly enough to fire a rule.
This guide sets up the three proactive paths — a **fleet health digest**,
**named scheduled checks**, and **deployment verification** — so Kubently
answers the questions you'd otherwise ask by hand every morning.

All three share one design rule: **silence means green**. A passing check
posts nothing. What lands in Slack is what needs you.

## Prerequisites

- Connected executors in the clusters you want swept
  ([quickstart](/guides/quick-start/)).
- Slack delivery configured — one incoming webhook powers every proactive
  path. See [alerts](/guides/alerts/#1-slack-delivery).
- A Kubently API key for the `dry_run` calls below.

---

## Fleet health digest

One sweep across **every registered cluster**, one summary. Healthy clusters
collapse to a single line.

### Preview before you schedule

Neither of these needs a `helm upgrade`:

```bash
# Preview the digest, post nothing
curl -X POST https://<your-kubently-host>/webhooks/fleet-report \
  -H "X-API-Key: $KUBENTLY_API_KEY" -H 'Content-Type: application/json' \
  -d '{"dry_run": true}'
```

Iterate on the wording in the same call — pass `query` to try a question
immediately:

```bash
curl -X POST https://<your-kubently-host>/webhooks/fleet-report \
  -H "X-API-Key: $KUBENTLY_API_KEY" -H 'Content-Type: application/json' \
  -d '{"dry_run": true,
       "query": "Check every cluster for pods restarting more than 5 times and for PVCs above 85% usage. One line per healthy cluster. No preamble."}'
```

### Then schedule it

```yaml
# values.yaml
fleetReport:
  enabled: true
  suspend: false               # true = create the CronJob but never fire it
  schedule: "0 13 * * 1-5"     # weekday mornings, cluster timezone (UTC by default)
  query: |-
    Check every cluster for pods restarting more than 5 times and for PVCs
    above 85% usage. One line per healthy cluster. No preamble.
```

An empty `query` uses the shipped `prompts/fleet_report.prompt.yaml`. The
value is rendered to `KUBENTLY_FLEET_REPORT_PROMPT_FILE`.

To exercise the **real** scheduled path once — image, secrets, in-cluster URL
and all:

```bash
kubectl create job --from=cronjob/kubently-fleet-report fleet-report-test -n kubently
```

---

## Scheduled checks

The digest asks one broad question. Scheduled checks ask **your** questions on
**their** schedules — each is a named prompt with its own cron schedule, its
own CronJob, and optional target clusters.

```yaml
# values.yaml
scheduledChecks:
  enabled: true
  notifyOnPass: false          # global default; each check may override
  checks:
    - name: cert-expiry
      schedule: "0 8 * * 1"    # Monday mornings
      clusters: [prod-east, prod-west]
      prompt: |-
        Check TLS secrets for certificates expiring within 21 days.
        List each as namespace/name with days remaining.
    - name: pvc-pressure
      schedule: "0 */6 * * *"
      clusters: [prod-east]
      prompt: Find PersistentVolumeClaims above 85% usage.
    - name: orphaned-pdbs
      schedule: "0 9 * * 1"
      notifyOnPass: true       # this one you want to hear about either way
      suspend: false
      prompt: |-
        Find PodDisruptionBudgets whose selector matches no pods, and
        PDBs whose minAvailable equals or exceeds the workload's replicas.
```

### Field rules

| Field | Required | Rules |
|---|---|---|
| `name` | **yes** | Lowercase alphanumeric and hyphens, **max 30 characters** — it becomes part of the CronJob name `<release>-check-<name>` |
| `schedule` | **yes** | A **5-field** cron expression, in the cluster's timezone (UTC by default) |
| `prompt` | **yes** | The question the agent investigates |
| `clusters` | no | Cluster ids to target. Empty = all registered |
| `notifyOnPass` | no | Overrides the global default |
| `suspend` | no | Create the CronJob but never fire it on schedule |

<div class="alert alert-warning">
⚠️ <strong>Validation is all-or-nothing, on purpose.</strong> A bad entry
fails the whole checks file with a pointed error — because a half-loaded
config where the misspelled check silently vanishes is how a "certificate
expiry" check stops running without anyone noticing. A misspelled check fails
loudly instead.
</div>

### Iterate without waiting for cron

The checks file is rendered into a ConfigMap and **read per request**, so
edits need no pod restart.

```bash
curl -X POST https://<your-kubently-host>/webhooks/scheduled-check \
  -H "X-API-Key: $KUBENTLY_API_KEY" -H 'Content-Type: application/json' \
  -d '{"check": "cert-expiry", "dry_run": true}'
```

```json
{"dryRun": true, "check": "cert-expiry", "verdict": "pass",
 "wouldPost": false, "answer": "VERDICT: PASS\n..."}
```

`wouldPost` is the field to watch while tuning: it tells you whether this
result would have reached Slack under the check's current `notifyOnPass`.

Override the prompt for one run without editing values:

```bash
curl -X POST https://<your-kubently-host>/webhooks/scheduled-check \
  -H "X-API-Key: $KUBENTLY_API_KEY" -H 'Content-Type: application/json' \
  -d '{"check": "cert-expiry", "dry_run": true,
       "prompt": "Check TLS secrets for certificates expiring within 45 days."}'
```

Or run the real scheduled path once:

```bash
kubectl create job --from=cronjob/kubently-check-cert-expiry check-test -n kubently
```

---

## Deployment verification

The third proactive path fires on **deploys** rather than on a clock: Kubently
watches the rollout settle, then investigates the result and posts a PASS/FAIL
verdict with evidence.

Two ways to trigger it:

1. **From CI** — `POST /webhooks/verify-deployment` as the last step of your
   deploy job. Full workflows in the [CI/CD guide](/guides/cicd/).
2. **Zero-CI** — label the workload and let the API notice:

   ```bash
   kubectl -n shop label deploy/checkout-api kubently.io/verify=enabled
   ```

   ```yaml
   verifyDeployment:
     watch:
       enabled: true
       intervalSeconds: 60     # minimum 15
       clusters: []            # empty = all registered
     timeoutSeconds: 600
   ```

   The API sweeps for labelled workloads and verifies every
   `.metadata.generation` change. The first sighting only records a baseline,
   so labelling never triggers a verification storm.

**Verifications always post** — pass or fail. That is the one deliberate
exception to the silence rule: a deploy is an event someone is actively
watching, so silence is not a signal there.

---

## Noise discipline

This is the part that decides whether anyone still reads the channel in a
month.

**The verdict contract.** Every proactive path asks the agent to open with
`VERDICT: PASS` or `VERDICT: FAIL`. The parser tolerates case, model
decoration and short preambles; anything unreadable maps to **unknown**,
which is treated like a failure for posting purposes. An unparseable verdict
never mutes a notification.

| Path | Posts on PASS | Posts on FAIL / unknown |
|---|---|---|
| Scheduled check | Only with `notifyOnPass` | Always, with evidence |
| Fleet digest | Always (that's the point — it's a digest) | Always |
| Deployment verification | Always | Always |

**Write prompts that produce a crisp verdict.** A check whose answer is a
paragraph of nuance parses as *unknown* and posts every run — the noise you
were avoiding. Prompts that work:

- Name a **threshold**, not a vibe: "PVCs above 85% usage", not "PVCs that
  look full".
- Say what a **pass** looks like: "If none, say so in one line."
- Ask for a **list**, and specify the shape: "List each as namespace/name with
  days remaining."
- Forbid preamble: "No preamble."

**Pick schedules that match the question.** A cert-expiry check every six
hours tells you the same thing 28 times before it matters; weekly is right.
A PVC-pressure check weekly is useless; every six hours is right.

**Scope with `clusters`.** A check that only makes sense in production
shouldn't sweep dev and report findings nobody will act on.

**Prefer one broad digest plus a few sharp checks** over a dozen checks. The
digest is designed to collapse healthy clusters to one line; checks are for
questions with a real threshold.

## Verify

```bash
# The endpoints mounted
kubectl logs -n kubently deploy/kubently-api | grep -E "Fleet report endpoint|Scheduled checks endpoint|Deployment verification endpoint"

# The CronJobs exist
kubectl get cronjobs -n kubently
# kubently-fleet-report        0 13 * * 1-5
# kubently-check-cert-expiry   0 8 * * 1
# kubently-check-pvc-pressure  0 */6 * * *
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `400 'check' is required` | The POST body has no `check` field | Send `{"check": "<name>"}` |
| A check errors with a validation message | Another entry in the file is invalid — validation is all-or-nothing | Fix the entry the message names; all checks resume |
| CronJob missing after upgrade | `scheduledChecks.enabled` is false, or the check has `suspend: true` | `kubectl get cronjobs -n kubently`; check the values |
| `503 SLACK_WEBHOOK_URL is not configured` | Non-dry-run with no Slack destination | Configure `api.slackWebhook`; `dry_run` never needs it |
| A passing check posts every run | The verdict isn't parseable, so it maps to unknown | Run with `dry_run: true`, read `verdict`; tighten the prompt |
| A check never posts even on failure | The prompt asks something the agent answers as PASS | Read the `answer` from a dry run — the check may be measuring the wrong thing |
| Check name rejected | Longer than 30 chars, or not lowercase/hyphen | Rename — it has to fit a CronJob name |
| Digest is one line of "everything fine" for a broken cluster | An unreachable cluster is reported as **unreachable — health unknown**, never healthy; confirm you're not reading a stale run | `kubectl get pods -n kubently` in that cluster; see [multi-cluster](/guides/multi-cluster/) |

## Related

- [CI/CD integration](/guides/cicd/) — deployment verification from a pipeline, in full.
- [Alert-triggered diagnosis](/guides/alerts/) — the reactive half.
- [Multi-cluster fleets](/guides/multi-cluster/) — what "every registered cluster" means, and its caps.
- [Runbooks](/guides/runbooks/) — shape what a check's investigation actually does.

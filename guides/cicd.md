---
layout: page
title: CI/CD Integration
subtitle: Failed pipelines diagnosed; deployments verified after they land.
permalink: /guides/cicd/
---

Two things connect Kubently to your delivery pipeline:

- **Failed pipelines get diagnosed.** A broken deploy job triggers an agent
  investigation of the cluster behind it, and the root cause lands in Slack.
- **Successful deploys get verified.** Kubently watches the rollout settle,
  then runs a real post-deploy investigation — pods ready? events clean?
  errors in the new logs? metrics regressed against the pre-deploy window? —
  and posts a **PASS/FAIL verdict with the evidence**.

A rollout that never settled cannot be talked into a PASS.

How you wire this depends on your path:

| | Cloud {% include cloud-badge.html %} | Self-hosted |
|---|---|---|
| Pipeline failures | `POST /hooks/cicd/{hook_id}` — a per-tenant hook your Git host posts to | No pipeline-failure endpoint; call verification from the failure path of your job |
| Deploy verification | Bridged automatically from the same hook, or called directly | `POST /webhooks/verify-deployment` from your pipeline |
| Repo → cluster mapping | Dashboard mapping editor | Pipeline-side (job env or matrix) |
| Auth | Capability URL + provider signature | `X-API-Key` |

---

## Cloud: the CI/CD hook {% include cloud-badge.html %}

One webhook on your repository covers both directions.

### Set it up

In the dashboard at [cloud.kubently.io](https://cloud.kubently.io), go to
**Settings → CI/CD**. The card gives you:

- your **webhook URL** — `https://<cloud-host>/hooks/cicd/{hook_id}`, where
  `hook_id` is an unguessable per-tenant capability URL,
- a **webhook secret** to paste into your Git host,
- a **"verify deploys" toggle**, and
- a **repo → cluster mapping editor**.

Then add the webhook on your Git host.

**GitHub** — repository (or organization) **Settings → Webhooks → Add
webhook**:

| Field | Value |
|---|---|
| Payload URL | your `https://<cloud-host>/hooks/cicd/{hook_id}` |
| Content type | `application/json` |
| Secret | the webhook secret from the CI/CD card |
| Events | **Workflow runs** and **Deployment statuses** |

**GitLab** — project **Settings → Webhooks → Add new webhook**:

| Field | Value |
|---|---|
| URL | your `https://<cloud-host>/hooks/cicd/{hook_id}` |
| Secret token | the webhook secret from the CI/CD card |
| Trigger | **Pipeline events** |

### How it authenticates

Two independent factors, and both must hold:

1. **The capability URL** — `hook_id` is unguessable and per-tenant, the same
   model as a Slack incoming webhook. That is what lets your Git host post
   without custom auth headers.
2. **The provider signature** — GitHub's HMAC signature, or GitLab's secret
   token, verified against your tenant's webhook secret.

Rotating the secret in the CI/CD card invalidates signatures from the old
one, so rotate on your Git host in the same sitting.

### What it does with each event

**A failed pipeline** → one agent diagnosis, posted to Slack. Repeats of the
**same workflow and branch** inside a dedup window collapse to one diagnosis,
so a flapping job doesn't become a flapping channel. Each diagnosis meters as
one unit.

**A successful deploy** → if you enabled **verify deploys** *and* the repo →
cluster/namespace/workload mapping resolves for that repository, the hook
bridges into [deployment verification](#the-verification-request) — the same
investigation and the same PASS/FAIL verdict described below. If no mapping
resolves, nothing runs; that's the switch, not a failure.

### The repo → cluster mapping

Kubently addresses clusters by the cluster id the executor registered with,
so something has to say *this repository deploys to that workload*. In Cloud
that lives in the mapping editor on the CI/CD card — repository → cluster,
namespace, workload — and it is what the deploy-verification bridge consults.
Add a row per environment a repo deploys to.

Confirm the cluster ids you're mapping to on the dashboard's clusters page,
or see [multi-cluster](/guides/multi-cluster/).

---

## Self-hosted: verification from your pipeline

There is no per-tenant hook self-hosted. Call the OSS verification endpoint
directly from the job that deployed.

### The verification request

```bash
curl -X POST https://<your-kubently-host>/webhooks/verify-deployment \
  -H "X-API-Key: $KUBENTLY_API_KEY" -H 'Content-Type: application/json' \
  -d '{"cluster": "prod-east", "namespace": "shop",
       "workload": "deploy/checkout-api", "context": "v1.42.0"}'
```

```json
{"accepted": true, "cluster": "prod-east", "workload": "deployment/checkout-api",
 "namespace": "shop", "timeoutSeconds": 600}
```

| Field | Required | Notes |
|---|---|---|
| `cluster` | **yes** | The Kubently cluster id (the executor's `clusterId`) |
| `workload` | **yes** | Bare name, or the `kind/name` form kubectl prints. `deploy`/`deployments`, `sts`/`statefulsets`, `ds`/`daemonsets` are normalized |
| `kind` | no | `deployment` (default), `statefulset`, `daemonset`. Contradicting the `workload` prefix is an error, not a silent pick |
| `namespace` | no | Defaults to `default`. Must be a valid DNS-1123 name |
| `timeout_seconds` | no | Rollout settle deadline. Defaults to `KUBENTLY_VERIFY_TIMEOUT_SECONDS` (600); **clamped to 60–1800** |
| `context` | no | Free text for the Slack header — an image tag, a release name. Truncated to 200 characters |
| `query` | no | Extra caller instructions appended to the investigation |
| `dry_run` | no | `true` runs **synchronously** and returns the verdict without posting |

Two response contracts, and the choice is yours:

- **Default** — ACK `202` and run in the background. Settle plus
  investigation takes minutes; nobody should hold a CI connection that long.
- **`dry_run: true`** — synchronous, returns
  `{"dryRun": true, ..., "verdict": ..., "answer": ...}`, posts nothing. This
  is the mode to develop against.

### Test it before you wire it

```bash
curl -X POST https://<your-kubently-host>/webhooks/verify-deployment \
  -H "X-API-Key: $KUBENTLY_API_KEY" -H 'Content-Type: application/json' \
  -d '{"cluster": "prod-east", "namespace": "shop",
       "workload": "deploy/checkout-api", "dry_run": true}' | jq -r .answer
```

### GitHub Actions

A complete deploy-and-verify workflow. The repo → cluster mapping lives in
the workflow, next to the credentials that already decide where a repo
deploys.

{% raw %}
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    env:
      # repo -> cluster mapping. One entry per environment this repo deploys to.
      KUBENTLY_CLUSTER: prod-east
      NAMESPACE: shop
      WORKLOAD: deploy/checkout-api

    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBECONFIG }}" > "$RUNNER_TEMP/kubeconfig"
          echo "KUBECONFIG=$RUNNER_TEMP/kubeconfig" >> "$GITHUB_ENV"

      - name: Deploy
        run: |
          kubectl -n "$NAMESPACE" set image "$WORKLOAD" \
            checkout-api="ghcr.io/${{ github.repository }}:${{ github.sha }}"

      # Kubently watches the rollout settle, then investigates the result and
      # posts a PASS/FAIL verdict with evidence to Slack. Fire-and-forget: the
      # job does not wait for the investigation.
      - name: Verify deployment with Kubently
        run: |
          curl -sS --fail-with-body -X POST \
            "${{ vars.KUBENTLY_URL }}/webhooks/verify-deployment" \
            -H "X-API-Key: ${{ secrets.KUBENTLY_API_KEY }}" \
            -H 'Content-Type: application/json' \
            -d @- <<JSON
          {
            "cluster":   "${KUBENTLY_CLUSTER}",
            "namespace": "${NAMESPACE}",
            "workload":  "${WORKLOAD}",
            "context":   "${{ github.sha }} by ${{ github.actor }}",
            "timeout_seconds": 900
          }
          JSON

      # The deploy step failed: ask for an investigation of what the cluster
      # looks like now, with the CI context attached. (This is the
      # self-hosted stand-in for the Cloud CI/CD hook's failure path.)
      - name: Investigate failed deploy
        if: failure()
        run: |
          curl -sS -X POST \
            "${{ vars.KUBENTLY_URL }}/webhooks/verify-deployment" \
            -H "X-API-Key: ${{ secrets.KUBENTLY_API_KEY }}" \
            -H 'Content-Type: application/json' \
            -d @- <<JSON
          {
            "cluster":   "${KUBENTLY_CLUSTER}",
            "namespace": "${NAMESPACE}",
            "workload":  "${WORKLOAD}",
            "context":   "FAILED PIPELINE ${{ github.run_id }}",
            "timeout_seconds": 120,
            "query": "The CI deploy step failed for this workload. Focus on why the rollout could not proceed: image pull, admission webhooks, quota, and failing probes."
          }
          JSON
```
{% endraw %}

Store `KUBENTLY_API_KEY` as a repository **secret** and `KUBENTLY_URL` as a
repository **variable**.

### GitLab CI

```yaml
# .gitlab-ci.yml
stages: [deploy, verify]

variables:
  KUBENTLY_CLUSTER: prod-east
  NAMESPACE: shop
  WORKLOAD: deploy/checkout-api

deploy:
  stage: deploy
  environment: production
  script:
    - kubectl -n "$NAMESPACE" set image "$WORKLOAD" checkout-api="$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"

verify:
  stage: verify
  when: on_success
  script:
    - |
      curl -sS --fail-with-body -X POST \
        "$KUBENTLY_URL/webhooks/verify-deployment" \
        -H "X-API-Key: $KUBENTLY_API_KEY" \
        -H 'Content-Type: application/json' \
        -d "{\"cluster\": \"$KUBENTLY_CLUSTER\",
             \"namespace\": \"$NAMESPACE\",
             \"workload\": \"$WORKLOAD\",
             \"context\": \"$CI_COMMIT_SHORT_SHA by $GITLAB_USER_LOGIN\",
             \"timeout_seconds\": 900}"

investigate-failure:
  stage: verify
  when: on_failure
  script:
    - |
      curl -sS -X POST \
        "$KUBENTLY_URL/webhooks/verify-deployment" \
        -H "X-API-Key: $KUBENTLY_API_KEY" \
        -H 'Content-Type: application/json' \
        -d "{\"cluster\": \"$KUBENTLY_CLUSTER\",
             \"namespace\": \"$NAMESPACE\",
             \"workload\": \"$WORKLOAD\",
             \"context\": \"FAILED PIPELINE $CI_PIPELINE_ID\",
             \"timeout_seconds\": 120,
             \"query\": \"The CI deploy step failed for this workload. Focus on why the rollout could not proceed.\"}"
```

Set `KUBENTLY_URL` and `KUBENTLY_API_KEY` as masked CI/CD variables.

On the failure path, two things change from the success path: a short
`timeout_seconds` (the rollout has already failed — don't wait 15 minutes to
confirm it), and a `query` telling the agent this came from a broken pipeline
and what to look at first. The verdict will be FAIL, and the evidence trail
is the part you actually want.

### Matrix: one repo, many clusters

{% raw %}
```yaml
strategy:
  matrix:
    include:
      - cluster: prod-east
        namespace: shop
      - cluster: prod-west
        namespace: shop
steps:
  - run: |
      curl -sS -X POST "${{ vars.KUBENTLY_URL }}/webhooks/verify-deployment" \
        -H "X-API-Key: ${{ secrets.KUBENTLY_API_KEY }}" \
        -H 'Content-Type: application/json' \
        -d '{"cluster":"${{ matrix.cluster }}","namespace":"${{ matrix.namespace }}","workload":"deploy/checkout-api"}'
```
{% endraw %}

Confirm the ids with `kubently admin` → *List Clusters*.

---

## No CI access? Label the workload instead

Works on both paths. Let the API notice deploys itself:

```bash
kubectl -n shop label deploy/checkout-api kubently.io/verify=enabled
```

```yaml
# values.yaml (self-hosted)
verifyDeployment:
  watch:
    enabled: true
    intervalSeconds: 60      # minimum 15
    clusters: []             # empty = all registered clusters
  timeoutSeconds: 600
```

The API sweeps registered clusters for workloads labelled
`kubently.io/verify=enabled` and fires a verification whenever a workload's
`.metadata.generation` changes — i.e. whenever someone deployed, by any
means. The **first sighting only records a baseline**, so labelling a
workload never triggers a verification storm.

The chart renders this into `KUBENTLY_VERIFY_WATCH_SECONDS` (sweep interval;
`0` = off) and `KUBENTLY_VERIFY_WATCH_CLUSTERS`.

## Verdict semantics

Identical on both paths — Cloud's bridge runs the same investigation.

- The API polls `kubectl rollout status --watch=false` through the executor
  channel until the rollout is **complete**, **failed**, or your deadline
  passes.
- **The investigation runs in every case** — a rollout that never settled is
  exactly when the evidence matters — and the settle outcome goes into the
  prompt, so the verdict reflects it.
- The agent opens its answer with `VERDICT: PASS` or `VERDICT: FAIL`. The
  parser tolerates case, model decoration and short preambles; anything it
  cannot read maps to **unknown**, which is treated like a failure for
  posting purposes. **An unparseable verdict never mutes a notification.**
- **Verifications always post** — pass or fail. A deploy is an event someone
  is actively watching, so silence is not a signal here (contrast
  [scheduled checks](/guides/scheduled-checks/), which stay quiet on pass).

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Cloud: Git host shows the webhook delivering but nothing happens | Signature mismatch — the secret on the Git host isn't the one on the CI/CD card | Re-copy the secret from **Settings → CI/CD**; redeliver the event from the Git host |
| Cloud: failures diagnosed, successful deploys never verified | "Verify deploys" is off, or no mapping resolves for that repo | Enable the toggle and add a repo → cluster/namespace/workload row in the mapping editor |
| Cloud: a flapping job posts once, not every run | The dedup window collapsed repeats of the same workflow+branch | Working as designed |
| Cloud: wrong events arriving | GitHub needs **Workflow runs** + **Deployment statuses**; GitLab needs **Pipeline events** | Fix the event selection on the Git host |
| `400 'cluster' is not a valid cluster id` | Typo, or the id doesn't match `executor.clusterId` | `kubently admin` → List Clusters |
| `400 'kind' contradicts workload prefix` | You sent both `kind: statefulset` and `workload: deploy/x` | Send one or the other |
| `400 'workload' is not a valid resource name` | A `kind/name` prefix that isn't deployment/statefulset/daemonset, or a non-DNS-1123 name | Use the bare name plus an explicit `kind` |
| `503 SLACK_WEBHOOK_URL is not configured` | Self-hosted non-dry-run with no Slack destination | Configure `api.slackWebhook`; or use `dry_run: true` while testing |
| `202` but no Slack message ever arrives | The investigation errored in the background | `kubectl logs -n kubently deploy/kubently-api`; reproduce with `dry_run: true` |
| Verification times out on a slow rollout | Deadline too short | Raise `timeout_seconds` (max 1800) or `KUBENTLY_VERIFY_TIMEOUT_SECONDS` |
| Labelled workload never verifies | The watch is off, or the cluster isn't in the list | Set `verifyDeployment.watch.enabled: true`; leave `clusters: []` for all |
| Verdict ignores metrics | Prometheus isn't configured for that cluster | [Wire Prometheus](/guides/observability/) — without it there is no pre-deploy window to compare against |

## Related

- [Alert-triggered diagnosis](/guides/alerts/) — the same per-tenant hook model, for Alertmanager.
- [Proactive checks](/guides/scheduled-checks/) — the same verdict contract, on cron.
- [Change correlation](/guides/change-correlation/) — what makes a FAIL name the revision that caused it.
- [GitOps remediation](/guides/gitops-remediation/) — from a FAIL to a proposed fix PR.
- Upstream: [the README's deployment-verification section](https://github.com/kubently/kubently#deployment-verification-did-that-deploy-actually-work)

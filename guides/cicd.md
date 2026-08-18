---
layout: page
title: CI/CD Integration
subtitle: Every deploy verified by a real investigation, from your pipeline.
permalink: /guides/cicd/
---

Add one step to the end of your deploy job and Kubently watches the rollout
settle, then runs a real post-deploy investigation — pods ready? events clean?
errors in the new logs? metrics regressed against the pre-deploy window? — and
posts a **PASS/FAIL verdict with the evidence** to Slack.

A rollout that never settled cannot be talked into a PASS.

<div class="alert alert-info">
📝 <strong>Scope note.</strong> The engine exposes one CI-facing endpoint:
<code>POST /webhooks/verify-deployment</code>. There is <strong>no separate
"pipeline failure" webhook</strong> in the open-source engine today — a failed
deploy job integrates through the same endpoint (see
<a href="#when-the-deploy-job-fails">When the deploy job fails</a>). The other
webhooks — <code>/webhooks/alertmanager</code>,
<code>/webhooks/fleet-report</code>, <code>/webhooks/scheduled-check</code> —
are covered in the <a href="/guides/alerts/">alerts</a> and
<a href="/guides/scheduled-checks/">scheduled checks</a> guides.
</div>

## Prerequisites

- A connected executor in each target cluster ([quickstart](/guides/quick-start/)).
- Slack delivery configured — `api.slackWebhook` self-hosted, or the managed
  [Slack app](/cloud/slack-app/) {% include cloud-badge.html %}. See
  [alerts](/guides/alerts/#1-slack-delivery). Verifications **always post**;
  a deploy is an event someone is actively watching, so silence is not a
  signal here.
- A Kubently API key stored as a CI secret.
- Optional but recommended: [Prometheus wired up](/guides/observability/) —
  it is what lets the verdict compare metrics against the pre-deploy window.

## The request

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

### Fields

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

## GitHub Actions

A complete deploy-and-verify workflow. The repo→cluster mapping lives in the
workflow, because Kubently identifies clusters by the executor's cluster id —
there is nothing to configure on the Kubently side.

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

      # Optional: when the deploy step itself failed, ask for an investigation
      # of what the cluster looks like now, with the CI context attached.
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

## GitLab CI

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

## When the deploy job fails

There is no dedicated pipeline-failure endpoint in the engine, and you don't
need one: a failed deploy is still a workload in a known cluster and
namespace, which is exactly what `/webhooks/verify-deployment` takes. Both
examples above use the same endpoint on the failure path, with two changes:

- a short `timeout_seconds` (the rollout has already failed — don't wait 15
  minutes to confirm it), and
- a `query` that tells the agent this came from a broken pipeline and what to
  look at first.

The verdict will be FAIL, and the evidence trail is the part you actually
want.

## The repo → cluster mapping

Kubently addresses clusters by the **cluster id** the executor registered
with (`executor.clusterId`). There is no repo registry on the Kubently side —
the mapping belongs in your pipeline, next to the credentials that already
decide where a repo deploys.

Two shapes work well:

```yaml
# 1. Per-environment job env (the examples above)
env:
  KUBENTLY_CLUSTER: prod-east
```

{% raw %}
```yaml
# 2. Matrix, for a repo that deploys to a fleet
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

Confirm the ids you're mapping to with `kubently admin` → *List Clusters*, or
see [multi-cluster](/guides/multi-cluster/).

## No CI access? Label the workload instead

If you can't (or don't want to) touch the pipeline, let the API notice deploys
itself. Label the workload and enable the watch:

```bash
kubectl -n shop label deploy/checkout-api kubently.io/verify=enabled
```

```yaml
# values.yaml
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

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `400 'cluster' is not a valid cluster id` | Typo, or the id doesn't match `executor.clusterId` | `kubently admin` → List Clusters |
| `400 'kind' contradicts workload prefix` | You sent both `kind: statefulset` and `workload: deploy/x` | Send one or the other |
| `400 'workload' is not a valid resource name` | A `kind/name` prefix that isn't deployment/statefulset/daemonset, or a non-DNS-1123 name | Use the bare name plus an explicit `kind` |
| `503 SLACK_WEBHOOK_URL is not configured` | Non-dry-run with no Slack destination | Configure `api.slackWebhook`; or use `dry_run: true` while testing |
| `202` but no Slack message ever arrives | The investigation errored in the background | `kubectl logs -n kubently deploy/kubently-api`; reproduce with `dry_run: true` |
| Verification times out on a slow rollout | Deadline too short | Raise `timeout_seconds` (max 1800) or `KUBENTLY_VERIFY_TIMEOUT_SECONDS` |
| Labelled workload never verifies | The watch is off, or the cluster isn't in the list | Set `verifyDeployment.watch.enabled: true`; leave `clusters: []` for all |
| Verdict ignores metrics | Prometheus isn't configured for that cluster | [Wire Prometheus](/guides/observability/) — without it there is no pre-deploy window to compare against |

## Related

- [Scheduled checks & fleet digests](/guides/scheduled-checks/) — the same verdict contract, on cron.
- [Change correlation](/guides/change-correlation/) — what makes a FAIL name the revision that caused it.
- [GitOps remediation](/guides/gitops-remediation/) — from a FAIL to a proposed fix PR.
- Upstream: [the README's deployment-verification section](https://github.com/kubently/kubently#deployment-verification-did-that-deploy-actually-work)

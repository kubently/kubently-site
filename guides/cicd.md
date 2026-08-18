---
layout: page
title: CI/CD Integration
subtitle: Failed pipelines diagnosed; deployments verified after they land.
permalink: /guides/cicd/
---

{% include guide-stub.html upstream="https://github.com/kubently/kubently#deployment-verification-did-that-deploy-actually-work" label="the engine README's deployment-verification section" %}

Two integration points connect Kubently to your delivery pipeline:

**Pipeline failure webhooks** — GitHub Actions and GitLab can notify Kubently
when a deploy job fails; the agent investigates the cluster state behind the
failure and posts what it found.

**Deployment verification** — tell Kubently what you just deployed
(`POST /webhooks/verify-deployment`) and it watches the rollout settle, then
runs a real post-deploy investigation: pods ready, events clean, no new error
logs, metrics not regressed vs the pre-deploy window. A PASS/FAIL verdict
with evidence lands in Slack. A rollout that never settled can't be talked
into a PASS.

```bash
curl -X POST https://<your-kubently-host>/webhooks/verify-deployment \
  -H "X-API-Key: <your-api-key>" -H 'Content-Type: application/json' \
  -d '{"cluster": "prod-east", "namespace": "shop",
       "workload": "deploy/checkout-api", "context": "v1.42.0"}'
```

This guide will cover:

- Wiring the GitHub Actions / GitLab failure webhooks
- Adding verification as the last pipeline step (with `dry_run` for testing)
- Zero-CI verification: label a workload `kubently.io/verify=enabled` and enable `verifyDeployment.watch` — every generation change gets verified unprompted
- Timeouts, verdict semantics, and where results are posted

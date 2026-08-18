---
layout: page
title: Cloud Quickstart
subtitle: From signup to a diagnosed cluster in minutes.
permalink: /docs/cloud-quickstart/
---

{% include cloud-badge.html %} This page covers **Kubently Cloud**, the managed
service. Prefer to run everything yourself? See the
[self-hosted quickstart](/guides/quick-start/) — same engine, Apache-2.0.

## 1. Sign up

Create a free account at [cloud.kubently.io](https://cloud.kubently.io) —
Google, GitHub, or email. Your tenant is provisioned automatically; there is
no credit card and no trial clock. The Free tier is a real plan:
1 cluster, 10 diagnoses a day, every evidence toolset.

## 2. Connect a cluster

The dashboard gives you a copy-paste Helm command that installs the Kubently
**executor** into your cluster with your tenant token:

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

A few things worth knowing about what you just installed:

- **Outbound-only.** The executor dials out to Kubently Cloud over TLS. No
  inbound ingress, no public endpoint on your cluster, nothing for us to
  reach into.
- **Read-only by construction.** The executor enforces a read-only command
  allowlist in its own code, and its RBAC role is read-only too — two
  independent barriers.
- **No credentials leave your cluster.** Your kubeconfig is never uploaded;
  Kubently only ever sees command results.

When the executor connects, the cluster shows up in your dashboard.

## 3. Ask something

Open chat in the dashboard and ask a real question:

> why is checkout-api crashlooping in prod?

The agent investigates with read-only kubectl and — where you've configured
them — Prometheus metrics, log search, change history, and cloud telemetry,
then answers with a root cause and the evidence trail.

## 4. Wire in your workflow (optional, recommended)

- **[Slack app](/cloud/slack-app/)** — two-way conversations in the channel where incidents already happen. *(Team plan)*
- **[Alert-triggered diagnosis](/guides/alerts/)** — point Alertmanager at your tenant's hook URL (no auth headers needed); alerts arrive pre-diagnosed.
- **[CI/CD integration](/guides/cicd/)** — point your Git host at your tenant's CI/CD hook: failed pipelines get diagnosed, successful deploys get verified.
- **[Cloud telemetry](/guides/cloud-telemetry/)** — give the executor a read-only cloud role via EKS Pod Identity / IRSA or GKE Workload Identity. Zero stored credentials.
- **[BYO-MCP integrations](/cloud/integrations/)** — connect your Grafana Cloud or Datadog MCP servers as evidence sources. *(Team plan)*

## Next steps

- [Organizations & roles](/cloud/organizations/) — invite your team.
- [Billing & plans](/cloud/billing/) — what's in each plan; see also [pricing](https://cloud.kubently.io/pricing).
- [Guides](/guides/) — everything the agent can do.

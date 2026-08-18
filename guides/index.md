---
layout: page
title: Guides
subtitle: Task-oriented guides for everything the agent can do.
permalink: /guides/
---

Guides apply to both Kubently Cloud and self-hosted deployments unless marked
with a {% include cloud-badge.html %} badge. Guides marked *(in progress)*
have an accurate outline and upstream links today, with the full walkthrough
on its way.

## Getting started

- **[Cloud quickstart](/docs/cloud-quickstart/)** {% include cloud-badge.html %} — signup to first diagnosis in minutes.
- **[Self-hosted quickstart](/guides/quick-start/)** — `kubently install` to a working debug chat.
- **[Basic usage](/guides/basic-usage/)** — asking good questions, reading diagnoses.
- **[CLI guide](/guides/cli/)** — the interactive terminal client.

## Proactive operations

- **[Alert-triggered diagnosis](/guides/alerts/)** *(in progress)* — Alertmanager → diagnosed RCA in Slack.
- **[CI/CD integration](/guides/cicd/)** *(in progress)* — GitHub Actions / GitLab failure webhooks and deployment verification.
- **[Scheduled checks & fleet digests](/guides/scheduled-checks/)** *(in progress)* — cron-scheduled investigations; quiet when healthy.

## Evidence sources

- **[Metrics & logs](/guides/observability/)** *(in progress)* — Prometheus, multi-pod log search, and Loki.
- **[Change correlation](/guides/change-correlation/)** *(in progress)* — rollout, Helm, ArgoCD, and event timelines.
- **[Cloud telemetry](/guides/cloud-telemetry/)** *(in progress)* — CloudWatch / Cloud Logging via workload identity, zero stored credentials.

## Knowledge & follow-through

- **[Operator runbooks](/guides/runbooks/)** *(in progress)* — your tribal knowledge, injected into investigations.
- **[Incident history & postmortems](/guides/incidents/)** *(in progress)* — searchable past diagnoses and postmortem export.
- **[GitOps remediation](/guides/gitops-remediation/)** *(in progress)* — propose-only PRs against your manifests repo.

## Fleet & interop

- **[Multi-cluster fleets](/guides/multi-cluster/)** *(in progress)* — registering executors across clusters; fleet fan-out questions.
- **[Multi-agent systems](/guides/multi-agent/)** — Kubently inside larger agent systems.
- **[A2A integration](/guides/a2a-integration/)** — the agent-to-agent protocol surface.

## Operations & safety

- **[Security](/guides/security/)** — the allowlist/RBAC/auth model and hardening.
- **[Troubleshooting](/guides/troubleshooting/)** — when Kubently itself misbehaves.
- **[Installation](/installation/)** — self-hosted install in depth.

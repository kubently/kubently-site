---
layout: page
title: Guides
subtitle: Task-oriented guides for everything the agent can do.
permalink: /guides/
---

Guides apply to both Kubently Cloud and self-hosted deployments unless marked
with a {% include cloud-badge.html %} badge. Each one leads with the outcome,
then prerequisites, copy-paste steps, verification, and troubleshooting.

## Getting started

- **[Cloud quickstart](/docs/cloud-quickstart/)** {% include cloud-badge.html %} — signup to first diagnosis in minutes.
- **[Self-hosted quickstart](/guides/quick-start/)** — `kubently install` to a working debug chat.
- **[Basic usage](/guides/basic-usage/)** — asking good questions, reading diagnoses.
- **[CLI guide](/guides/cli/)** — the interactive terminal client.

## Proactive operations

- **[Alert-triggered diagnosis](/guides/alerts/)** — Alertmanager → diagnosed RCA in Slack.
- **[CI/CD integration](/guides/cicd/)** — deployment verification from GitHub Actions and GitLab CI.
- **[Proactive checks](/guides/scheduled-checks/)** — cron-scheduled investigations and fleet digests; quiet when healthy.

## Evidence sources

- **[Metrics & logs](/guides/observability/)** — Prometheus, multi-pod log search, and Loki.
- **[Change correlation](/guides/change-correlation/)** — rollout, Helm, ArgoCD, and event timelines.
- **[Cloud telemetry](/guides/cloud-telemetry/)** — CloudWatch / Cloud Logging via workload identity; zero stored credentials.

## Knowledge & follow-through

- **[Operator runbooks](/guides/runbooks/)** — your tribal knowledge, injected into investigations.
- **[Incident history & postmortems](/guides/incidents/)** — searchable past diagnoses and postmortem export.
- **[GitOps remediation](/guides/gitops-remediation/)** — propose-only PRs against your manifests repo.

## Fleet & interop

- **[Multi-cluster fleets](/guides/multi-cluster/)** — registering executors across clusters; fleet fan-out questions.
- **[Multi-agent systems](/guides/multi-agent/)** — Kubently inside larger agent systems.
- **[A2A & MCP interop](/guides/a2a-integration/)** — Kubently as a sub-agent, and external MCP servers as evidence.

## Operations & safety

- **[Security](/guides/security/)** — the allowlist/RBAC/auth model and hardening.
- **[Troubleshooting](/guides/troubleshooting/)** — when Kubently itself misbehaves.
- **[Installation](/installation/)** — self-hosted install in depth.

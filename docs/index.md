---
layout: page
title: Documentation
subtitle: One engine, two ways to run it — pick your path.
permalink: /docs/
---

Kubently is an AI SRE for Kubernetes. The diagnosis engine is open source
(Apache-2.0); you can run it as **Kubently Cloud** (managed control plane) or
**self-hosted** in your own cluster. The docs below cover both — pages that
apply only to the managed service carry a {% include cloud-badge.html %} badge.

## Getting started

- **[Cloud quickstart](/docs/cloud-quickstart/)** {% include cloud-badge.html %} — sign up free, install the outbound-only executor, chat with your cluster in minutes.
- **[Self-hosted quickstart](/guides/quick-start/)** — one command (`kubently install`) deploys the full open-source stack in your own cluster. Apache-2.0 and free forever, with the engine's full capability.
- **[Installation](/installation/)** — self-hosted installation in depth: Helm values, manifests, secrets, production setups.

## Guides

Task-oriented guides for everything the agent can do — alert-triggered
diagnosis, CI/CD verification, scheduled checks, observability evidence
sources, runbooks, incident history, and GitOps remediation.

- **[Browse all guides →](/guides/)**

## Reference

- **[Reference hub](/docs/reference/)** — environment variables, Helm chart values, API, architecture.
- **[API Reference](/api/)** — REST, A2A, and MCP endpoints.
- **[Architecture](/architecture/)** — how the pieces fit together.

## Kubently Cloud

The managed layer on top of the open-source engine: auto-provisioned tenants,
organizations and roles, billing, the two-way Slack app, and managed BYO-MCP
integrations.

- **[Cloud overview](/cloud/)** {% include cloud-badge.html %}
- **[Organizations & roles](/cloud/organizations/)** {% include cloud-badge.html %}
- **[Billing & plans](/cloud/billing/)** {% include cloud-badge.html %}
- **[Slack app](/cloud/slack-app/)** {% include cloud-badge.html %}
- **[Integrations (BYO-MCP)](/cloud/integrations/)** {% include cloud-badge.html %}

## Engine source & upstream docs

Everything about the engine itself lives in the open-source repo:
[github.com/kubently/kubently](https://github.com/kubently/kubently) — including the
[README](https://github.com/kubently/kubently#readme),
[docs directory](https://github.com/kubently/kubently/tree/main/docs), and
[CHANGELOG](https://github.com/kubently/kubently/blob/main/CHANGELOG.md).

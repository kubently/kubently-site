---
layout: page
title: Kubently Cloud
subtitle: The managed layer on top of the open-source engine.
permalink: /cloud/
---

{% include cloud-badge.html %} **Kubently Cloud** runs the same open-source
diagnosis engine you can [self-host](/guides/quick-start/), with the
operational layer managed for you: a hosted control plane, auto-provisioned
tenants, organizations and roles, billing, the two-way Slack app, and managed
OAuth for external integrations.

Your clusters connect through the same **outbound-only, read-only executor**
as self-hosted deployments — Kubently Cloud never holds your kubeconfig or
cloud credentials.

## Start here

- **[Cloud quickstart](/docs/cloud-quickstart/)** — signup to first diagnosis in minutes.
- **[Pricing](/pricing/)** — Free, Team, and Enterprise plans.

## Cloud docs

- **[Organizations & roles](/cloud/organizations/)** — teams, membership, and access control.
- **[Billing & plans](/cloud/billing/)** — what each plan includes and how billing works.
- **[Slack app](/cloud/slack-app/)** — two-way incident conversations with thread memory.
- **[Integrations (BYO-MCP)](/cloud/integrations/)** — connect Grafana Cloud, Datadog, and other MCP servers.

## Cloud vs self-hosted

| | Cloud | Self-hosted |
|---|---|---|
| Diagnosis engine | Same (Apache-2.0) | Same (Apache-2.0) |
| Control plane | Managed | You run it |
| Auth | Managed accounts (Google/GitHub/email), org roles; SSO/SAML on Enterprise | Static API keys, optional OAuth/OIDC |
| Slack | Managed two-way Slack app | Incoming-webhook notifications |
| External MCP integrations | Managed per-tenant OAuth | Static config in Helm values |
| LLM keys | Included; BYOK on Team | Bring your own |
| Price | [Free tier + paid plans](/pricing/) | Free, always |

Both paths are first-class and stay that way — Cloud is where we run the
undifferentiated plumbing for you, not where features go to be paywalled.
The engine's capabilities land in the open-source repo.

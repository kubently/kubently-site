---
layout: page
title: Billing & Plans
subtitle: What each plan includes and how billing works.
permalink: /cloud/billing/
---

{% include cloud-badge.html %} Kubently Cloud has three plans — the full
comparison lives on the [pricing page](/pricing/).

- **Free** — $0. One cluster, 10 diagnoses per day, all evidence toolsets.
  No credit card required; it never expires into a paid plan.
- **Team** — $49 per cluster per month, with 2 months free on annual
  billing. Multi-cluster fleets, the Slack app, organizations and roles,
  BYO-MCP integrations, postmortem export, runbooks, and BYOK (bring your own
  LLM keys). Fair use of ~200 diagnoses per day per cluster.
- **Enterprise** — contact us. Everything in Team plus supported
  self-hosted/air-gapped deployments and SSO/SAML.

## How billing works

- Team is billed **per connected cluster** — connect a cluster, it counts;
  disconnect it, it stops counting at the next cycle.
- Annual billing is a straight discount: pay for 10 months, get 12.
- Hitting the Free tier's daily cap pauses further diagnoses until the next
  day — nothing is deleted and nothing auto-upgrades.
- Fair use on Team is a conversation, not an automatic overage charge.

<div class="alert alert-info">
📝 Detailed billing administration docs (invoices, payment methods, plan
changes mid-cycle) are being written. The billing section of the dashboard at
<a href="https://cloud.kubently.io">cloud.kubently.io</a> is self-serve for
all of the above.
</div>

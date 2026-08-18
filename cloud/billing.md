---
layout: page
title: Billing & Plans
subtitle: How Cloud billing works — plan details live on the pricing page.
permalink: /cloud/billing/
---

{% include cloud-badge.html %} Kubently Cloud has three plans — **Free**,
**Team**, and **Enterprise**. The authoritative plan comparison, limits, and
prices live at
**[cloud.kubently.io/pricing](https://cloud.kubently.io/pricing)** — that
page is built alongside the plan-enforcement code, so it always matches what
is actually enforced. This page covers only how billing behaves.

Self-hosting the open-source engine is not a plan and has no billing — it is
[free forever under Apache-2.0](/guides/quick-start/).

## How billing works

- **Team is billed per connected cluster.** Connect a cluster, it counts;
  disconnect it, it stops counting at the next cycle.
- **Annual billing is a straight discount** — pay for 10 months, get 12.
  Monthly billing has no lock-in.
- **Hitting the Free tier's daily cap pauses further diagnoses until the
  next day.** Nothing is deleted, nothing auto-upgrades, and no charge ever
  appears without you choosing a paid plan.
- **Fair use on Team is a conversation, not an automatic overage charge.**
  If you have a legitimate workload beyond it, talk to us.

<div class="alert alert-info">
📝 Detailed billing administration docs (invoices, payment methods, plan
changes mid-cycle) are being written. The billing section of the dashboard at
<a href="https://cloud.kubently.io">cloud.kubently.io</a> is self-serve for
all of the above.
</div>

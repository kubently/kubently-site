---
layout: page
title: Pricing
subtitle: Simple per-cluster pricing for Cloud. Self-hosted is free, forever.
permalink: /pricing/
---

<div class="pricing-grid">

  <!-- Free -->
  <div class="pricing-card">
    <p class="pricing-card__plan">Free</p>
    <p class="pricing-card__price">$0</p>
    <p class="pricing-card__tagline">Real diagnoses on a real cluster. No credit card, no trial clock.</p>
    <ul class="pricing-features">
      <li>1 cluster</li>
      <li>10 diagnoses per day</li>
      <li>All evidence toolsets — kubectl, Prometheus, log search, change correlation, cloud telemetry</li>
      <li>Chat via web, A2A, and MCP</li>
    </ul>
    <div class="pricing-card__cta">
      <a href="https://cloud.kubently.io" class="hero-btn hero-btn--secondary">Start free</a>
    </div>
  </div>

  <!-- Team -->
  <div class="pricing-card pricing-card--featured">
    <p class="pricing-card__plan">Team</p>
    <p class="pricing-card__price">$49 <span class="pricing-card__unit">/ cluster / month</span></p>
    <p class="pricing-card__tagline">For fleets and on-call teams. Pay annually and get 2 months free.</p>
    <ul class="pricing-features">
      <li>Everything in Free</li>
      <li>Multi-cluster fleets</li>
      <li>Two-way Slack app with thread memory</li>
      <li>Organizations &amp; roles</li>
      <li>BYO-MCP integrations (Grafana Cloud, Datadog, …)</li>
      <li>Postmortem export &amp; operator runbooks</li>
      <li>Bring your own LLM keys (BYOK)</li>
      <li class="pricing-features__meta">Fair use: ~200 diagnoses / day / cluster</li>
    </ul>
    <div class="pricing-card__cta">
      <a href="https://cloud.kubently.io" class="hero-btn hero-btn--primary">Start free, upgrade in-app</a>
    </div>
  </div>

  <!-- Enterprise -->
  <div class="pricing-card">
    <p class="pricing-card__plan">Enterprise</p>
    <p class="pricing-card__price">Contact us</p>
    <p class="pricing-card__tagline">For orgs with compliance, isolation, or scale requirements.</p>
    <ul class="pricing-features">
      <li>Everything in Team</li>
      <li>Supported self-hosted &amp; air-gapped deployments</li>
      <li>SSO / SAML</li>
    </ul>
    <div class="pricing-card__cta">
      <a href="mailto:hello@kubently.io" class="hero-btn hero-btn--secondary">Talk to us</a>
    </div>
  </div>

</div>

<!-- Self-hosted: co-equal, always free -->
<div class="selfhost-band">
  <div>
    <h2 class="selfhost-band__title">Self-hosted — <span class="selfhost-band__free">always free</span></h2>
    <p class="selfhost-band__desc">
      The full Kubently engine is open source under Apache-2.0 — every evidence
      toolset, every webhook, unlimited clusters and diagnoses, your own LLM
      keys. The difference from Cloud isn't capability: you run the control
      plane yourself and use static configuration instead of managed auth,
      organizations, and the hosted Slack app. It is not a trial and it will
      not be walked back.
    </p>
  </div>
  <div class="selfhost-band__actions">
    <a href="{{ '/guides/quick-start/' | relative_url }}" class="hero-btn hero-btn--primary">Self-hosted quickstart</a>
    <a href="https://github.com/kubently/kubently" class="hero-btn hero-btn--secondary">View on GitHub</a>
  </div>
</div>

## Honest answers

**Is the self-hosted version feature-limited?**
No. Cloud and self-hosted run the same open-source diagnosis engine. Cloud
adds the managed layer — hosted control plane, organizations and roles,
billing, the managed Slack app, and per-tenant OAuth for BYO-MCP
integrations. Self-hosted configures the equivalents statically where they
exist.

**What counts as a diagnosis?**
One investigation: a chat question, a webhook-triggered alert diagnosis, a
deployment verification, or a scheduled check run. Follow-up questions in
the same thread are part of the same conversation.

**What does "fair use" mean on Team?**
Around 200 diagnoses per day per cluster — roughly an alert storm plus a busy
on-call rotation. It exists to keep per-cluster pricing simple; if you have a
legitimate workload beyond it, talk to us rather than expecting a surprise
bill. We don't charge overages automatically.

**What happens if I hit the Free limit?**
Diagnoses beyond 10 per day wait until the next day. Your data, history, and
cluster connection stay intact — nothing is deleted and nothing starts
charging you.

**Can I switch between Cloud and self-hosted?**
Yes. The executor and the engine are the same Apache-2.0 code either way, so
moving is a redeploy, not a migration off a proprietary system.

**How does annual billing work?**
Pay for 10 months, get 12 — a straight 2-months-free discount. Monthly
billing has no lock-in.

<p class="pricing-footnote">
Prices in USD. The Free tier requires no payment method. Plan limits and
pricing are stated here in full — if something on this page is unclear,
that's a bug: <a href="mailto:hello@kubently.io">hello@kubently.io</a>.
</p>

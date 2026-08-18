---
layout: home
title: Kubently
subtitle: AI SRE for Kubernetes — alerts in, diagnosed root causes out
---

<div class="hero-section" aria-label="Hero">
  <div class="hero-glow" aria-hidden="true"></div>

  <div class="hero-inner">

    <!-- Left column: copy -->
    <div class="hero-copy">
      <p class="hero-kicker" aria-label="tagline">// AI SRE for Kubernetes</p>

      <h1 class="hero-headline">
        Alerts come in.<br>
        <em class="hero-headline__accent">Root causes come out.</em>
      </h1>

      <p class="hero-subtitle">
        Kubently investigates your clusters the way an SRE would — read-only
        kubectl, <strong>Prometheus metrics</strong>, multi-pod log search,
        <strong>change history</strong>, and cloud telemetry — then posts a
        diagnosed RCA to Slack with the evidence attached.
      </p>

      <div class="hero-ctas">
        <a href="https://cloud.kubently.io" class="hero-btn hero-btn--primary">
          Start free
        </a>
        <a href="{{ '/guides/quick-start/' | relative_url }}" class="hero-btn hero-btn--secondary">
          Self-host — Apache-2.0
        </a>
      </div>

      <div class="hero-badges" aria-label="Project badges">
        <img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="Apache 2.0 License">
        <img src="https://img.shields.io/badge/kubernetes-1.28+-326ce5.svg" alt="Kubernetes 1.28+">
        <img src="https://img.shields.io/badge/A2A%20%2B%20MCP-interop-2dd4bf.svg" alt="A2A and MCP interop">
      </div>
    </div>

    <!-- Right column: live terminal -->
    <div class="hero-terminal" aria-label="Live diagnosis demo">
      <div class="terminal-window">
        <div class="terminal-chrome" aria-hidden="true">
          <span class="terminal-dot terminal-dot--red"></span>
          <span class="terminal-dot terminal-dot--yellow"></span>
          <span class="terminal-dot terminal-dot--green"></span>
          <span class="terminal-chrome__title">#incidents — Slack</span>
        </div>
        <div class="terminal-body" role="log" aria-live="polite" aria-label="Diagnosis output">
          <div id="typewriter" class="typewriter-content"></div>
        </div>
      </div>
    </div>

  </div>
</div>

<!-- =========================================================================
     Evidence: what Kubently actually investigates
     ========================================================================= -->
<section class="features-section" aria-labelledby="evidence-heading">
  <div class="features-inner">

    <div class="features-header">
      <p class="features-eyebrow" aria-hidden="true">EVIDENCE</p>
      <h2 class="features-h2" id="evidence-heading">Diagnosis, not guesswork</h2>
    </div>

    <div class="features-grid">

      <!-- 1: Read-only kubectl -->
      <div class="feature-card">
        <div class="feature-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8M12 17v4"/>
            <path d="M7 8l2 2-2 2"/>
            <path d="M13 10h4"/>
          </svg>
        </div>
        <h3 class="feature-card__title">Read-only kubectl</h3>
        <p class="feature-card__desc">Pods, events, rollout status, resource specs — across every cluster in your fleet, in parallel.</p>
      </div>

      <!-- 2: Prometheus metrics -->
      <div class="feature-card">
        <div class="feature-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <h3 class="feature-card__title">Prometheus metrics</h3>
        <p class="feature-card__desc">PromQL for what kubectl can't see: latency, saturation, OOM trends, restarts over time.</p>
      </div>

      <!-- 3: Log search -->
      <div class="feature-card">
        <div class="feature-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>
        <h3 class="feature-card__title">Multi-pod log search</h3>
        <p class="feature-card__desc">Regex search across every matching pod — plus Loki for historical logs from pods that no longer exist.</p>
      </div>

      <!-- 4: Change correlation -->
      <div class="feature-card">
        <div class="feature-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h3 class="feature-card__title">Change correlation</h3>
        <p class="feature-card__desc">Rollout history, Helm releases, ArgoCD syncs, and events on one timeline — “what changed before this broke?”</p>
      </div>

      <!-- 5: Cloud telemetry -->
      <div class="feature-card">
        <div class="feature-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
          </svg>
        </div>
        <h3 class="feature-card__title">Cloud telemetry</h3>
        <p class="feature-card__desc">CloudWatch, CloudTrail, Cloud Logging, and GKE audit logs via workload identity — zero stored credentials.</p>
      </div>

      <!-- 6: Incident memory -->
      <div class="feature-card">
        <div class="feature-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <h3 class="feature-card__title">Incident memory</h3>
        <p class="feature-card__desc">Past diagnoses become searchable history — “have we seen this before?” gets a real answer, with runbooks applied.</p>
      </div>

    </div><!-- /.features-grid -->
  </div><!-- /.features-inner -->
</section>

<!-- =========================================================================
     Security posture
     ========================================================================= -->
<section class="usecases-section" aria-labelledby="security-heading">
  <div class="usecases-inner">

    <div class="usecases-header">
      <p class="usecases-eyebrow" aria-hidden="true">SECURITY</p>
      <h2 class="usecases-h2" id="security-heading">Zero credentials to steal</h2>
    </div>

    <div class="usecases-grid">

      <!-- 1: Outbound-only -->
      <div class="usecase-card">
        <div class="usecase-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 19V5"/>
            <path d="M5 12l7-7 7 7"/>
            <rect x="3" y="19" width="18" height="2" rx="1"/>
          </svg>
        </div>
        <h3 class="usecase-card__title">Outbound-only executor</h3>
        <p class="usecase-card__desc">The in-cluster executor dials out. No inbound ingress, no shared kubeconfig, no per-cluster credentials to distribute.</p>
      </div>

      <!-- 2: Read-only by construction -->
      <div class="usecase-card">
        <div class="usecase-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
        </div>
        <h3 class="usecase-card__title">Read-only by construction</h3>
        <p class="usecase-card__desc">Command allowlists enforced in code on the executor itself — RBAC is a second barrier, never the only one.</p>
      </div>

      <!-- 3: Workload identity -->
      <div class="usecase-card">
        <div class="usecase-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h3 class="usecase-card__title">Workload identity</h3>
        <p class="usecase-card__desc">Cloud access via EKS Pod Identity / IRSA or GKE Workload Identity, assuming a read-only role you control. Nothing stored, instantly revocable.</p>
      </div>

    </div><!-- /.usecases-grid -->
  </div><!-- /.usecases-inner -->
</section>

<!-- =========================================================================
     In your workflow
     ========================================================================= -->
<section class="features-section" aria-labelledby="workflow-heading">
  <div class="features-inner">

    <div class="features-header">
      <p class="features-eyebrow" aria-hidden="true">WORKFLOW</p>
      <h2 class="features-h2" id="workflow-heading">It meets you where incidents happen</h2>
    </div>

    <div class="features-grid">

      <!-- 1: Slack -->
      <div class="feature-card">
        <div class="feature-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h3 class="feature-card__title">Two-way Slack</h3>
        <p class="feature-card__desc">Ask follow-ups in the thread — Kubently keeps the investigation's context and digs deeper.</p>
      </div>

      <!-- 2: Alertmanager -->
      <div class="feature-card">
        <div class="feature-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <h3 class="feature-card__title">Alert-triggered RCA</h3>
        <p class="feature-card__desc">Point Alertmanager at Kubently — firing alerts arrive in Slack already diagnosed.</p>
      </div>

      <!-- 3: CI/CD -->
      <div class="feature-card">
        <div class="feature-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="18" r="3"/>
            <circle cx="6" cy="6" r="3"/>
            <path d="M6 9v6a3 3 0 0 0 3 3h6"/>
          </svg>
        </div>
        <h3 class="feature-card__title">CI/CD verification</h3>
        <p class="feature-card__desc">GitHub Actions and GitLab failure webhooks, plus post-deploy verification with a PASS/FAIL verdict and evidence.</p>
      </div>

      <!-- 4: Scheduled checks -->
      <div class="feature-card">
        <div class="feature-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
        </div>
        <h3 class="feature-card__title">Scheduled checks</h3>
        <p class="feature-card__desc">Cron-scheduled investigations and fleet health digests — passing checks stay silent, failures post with evidence.</p>
      </div>

      <!-- 5: Runbooks + postmortems -->
      <div class="feature-card">
        <div class="feature-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="8" y1="13" x2="16" y2="13"/>
            <line x1="8" y1="17" x2="16" y2="17"/>
          </svg>
        </div>
        <h3 class="feature-card__title">Runbooks &amp; postmortems</h3>
        <p class="feature-card__desc">Your operational knowledge guides investigations; finished incidents export as postmortem drafts.</p>
      </div>

      <!-- 6: GitOps remediation -->
      <div class="feature-card">
        <div class="feature-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="6" cy="6" r="3"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="12" r="3"/>
            <path d="M6 9v6M9 6h3a3 3 0 0 1 3 3v0"/>
          </svg>
        </div>
        <h3 class="feature-card__title">GitOps remediation</h3>
        <p class="feature-card__desc">Propose-only PRs against your manifests repo, evidence included. A human reviews and merges — always off unless you turn it on.</p>
      </div>

    </div><!-- /.features-grid -->
  </div><!-- /.features-inner -->
</section>

<!-- =========================================================================
     Interop: A2A + MCP
     ========================================================================= -->
<section class="connect-section" aria-labelledby="connect-heading">
  <div class="connect-inner">

    <div class="connect-header">
      <p class="connect-eyebrow" aria-hidden="true">INTEROP</p>
      <h2 class="connect-h2" id="connect-heading">Plays well with other agents</h2>
      <p class="connect-subtitle">Kubently speaks the open protocols — call it from any agent or AI client, and bring your own tools to it.</p>
    </div>

    <div class="connect-grid">

      <!-- Card 1: A2A + MCP server -->
      <div class="connect-card">
        <div class="connect-card__header">
          <h3 class="connect-card__title">A2A + MCP server</h3>
          <p class="connect-card__subtitle">Kubently as a tool for your agents</p>
        </div>
        <p class="connect-card__desc">A full conversational agent over the <a href="https://a2a-protocol.org" target="_blank" rel="noopener noreferrer">A2A protocol</a>, and an MCP endpoint for Claude Code, Cursor, or your own client — one <code>ask_kubently</code> tool puts the whole diagnosis loop behind your AI.</p>
        <pre class="connect-code" aria-label="MCP setup commands"><code># add Kubently to Claude Code
npm install -g @kubently/cli
claude mcp add kubently -- kubently mcp</code></pre>
        <a class="connect-guide-link" href="https://github.com/kubently/kubently/blob/main/docs/MCP.md" target="_blank" rel="noopener noreferrer">Read the MCP guide &rarr;</a>
      </div>

      <!-- Card 2: BYO-MCP -->
      <div class="connect-card">
        <div class="connect-card__header">
          <h3 class="connect-card__title">
            Bring your own MCP
            <span class="connect-badge" aria-label="Cloud feature">Cloud</span>
          </h3>
          <p class="connect-card__subtitle">Your observability tools, inside the investigation</p>
        </div>
        <p class="connect-card__desc">Connect your Grafana Cloud or Datadog MCP servers and Kubently uses them as evidence sources alongside kubectl, metrics, and logs. Managed per-tenant OAuth in Kubently Cloud; static config self-hosted.</p>
        <pre class="connect-code" aria-label="External MCP config example"><code># self-hosted: static config in Helm values
mcpServers:
  - name: grafana
    url: https://mcp.grafana.example.com/mcp
    bearer_token_env: GRAFANA_MCP_TOKEN</code></pre>
        <a class="connect-guide-link" href="{{ '/cloud/integrations/' | relative_url }}">Cloud integrations &rarr;</a>
      </div>

    </div><!-- /.connect-grid -->
  </div><!-- /.connect-inner -->
</section>

<!-- =========================================================================
     Two paths: Cloud + self-hosted
     ========================================================================= -->
<section class="connect-section" aria-labelledby="paths-heading">
  <div class="connect-inner">

    <div class="connect-header">
      <p class="connect-eyebrow" aria-hidden="true">DEPLOY</p>
      <h2 class="connect-h2" id="paths-heading">One engine. Two ways to run it.</h2>
      <p class="connect-subtitle">Same open-source diagnosis engine either way — pick managed or self-managed, not a different product.</p>
    </div>

    <div class="connect-grid">

      <!-- Cloud -->
      <div class="connect-card">
        <div class="connect-card__header">
          <h3 class="connect-card__title">Kubently Cloud</h3>
          <p class="connect-card__subtitle">Managed control plane · free tier · no card required</p>
        </div>
        <p class="connect-card__desc">Sign up, install the outbound-only executor with one Helm command, and chat with your cluster immediately. Organizations, roles, the Slack app, and BYO-MCP integrations come managed.</p>
        <pre class="connect-code" aria-label="Cloud install"><code># after signing up at cloud.kubently.io
helm install kubently-executor kubently/executor \
  --set token=&lt;your-tenant-token&gt;   # outbound-only</code></pre>
        <a class="connect-guide-link" href="https://cloud.kubently.io">Start free &rarr;</a>
      </div>

      <!-- Self-hosted -->
      <div class="connect-card">
        <div class="connect-card__header">
          <h3 class="connect-card__title">Self-hosted</h3>
          <p class="connect-card__subtitle">Apache-2.0 · full engine · always free</p>
        </div>
        <p class="connect-card__desc">Run the whole thing in your own cluster — every evidence toolset, every webhook, your own LLM keys. Static config instead of managed auth. No feature gates, no time bombs.</p>
        <pre class="connect-code" aria-label="Self-hosted install"><code>npm install -g @kubently/cli
kubently install   # Helm + secrets + chat, one command</code></pre>
        <a class="connect-guide-link" href="{{ '/guides/quick-start/' | relative_url }}">Self-hosted quickstart &rarr;</a>
      </div>

    </div><!-- /.connect-grid -->

    <p class="flow-caption"><a href="{{ '/pricing/' | relative_url }}">Compare plans on the pricing page &rarr;</a></p>

  </div><!-- /.connect-inner -->
</section>

<!-- =========================================================================
     Final CTA band
     ========================================================================= -->
<section class="cta-band" aria-labelledby="cta-heading">
  <div class="cta-band__inner">
    <h2 class="cta-band__h2" id="cta-heading">Your next incident is already scheduled</h2>
    <p class="cta-band__sub">Be ready before it fires — free tier, one cluster, real diagnoses.</p>
    <div class="cta-band__actions">
      <a href="https://cloud.kubently.io" class="hero-btn hero-btn--primary">
        Start free
      </a>
      <a href="https://github.com/kubently/kubently" class="hero-btn hero-btn--secondary">
        Self-host from GitHub
      </a>
    </div>
  </div>
</section>

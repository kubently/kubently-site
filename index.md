---
layout: home
title: Kubently
subtitle: Troubleshoot Kubernetes Agentically - AI-Powered Conversational Debugging
---

<div class="hero-section" aria-label="Hero">
  <div class="hero-glow" aria-hidden="true"></div>

  <div class="hero-inner">

    <!-- Left column: copy -->
    <div class="hero-copy">
      <p class="hero-kicker" aria-label="tagline">// Kubernetes, agentically</p>

      <h1 class="hero-headline">
        Debug clusters by<br>
        <em class="hero-headline__accent">talking to them.</em>
      </h1>

      <p class="hero-subtitle">
        An AI agent that runs read-only kubectl across every cluster — over the
        <strong>A2A protocol</strong> or <strong>MCP</strong> — and tells you
        what's actually wrong.
      </p>

      <div class="hero-ctas">
        <a href="{{ '/guides/quick-start/' | relative_url }}" class="hero-btn hero-btn--primary">
          Get started
        </a>
        <a href="https://github.com/kubently/kubently" class="hero-btn hero-btn--secondary">
          View on GitHub
        </a>
      </div>

      <div class="hero-badges" aria-label="Project badges">
        <img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="Apache 2.0 License">
        <img src="https://img.shields.io/badge/python-3.13+-blue.svg" alt="Python 3.13+">
        <img src="https://img.shields.io/badge/kubernetes-1.28+-326ce5.svg" alt="Kubernetes 1.28+">
      </div>
    </div>

    <!-- Right column: live terminal -->
    <div class="hero-terminal" aria-label="Live debug session demo">
      <div class="terminal-window">
        <div class="terminal-chrome" aria-hidden="true">
          <span class="terminal-dot terminal-dot--red"></span>
          <span class="terminal-dot terminal-dot--yellow"></span>
          <span class="terminal-dot terminal-dot--green"></span>
          <span class="terminal-chrome__title">kubently — zsh</span>
        </div>
        <div class="terminal-body" role="log" aria-live="polite" aria-label="Terminal output">
          <div id="typewriter" class="typewriter-content"></div>
        </div>
      </div>
    </div>

  </div>
</div>

<!-- =========================================================================
     Task 9: Connect section — A2A + MCP protocols
     ========================================================================= -->
<section class="connect-section" aria-labelledby="connect-heading">
  <div class="connect-inner">

    <div class="connect-header">
      <p class="connect-eyebrow" aria-hidden="true">CONNECT</p>
      <h2 class="connect-h2" id="connect-heading">Speaks your agent's language</h2>
      <p class="connect-subtitle">Plug Kubently into any AI client — two open protocols, same read-only cluster access.</p>
    </div>

    <div class="connect-grid">

      <!-- Card 1: A2A Protocol -->
      <div class="connect-card">
        <div class="connect-card__header">
          <h3 class="connect-card__title">A2A Protocol</h3>
          <p class="connect-card__subtitle">Full conversational agent over <code>/a2a/</code></p>
        </div>
        <p class="connect-card__desc">Talk to Kubently in natural language. It plans, runs kubectl, and streams findings back over SSE.</p>
        <pre class="connect-code" aria-label="A2A curl example"><code>curl -X POST https://kubently.io/a2a/ \
  -H "X-API-Key: $KUBENTLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"message/stream",
       "params":{"message":{"messageId":"1","role":"user",
       "parts":[{"text":"show crashing pods in prod-eu"}]}}}'</code></pre>
      </div>

      <!-- Card 2: MCP -->
      <div class="connect-card">
        <div class="connect-card__header">
          <h3 class="connect-card__title">
            MCP
            <span class="connect-badge" aria-label="New">New</span>
          </h3>
          <p class="connect-card__subtitle">Tools for any MCP client over <code>/mcp</code></p>
        </div>
        <p class="connect-card__desc">Connect Claude Code, Cursor, or your own agent. One natural-language tool — <code>ask_kubently</code> — puts Kubently's diagnosis loop behind your AI client. Listed in the <a href="https://registry.modelcontextprotocol.io" target="_blank" rel="noopener noreferrer">official MCP registry</a>.</p>
        <pre class="connect-code" aria-label="MCP setup commands"><code># two lines, that's it
npm install -g @kubently/cli
claude mcp add kubently -- kubently mcp

# or connect over HTTP directly
{ "type": "streamable-http",
  "url": "https://&lt;your-host&gt;/mcp/",
  "headers": { "X-API-Key": "&lt;your-api-key&gt;" } }</code></pre>
        <a class="connect-guide-link" href="https://github.com/kubently/kubently/blob/main/docs/MCP.md" target="_blank" rel="noopener noreferrer">Read the MCP guide &rarr;</a>
      </div>

    </div><!-- /.connect-grid -->
  </div><!-- /.connect-inner -->
</section>

<!-- =========================================================================
     Task 10: How It Works — animated architecture flow
     ========================================================================= -->
<section class="flow-section" aria-labelledby="flow-heading">
  <div class="flow-inner">

    <div class="flow-header">
      <p class="flow-eyebrow" aria-hidden="true">HOW IT WORKS</p>
      <h2 class="flow-h2" id="flow-heading">One agent. Every cluster.</h2>
      <p class="flow-subtitle">Read-only, RBAC-scoped, ~50ms round trips.</p>
    </div>

    <!-- Flow diagram -->
    <div class="flow-diagram" role="img" aria-label="Architecture flow: AI Agent to Kubently API to Executor to Cluster">

      <!-- Node 1: AI Agent -->
      <div class="flow-node">
        <div class="flow-node__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="3"/>
            <path d="M12 11v2m-4 5a8 8 0 0 1 8 0"/>
            <rect x="3" y="3" width="18" height="18" rx="3"/>
          </svg>
        </div>
        <span class="flow-node__name">AI Agent</span>
        <span class="flow-node__sub">A2A &middot; MCP</span>
      </div>

      <!-- Arrow 1 with animated packet -->
      <div class="flow-arrow" aria-hidden="true">
        <div class="flow-arrow__track">
          <div class="flow-packet flow-packet--1"></div>
        </div>
        <svg class="flow-arrow__svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--border-2)" stroke-width="1.5" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6"/>
        </svg>
      </div>

      <!-- Node 2: Kubently API (highlighted) -->
      <div class="flow-node flow-node--accent">
        <div class="flow-node__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span class="flow-node__name">Kubently API</span>
        <span class="flow-node__sub">FastAPI</span>
      </div>

      <!-- Arrow 2 with animated packet -->
      <div class="flow-arrow" aria-hidden="true">
        <div class="flow-arrow__track">
          <div class="flow-packet flow-packet--2"></div>
        </div>
        <svg class="flow-arrow__svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--border-2)" stroke-width="1.5" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6"/>
        </svg>
      </div>

      <!-- Node 3: Executor -->
      <div class="flow-node">
        <div class="flow-node__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8M12 17v4"/>
            <path d="M7 8l2 2-2 2"/>
            <path d="M13 10h4"/>
          </svg>
        </div>
        <span class="flow-node__name">Executor</span>
        <span class="flow-node__sub">in-cluster</span>
      </div>

      <!-- Arrow 3 with animated packet -->
      <div class="flow-arrow" aria-hidden="true">
        <div class="flow-arrow__track">
          <div class="flow-packet flow-packet--3"></div>
        </div>
        <svg class="flow-arrow__svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--border-2)" stroke-width="1.5" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6"/>
        </svg>
      </div>

      <!-- Node 4: Cluster -->
      <div class="flow-node">
        <div class="flow-node__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 2l9 4.5V12c0 5-3.5 9.3-9 11-5.5-1.7-9-6-9-11V6.5L12 2z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
        </div>
        <span class="flow-node__name">Cluster</span>
        <span class="flow-node__sub">read-only</span>
      </div>

    </div><!-- /.flow-diagram -->

    <p class="flow-caption" aria-hidden="true">Live command flow &middot; SSE streaming &middot; multi-cluster</p>

  </div><!-- /.flow-inner -->
</section>

<!-- =========================================================================
     Task 10: Features grid
     ========================================================================= -->
<section class="features-section" aria-labelledby="features-heading">
  <div class="features-inner">

    <div class="features-header">
      <p class="features-eyebrow" aria-hidden="true">FEATURES</p>
      <h2 class="features-h2" id="features-heading">Built for real troubleshooting</h2>
    </div>

    <div class="features-grid">

      <!-- 1: Real-time debugging -->
      <div class="feature-card">
        <div class="feature-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <h3 class="feature-card__title">Real-time debugging</h3>
        <p class="feature-card__desc">~50ms command delivery over Server-Sent Events. Results stream back as they happen.</p>
      </div>

      <!-- 2: Secure by default -->
      <div class="feature-card">
        <div class="feature-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
        </div>
        <h3 class="feature-card__title">Secure by default</h3>
        <p class="feature-card__desc">Read-only operations, command validation, and Kubernetes RBAC on every cluster.</p>
      </div>

      <!-- 3: AI-native -->
      <div class="feature-card">
        <div class="feature-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
        </div>
        <h3 class="feature-card__title">AI-native</h3>
        <p class="feature-card__desc">Multi-LLM support with the A2A protocol and MCP — connect any agent or provider.</p>
      </div>

      <!-- 4: Simple deployment -->
      <div class="feature-card">
        <div class="feature-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        <h3 class="feature-card__title">Simple deployment</h3>
        <p class="feature-card__desc">One API service plus lightweight executors. Deploy anywhere Kubernetes runs.</p>
      </div>

      <!-- 5: Scales horizontally -->
      <div class="feature-card">
        <div class="feature-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="6" height="10" rx="1"/>
            <rect x="9" y="4" width="6" height="13" rx="1"/>
            <rect x="16" y="2" width="6" height="15" rx="1"/>
          </svg>
        </div>
        <h3 class="feature-card__title">Scales horizontally</h3>
        <p class="feature-card__desc">Redis pub/sub fans out commands across unlimited API pods.</p>
      </div>

      <!-- 6: Flexible integration -->
      <div class="feature-card">
        <div class="feature-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </div>
        <h3 class="feature-card__title">Flexible integration</h3>
        <p class="feature-card__desc">REST API, Node.js CLI, A2A, and MCP — meet your stack where it is.</p>
      </div>

    </div><!-- /.features-grid -->
  </div><!-- /.features-inner -->
</section>

<!-- =========================================================================
     Task 10: Use cases grid
     ========================================================================= -->
<section class="usecases-section" aria-labelledby="usecases-heading">
  <div class="usecases-inner">

    <div class="usecases-header">
      <p class="usecases-eyebrow" aria-hidden="true">USE CASES</p>
      <h2 class="usecases-h2" id="usecases-heading">From incident to root cause</h2>
    </div>

    <div class="usecases-grid">

      <!-- 1: Proactive diagnosis -->
      <div class="usecase-card">
        <div class="usecase-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <h3 class="usecase-card__title">Proactive diagnosis</h3>
        <p class="usecase-card__desc">Point Alertmanager at Kubently — firing alerts arrive in Slack already diagnosed.</p>
      </div>

      <!-- 2: Multi-agent systems -->
      <div class="usecase-card">
        <div class="usecase-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </div>
        <h3 class="usecase-card__title">Multi-agent systems</h3>
        <p class="usecase-card__desc">Full A2A implementation with tool-call interception and streaming.</p>
      </div>

      <!-- 3: Enterprise ready -->
      <div class="usecase-card">
        <div class="usecase-card__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <h3 class="usecase-card__title">Enterprise ready</h3>
        <p class="usecase-card__desc">OAuth/OIDC auth, TLS via cert-manager, audit logging.</p>
      </div>

    </div><!-- /.usecases-grid -->
  </div><!-- /.usecases-inner -->
</section>

<!-- =========================================================================
     Task 10: Final CTA band
     ========================================================================= -->
<section class="cta-band" aria-labelledby="cta-heading">
  <div class="cta-band__inner">
    <h2 class="cta-band__h2" id="cta-heading">Start debugging agentically</h2>
    <p class="cta-band__sub">One command — <code>kubently install</code> — and you're chatting with your cluster in about a minute.</p>
    <div class="cta-band__actions">
      <a href="/guides/quick-start/" class="hero-btn hero-btn--primary">
        Get started
      </a>
      <a href="https://github.com/kubently/kubently" class="hero-btn hero-btn--secondary">
        View on GitHub
      </a>
    </div>
  </div>
</section>

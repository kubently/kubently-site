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
        <p class="connect-card__desc">Connect Claude Desktop, Cursor, or your own agent. Kubently exposes <code>list_clusters</code> and <code>execute_kubectl</code> as MCP tools.</p>
        <pre class="connect-code" aria-label="MCP configuration JSON"><code>{
  "mcpServers": {
    "kubently": {
      "type": "streamable-http",
      "url": "https://kubently.io/mcp",
      "headers": { "X-API-Key": "&lt;your-api-key&gt;" }
    }
  }
}</code></pre>
        <a class="connect-guide-link" href="https://github.com/kubently/kubently/blob/main/docs/MCP.md" target="_blank" rel="noopener noreferrer">Read the MCP guide &rarr;</a>
      </div>

    </div><!-- /.connect-grid -->
  </div><!-- /.connect-inner -->
</section>

<div class="wrapper">
  <div class="features">
    <div class="feature reveal">
      <span class="feature-icon">🚀</span>
      <h3 class="feature-title">Real-time Debugging</h3>
      <p class="feature-description">~50ms command delivery via Server-Sent Events (SSE) with instant execution</p>
    </div>
    
    <div class="feature reveal">
      <span class="feature-icon">🔒</span>
      <h3 class="feature-title">Secure by Default</h3>
      <p class="feature-description">Read-only operations with comprehensive command validation and RBAC integration</p>
    </div>
    
    <div class="feature reveal">
      <span class="feature-icon">🤖</span>
      <h3 class="feature-title">AI-Native Design</h3>
      <p class="feature-description">Multi-LLM support with native A2A (Agent-to-Agent) protocol for any LLM provider</p>
    </div>
    
    <div class="feature reveal">
      <span class="feature-icon">📦</span>
      <h3 class="feature-title">Simple Deployment</h3>
      <p class="feature-description">Single API service with lightweight executors - deploy anywhere Kubernetes runs</p>
    </div>
    
    <div class="feature reveal">
      <span class="feature-icon">⚡</span>
      <h3 class="feature-title">Auto-scaling Performance</h3>
      <p class="feature-description">Horizontal scaling with Redis pub/sub - supports unlimited API pods</p>
    </div>
    
    <div class="feature reveal">
      <span class="feature-icon">🔌</span>
      <h3 class="feature-title">Flexible Integration</h3>
      <p class="feature-description">REST API, Node.js CLI, and comprehensive test automation framework</p>
    </div>
  </div>
</div>

## Architecture

<div class="architecture-diagram reveal">
  <img src="{{ '/assets/images/architecture-diagram.svg' | relative_url }}" alt="Kubently Architecture Diagram" style="max-width: 100%; height: auto;">
</div>

### Core Components

1. **Kubently API**: Horizontally scalable FastAPI service with A2A server for multi-agent communication
2. **Kubently Executor**: Lightweight agent deployed in each target cluster with configurable RBAC rules
3. **Redis**: Pub/Sub for command distribution, session persistence, and conversation state
4. **SSE Connection**: Real-time bidirectional streaming for instant command delivery (~50ms latency)
5. **LLM Integration**: Supports multiple LLM providers through LLMFactory for intelligent troubleshooting

## Use Cases

<div class="features">
  <div class="feature reveal">
    <span class="feature-icon">💬</span>
    <h3 class="feature-title">Intelligent Troubleshooting</h3>
    <p class="feature-description">Systematic debugging with LLM-powered analysis and todo tracking for thorough investigations</p>
  </div>
  
  <div class="feature reveal">
    <span class="feature-icon">🤖</span>
    <h3 class="feature-title">Multi-Agent Systems</h3>
    <p class="feature-description">Full A2A protocol implementation with tool call interception and streaming responses</p>
  </div>
  
  <div class="feature reveal">
    <span class="feature-icon">🏢</span>
    <h3 class="feature-title">Enterprise Ready</h3>
    <p class="feature-description">OAuth/OIDC authentication, TLS support with cert-manager, and comprehensive test automation</p>
  </div>
</div>

## Getting Started

Ready to start debugging your Kubernetes clusters with AI-powered insights?

<div class="hero-buttons reveal" style="margin-top: 2rem;">
  <a href="{{ '/guides/quick-start/' | relative_url }}" class="btn btn-primary">🚀 Quick Start Guide</a>
  <a href="{{ '/installation/' | relative_url }}" class="btn btn-secondary">📦 Installation</a>
  <a href="https://github.com/kubently/kubently" class="btn btn-secondary">⭐ View on GitHub</a>
</div>

## Community & Support  

Join the Kubently community and get help from other users and maintainers:

- **GitHub**: Source code and issues
- **Documentation**: Comprehensive guides and API reference
- **Discussions**: Ask questions and share ideas

<div class="alert alert-success" style="margin-top: 2rem;">
  🎉 <strong>Open Source & Free:</strong> Kubently is Apache 2.0 licensed and completely free to use in any environment.
</div>

---

<div style="text-align: center; padding: 2rem 0; color: var(--medium-gray);">
  <strong>Kubently</strong> - Kubernetes troubleshooting, agentically 🚀
</div>

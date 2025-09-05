---
layout: home
title: Kubently
subtitle: Interactive Kubernetes Debugging System
---

<div class="hero">
  <div class="hero-content">
    <h1 class="hero-title">Kubently</h1>
    <p class="hero-subtitle">AI-powered, real-time Kubernetes debugging system that enables interactive troubleshooting through conversational interfaces</p>
    
    <div class="badges">
      <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License">
      <img src="https://img.shields.io/badge/python-3.13+-blue.svg" alt="Python 3.13+">
      <img src="https://img.shields.io/badge/kubernetes-1.24+-326ce5.svg" alt="Kubernetes 1.24+">
    </div>
    
    <div class="hero-buttons">
      <a href="{{ '/guides/quick-start/' | relative_url }}" class="btn btn-primary">Get Started</a>
      <a href="{{ '/installation/' | relative_url }}" class="btn btn-secondary">View Installation</a>
    </div>
  </div>
</div>

<div class="wrapper">
  <div class="features">
    <div class="feature">
      <span class="feature-icon">🚀</span>
      <h3 class="feature-title">Real-time Debugging</h3>
      <p class="feature-description">Sub-second command execution latency during active sessions with dynamic polling optimization</p>
    </div>
    
    <div class="feature">
      <span class="feature-icon">🔒</span>
      <h3 class="feature-title">Secure by Default</h3>
      <p class="feature-description">Read-only operations with comprehensive command validation and RBAC integration</p>
    </div>
    
    <div class="feature">
      <span class="feature-icon">🤖</span>
      <h3 class="feature-title">AI-Native Design</h3>
      <p class="feature-description">Built for LLM and multi-agent systems with A2A communication and MCP support</p>
    </div>
    
    <div class="feature">
      <span class="feature-icon">📦</span>
      <h3 class="feature-title">Simple Deployment</h3>
      <p class="feature-description">Single API pod with lightweight agents - deploy anywhere Kubernetes runs</p>
    </div>
    
    <div class="feature">
      <span class="feature-icon">⚡</span>
      <h3 class="feature-title">Auto-scaling Performance</h3>
      <p class="feature-description">Dynamic polling rates based on session activity for optimal resource usage</p>
    </div>
    
    <div class="feature">
      <span class="feature-icon">🔌</span>
      <h3 class="feature-title">MCP Compatible</h3>
      <p class="feature-description">Model Context Protocol support for seamless AI tool integration</p>
    </div>
  </div>

## Architecture

<div class="architecture-diagram">
  <pre><code>┌─────────────┐      ┌─────────────────┐      ┌─────────┐
│   AI/User   │─────▶│   Kubently API  │◀────▶│  Redis  │
│   or A2A    │ HTTP │   (Single Pod)   │      └─────────┘
│   Service   │      └─────────────────┘
└─────────────┘            ▲ HTTP
                           │ (Long Polling)
                    ┌──────┴────────┐
                    │ Kubently Agent │
                    │  (Per Cluster) │
                    └────────────────┘</code></pre>
</div>

### Core Components

1. **Kubently API**: FastAPI service managing sessions and command orchestration
2. **Kubently Agent**: Lightweight executor deployed in each target cluster
3. **Redis**: State store for sessions, command queues, and results

## Quick Start

Ready to get started? Check out our [installation guide](installation.md) or dive into the [quick start guide](guides/quick-start.md).

## Use Cases

### Interactive Debugging
- Real-time cluster troubleshooting through conversational interfaces
- Sub-second response times for kubectl commands
- Session-based debugging with context preservation

### Multi-Agent Systems
- Integration with LLM-powered agents
- A2A (Agent-to-Agent) communication support
- MCP (Model Context Protocol) tool exposure

### Production Operations
- Safe read-only cluster inspection
- Automated diagnostic workflows
- Integration with monitoring and alerting systems

## Performance Metrics

<div class="metrics">
  <div class="metric">
    <span class="metric-value">~250ms</span>
    <span class="metric-label">Command Latency</span>
  </div>
  <div class="metric">
    <span class="metric-value">150+</span>
    <span class="metric-label">Concurrent Sessions</span>
  </div>
  <div class="metric">
    <span class="metric-value">~70MB</span>
    <span class="metric-label">Agent Memory</span>
  </div>
  <div class="metric">
    <span class="metric-value">~300MB</span>
    <span class="metric-label">API Memory</span>
  </div>
  <div class="metric">
    <span class="metric-value">200/sec</span>
    <span class="metric-label">Command Throughput</span>
  </div>
  <div class="metric">
    <span class="metric-value">99.9%</span>
    <span class="metric-label">Uptime</span>
  </div>
</div>

  ## Getting Started

  Ready to start debugging your Kubernetes clusters with AI-powered insights?

  <div class="hero-buttons" style="margin-top: 2rem;">
    <a href="{{ '/guides/quick-start/' | relative_url }}" class="btn btn-primary">🚀 Quick Start Guide</a>
    <a href="{{ '/installation/' | relative_url }}" class="btn btn-secondary">📦 Installation</a>
    <a href="https://github.com/adickinson/kubently" class="btn btn-secondary">⭐ View on GitHub</a>
  </div>

  ## Community & Support

  Join the Kubently community and get help from other users and maintainers:

  - **GitHub**: [Source code and issues](https://github.com/adickinson/kubently)
  - **Documentation**: Comprehensive guides and API reference
  - **Discussions**: Ask questions and share ideas

  <div class="alert alert-success" style="margin-top: 2rem;">
    🎉 <strong>Open Source & Free:</strong> Kubently is MIT licensed and completely free to use in any environment.
  </div>

</div>

---

<div style="text-align: center; padding: 2rem 0; color: var(--medium-gray);">
  <strong>Kubently</strong> - Making Kubernetes debugging conversational 🚀
</div>
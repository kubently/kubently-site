---
layout: home
title: Kubently
subtitle: Interactive Kubernetes Debugging System
---

<div class="hero">
  <div class="hero-content">
    <img src="{{ site.logo | relative_url }}" alt="Kubently Logo" style="height: 120px; margin-bottom: 1.5rem;">
    <h1 class="hero-title">Kubently</h1>
    <p class="hero-subtitle">AI-powered, real-time Kubernetes debugging system that enables interactive troubleshooting through conversational interfaces</p>
    
    <div class="badges">
      <img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="Apache License">
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
      <p class="feature-description">~50ms command delivery via Server-Sent Events (SSE) with instant execution</p>
    </div>
    
    <div class="feature">
      <span class="feature-icon">🔒</span>
      <h3 class="feature-title">Secure by Default</h3>
      <p class="feature-description">Read-only operations with comprehensive command validation and RBAC integration</p>
    </div>
    
    <div class="feature">
      <span class="feature-icon">🤖</span>
      <h3 class="feature-title">AI-Native Design</h3>
      <p class="feature-description">Built for LLM and multi-agent systems with native A2A communication</p>
    </div>
    
    <div class="feature">
      <span class="feature-icon">📦</span>
      <h3 class="feature-title">Simple Deployment</h3>
      <p class="feature-description">Single API service with lightweight executors - deploy anywhere Kubernetes runs</p>
    </div>
    
    <div class="feature">
      <span class="feature-icon">⚡</span>
      <h3 class="feature-title">Auto-scaling Performance</h3>
      <p class="feature-description">Horizontal scaling with Redis pub/sub - supports unlimited API pods</p>
    </div>
    
    <div class="feature">
      <span class="feature-icon">🔌</span>
      <h3 class="feature-title">API Integration</h3>
      <p class="feature-description">Native REST API for AI tools and external services</p>
    </div>
  </div>
</div>

## Architecture

<div class="architecture-diagram">
<pre>
┌─────────────┐      ┌─────────────────┐      ┌─────────┐
│   AI/User   │─────▶│  Kubently API   │◀────▶│  Redis  │
│   or A2A    │ HTTP │  (Multi-Pod)    │ Pub/ │ Pub/Sub │
│   Service   │      └─────────────────┘ Sub  └─────────┘
└─────────────┘            ▲ SSE
                           │ (Server-Sent Events)
                    ┌──────┴────────────┐
                    │ Kubently Executor  │
                    │   (Per Cluster)    │
                    └────────────────────┘
</pre>
</div>

### Core Components

1. **Kubently API**: Horizontally scalable FastAPI service managing sessions and command orchestration
2. **Kubently Executor**: SSE-connected component deployed in each target cluster  
3. **Redis**: Pub/Sub for command distribution and state storage
4. **SSE Connection**: Real-time streaming for instant command delivery (no polling)

## Use Cases

<div class="features">
  <div class="feature">
    <span class="feature-icon">💬</span>
    <h3 class="feature-title">Interactive Debugging</h3>
    <p class="feature-description">Real-time cluster troubleshooting through conversational interfaces with context preservation</p>
  </div>
  
  <div class="feature">
    <span class="feature-icon">🤖</span>
    <h3 class="feature-title">Multi-Agent Systems</h3>
    <p class="feature-description">Integration with LLM-powered agents via native A2A communication protocol</p>
  </div>
  
  <div class="feature">
    <span class="feature-icon">🏢</span>
    <h3 class="feature-title">Production Operations</h3>
    <p class="feature-description">Safe read-only cluster inspection with automated diagnostic workflows</p>
  </div>
</div>

## Getting Started

Ready to start debugging your Kubernetes clusters with AI-powered insights?

<div class="hero-buttons" style="margin-top: 2rem;">
  <a href="{{ '/guides/quick-start/' | relative_url }}" class="btn btn-primary">🚀 Quick Start Guide</a>
  <a href="{{ '/installation/' | relative_url }}" class="btn btn-secondary">📦 Installation</a>
  <a href="https://github.com/your-org/kubently" class="btn btn-secondary">⭐ View on GitHub</a>
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
  <strong>Kubently</strong> - Making Kubernetes debugging conversational 🚀
</div>

---
layout: home
title: Kubently
subtitle: Troubleshoot Kubernetes Agentically - AI-Powered Conversational Debugging
---

<div class="hero">
  <div class="hero-content">
    <img src="{{ site.logo | relative_url }}" alt="Kubently Logo" style="height: 200px; margin: 0; mix-blend-mode: multiply;">
    <p class="hero-subtitle">Troubleshoot Kubernetes agentically with AI-powered conversational debugging that enables natural language interactions and real-time cluster insights</p>
    
    <div class="badges">
      <img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="Apache License">
      <img src="https://img.shields.io/badge/python-3.13+-blue.svg" alt="Python 3.13+">
      <img src="https://img.shields.io/badge/kubernetes-1.28+-326ce5.svg" alt="Kubernetes 1.28+">
    </div>
    
    <div class="hero-buttons">
      <a href="{{ '/guides/quick-start/' | relative_url }}" class="btn btn-primary">Get Started</a>
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
      <p class="feature-description">Multi-LLM support with native A2A (Agent-to-Agent) protocol for any LLM provider</p>
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
      <h3 class="feature-title">Flexible Integration</h3>
      <p class="feature-description">REST API, Node.js CLI, and comprehensive test automation framework</p>
    </div>
  </div>
</div>

## Architecture

<div class="architecture-diagram">
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
  <div class="feature">
    <span class="feature-icon">💬</span>
    <h3 class="feature-title">Intelligent Troubleshooting</h3>
    <p class="feature-description">Systematic debugging with LLM-powered analysis and todo tracking for thorough investigations</p>
  </div>
  
  <div class="feature">
    <span class="feature-icon">🤖</span>
    <h3 class="feature-title">Multi-Agent Systems</h3>
    <p class="feature-description">Full A2A protocol implementation with tool call interception and streaming responses</p>
  </div>
  
  <div class="feature">
    <span class="feature-icon">🏢</span>
    <h3 class="feature-title">Enterprise Ready</h3>
    <p class="feature-description">OAuth/OIDC authentication, TLS support with cert-manager, and comprehensive test automation</p>
  </div>
</div>

## Getting Started

Ready to start debugging your Kubernetes clusters with AI-powered insights?

<div class="hero-buttons" style="margin-top: 2rem;">
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

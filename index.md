---
layout: home
title: Kubently
subtitle: Interactive Kubernetes Debugging System
---

# Kubently

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.13+](https://img.shields.io/badge/python-3.13+-blue.svg)](https://www.python.org/downloads/)
[![Kubernetes](https://img.shields.io/badge/kubernetes-1.24+-326ce5.svg)](https://kubernetes.io/)

## Overview

Kubently is an AI-powered, real-time Kubernetes debugging system that enables interactive troubleshooting of clusters through a conversational interface. It provides sub-second command execution latency while maintaining strict security boundaries with read-only operations.

## Key Features

- **🚀 Real-time Debugging**: < 500ms command execution latency during active sessions
- **🔒 Secure by Default**: Read-only operations with comprehensive command validation
- **🤖 AI-Native**: Designed for integration with LLMs and multi-agent systems via A2A communication
- **📦 Simple Deployment**: Single API pod + lightweight agents (one per cluster)
- **🔄 Auto-scaling Performance**: Dynamic polling rates based on session activity
- **🔌 MCP Compatible**: Supports Model Context Protocol for tool exposure to AI agents

## Architecture

```
┌─────────────┐      ┌─────────────────┐      ┌─────────┐
│   AI/User   │─────▶│   Kubently API  │◀────▶│  Redis  │
│   or A2A    │ HTTP │   (Single Pod)   │      └─────────┘
│   Service   │      └─────────────────┘
└─────────────┘            ▲ HTTP
                           │ (Long Polling)
                    ┌──────┴────────┐
                    │ Kubently Agent │
                    │  (Per Cluster) │
                    └────────────────┘
```

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

| Metric | Target | Actual |
|--------|--------|--------|
| Command Latency | < 500ms | ~200-300ms |
| Concurrent Sessions | 100+ | Tested: 150 |
| Agent Memory | < 100MB | ~50-80MB |
| API Memory | < 500MB | ~200-400MB |
| Command Throughput | 100/sec | Tested: 200/sec |

## Community

- **Source Code**: [GitHub Repository](https://github.com/adickinson/kubently)
- **Issues**: [Report bugs or request features](https://github.com/adickinson/kubently/issues)
- **Documentation**: You're looking at it!

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/adickinson/kubently/blob/main/LICENSE) file for details.

---

*Kubently - Making Kubernetes debugging conversational* 🚀
---
layout: page
title: CLI Guide
permalink: /guides/cli/
---

The Kubently CLI provides a modern, interactive command-line interface for managing Kubently clusters and debugging Kubernetes issues using natural language queries.

## Features

- **Beautiful Terminal UI**: Colored output, ASCII art banners, and formatted tables
- **Interactive Debug Sessions**: Real-time chat interface with the Kubently agent
- **Cluster Management**: Add, list, status check, and remove clusters
- **Natural Language Queries**: Ask questions in plain English about your Kubernetes clusters
- **Session Management**: TTL-based sessions with unique IDs and command history

## Requirements

- Node.js 18.0.0 or higher
- npm or yarn
- Access to a Kubently API server (see [Installation Guide](/installation/))

## Installation

### Install from Source

```bash
# Clone the kubently repository
git clone https://github.com/kubently/kubently.git
cd kubently/kubently-cli/nodejs

# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Create global CLI command
npm link
```

### NPM Package (Coming Soon)

```bash
npm install -g @kubently/cli
```

## Quick Start

### 1. Initialize Configuration

First, configure the CLI with your Kubently API details:

```bash
kubently init
```

![Kubently Interactive Menu](/assets/images/cli-screenshot-menu.svg)

This will prompt you for:
- **Kubently API URL**: The endpoint for your Kubently API (e.g., `http://localhost:8080`)
- **Admin API Key**: Your API key for authentication

Configuration is stored in `~/.kubently/config.json` with restrictive permissions (600).

### 2. Start a Debug Session

Start an interactive debugging session with natural language support:

```bash
# Debug a specific cluster
kubently debug my-cluster

# Start without specifying a cluster (you can specify it in your queries)
kubently debug
```

## Commands

### Configuration Commands

#### `kubently init`

Initialize or update CLI configuration.

```bash
kubently init
```

**Interactive prompts:**
- Kubently API URL
- Admin API key

### Cluster Management Commands

#### `kubently cluster list`

List all registered clusters.

```bash
kubently cluster list
```

![Kubently Cluster List Output](/assets/images/cli-screenshot-list.svg)

#### `kubently cluster status <cluster-id>`

Check the status of a specific cluster.

```bash
kubently cluster status production
```

#### `kubently cluster add <cluster-id>`

Add a new cluster to Kubently.

```bash
kubently cluster add production
```

This generates an executor token and provides deployment instructions.

#### `kubently cluster remove <cluster-id>`

Remove a cluster from Kubently.

```bash
kubently cluster remove staging
```

### Debug Commands

#### `kubently debug [cluster-id]`

Start an interactive A2A debugging session.

```bash
# Debug specific cluster
kubently debug production

# Start without cluster specification
kubently debug
```

**Interactive commands within debug session:**
- `help` - Show available commands
- `clear` - Clear the screen
- `history` - Show command history
- `exit` or `quit` - Exit the session
- **Natural language queries** - Ask questions about your cluster

**Example session:**

![Kubently Debug Session](/assets/images/cli-screenshot-debug.svg)

## Configuration

### Configuration File

The CLI stores configuration in `~/.kubently/config.json`:

```json
{
  "apiUrl": "http://localhost:8080",
  "apiKey": "your-api-key-here"
}
```

### Environment Variables

Environment variables take precedence over the config file:

```bash
export KUBENTLY_API_URL=http://your-api-url
export KUBENTLY_API_KEY=your-api-key
```

This is useful for:
- CI/CD pipelines
- Switching between multiple Kubently instances
- Temporary overrides without modifying the config file

## Advanced Usage

### Using Multiple Clusters

You can manage multiple clusters with Kubently:

```bash
# Add clusters
kubently cluster add production
kubently cluster add staging
kubently cluster add development

# List all clusters
kubently cluster list

# Debug specific clusters
kubently debug production
```

### Scripting with the CLI

While the CLI is designed for interactive use, you can also use it in scripts:

```bash
#!/bin/bash

# Set environment variables
export KUBENTLY_API_URL=http://kubently.example.com
export KUBENTLY_API_KEY=your-api-key

# Check cluster status
kubently cluster status production

# Note: For non-interactive debugging, use the A2A API directly
# See the API Reference for programmatic access
```

## Troubleshooting

### Connection Issues

**Problem:** CLI cannot connect to the Kubently API

**Solutions:**
1. Verify the API URL is correct:
   ```bash
   curl http://your-kubently-api:8080/health
   ```

2. Check your API key is valid
3. Ensure the Kubently API service is running:
   ```bash
   kubectl get pods -n kubently
   ```

4. If using port-forwarding, verify it's still active:
   ```bash
   kubectl port-forward -n kubently svc/kubently-api 8080:8080
   ```

### Authentication Errors

**Problem:** Receiving 401 Unauthorized errors

**Solutions:**
1. Verify your API key in the config:
   ```bash
   cat ~/.kubently/config.json
   ```

2. Re-initialize the CLI:
   ```bash
   kubently init
   ```

3. Check the API key is correctly configured on the server

### Debug Session Not Responding

**Problem:** Debug session hangs or doesn't respond

**Solutions:**
1. Check the Kubently API logs:
   ```bash
   kubectl logs -l app=kubently-api -n kubently
   ```

2. Verify the LLM provider is configured correctly
3. Check for network connectivity issues
4. Try restarting the debug session

### Command Not Found

**Problem:** `kubently: command not found`

**Solutions:**
1. If installed from source, ensure you ran `npm link`:
   ```bash
   cd kubently-cli/nodejs
   npm link
   ```

2. Check your PATH includes npm global bin:
   ```bash
   echo $PATH
   npm config get prefix
   ```

3. Try using npx instead:
   ```bash
   npx kubently debug
   ```

## Development

### Running from Source

```bash
# Clone the repository
git clone https://github.com/kubently/kubently.git
cd kubently/kubently-cli/nodejs

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Project Structure

```
kubently-cli/nodejs/
├── src/
│   ├── index.ts           # Main entry point
│   ├── commands/          # Command implementations
│   │   ├── init.ts        # Configuration setup
│   │   ├── cluster.ts     # Cluster management
│   │   └── debug.ts       # A2A debug session
│   └── lib/               # Core libraries
│       ├── config.ts      # Configuration management
│       ├── adminClient.ts # Admin API client
│       ├── a2aClient.ts   # A2A protocol client
│       └── templates.ts   # Manifest generators
├── dist/                  # Compiled JavaScript
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## Next Steps

- [API Reference](/api/) - Learn about the Kubently API
- [Multi-Agent Guide](/guides/multi-agent/) - Integrate with multi-agent systems
- [Security Guide](/guides/security/) - Security best practices
- [Troubleshooting](/guides/troubleshooting/) - Common issues and solutions

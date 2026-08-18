---
layout: page
title: A2A & MCP Interop
subtitle: Kubently as a sub-agent — and other people's tools as evidence.
permalink: /guides/a2a-integration/
---

Kubently speaks two agent protocols, and traffic flows both ways:

- **Outbound to you** — call Kubently as a **sub-agent** from Claude Desktop,
  Cursor, Claude Code, or any A2A/MCP client. You ask a question in plain
  language; Kubently investigates and answers.
- **Inbound to Kubently** — connect **external MCP servers** (Grafana,
  Datadog, your own) so their tools become evidence sources inside a Kubently
  investigation.

This guide covers both directions.

## Two protocols, one agent

| Interface | Endpoint | Shape | Use when |
|---|---|---|---|
| **A2A** | `/a2a/` | Streaming (SSE), official [A2A protocol](https://a2a-protocol.org/latest/) | Your client speaks A2A |
| **MCP** | `/mcp/` | Request/response, streamable HTTP | Your client speaks [MCP](https://modelcontextprotocol.io/) |

Both are mounted on the **main API port (8080)** — one service port serves the
REST API, `/a2a/`, and `/mcp/`. Both are backed by the same agent, the same
Redis-backed memory, and the same auth/session/queue infrastructure.

<div class="alert alert-info">
💡 <strong>Kubently does the reasoning in both.</strong> Neither interface
hands raw kubectl to the caller's LLM — that would bypass the troubleshooting
loop, which is the whole value. The caller asks a question; Kubently
investigates. For direct cluster primitives, use the
<a href="/api/">REST API</a> instead.
</div>

## Kubently as a sub-agent (MCP)

The MCP server exposes exactly **one** tool:

```
ask_kubently(query: str, cluster_id: str = None, conversation_id: str = None)
  -> {"answer": <markdown>, "thread_id": <id>}
```

| Parameter | Required | Notes |
|---|---|---|
| `query` | **yes** | The question in plain language: *"why are pods crashlooping in the payments namespace on prod?"* |
| `cluster_id` | no | Target cluster. Omit to let Kubently choose or ask — if you don't know the id, just name the cluster in `query` |
| `conversation_id` | no | Pass a previous response's `thread_id` to continue the same investigation with memory intact. Omit to start fresh |

### Enabling it

There is **no enable flag**. The MCP server is auto-mounted at API startup
whenever the `mcp` Python SDK is installed, which ships as part of the `a2a`
extra. Confirm in the logs:

```bash
kubectl logs -n kubently deploy/kubently-api | grep -i "MCP server"
# -> MCP server mounted at /mcp
# (or: "mcp package not installed; MCP server not mounted")
```

### Claude Code

```bash
# Via the CLI bridge — reuses the API URL and key from `kubently install`
claude mcp add kubently -- kubently mcp

# Or directly over HTTP, no bridge process
claude mcp add --transport http kubently https://<your-kubently-host>/mcp/ \
  --header "X-API-Key: <your-api-key>"
```

Then ask: *"use kubently to figure out why payments pods are crashlooping."*

### Claude Desktop / Cursor / any streamable-HTTP client

Both read an `mcpServers` block (in their settings / `mcp.json`):

```json
{
  "mcpServers": {
    "kubently": {
      "type": "streamable-http",
      "url": "https://<your-kubently-host>/mcp/",
      "headers": {
        "X-API-Key": "<your-api-key>"
      }
    }
  }
}
```

Restart the client and confirm `ask_kubently` appears in its tool list.

### Any stdio-only MCP client

`kubently mcp` runs a local stdio↔HTTP bridge, so a client that only speaks
stdio needs no endpoint knowledge:

```json
{ "command": "kubently", "args": ["mcp"] }
```

Point it elsewhere with `kubently mcp --api-url <url> --api-key <key>`.

<div class="alert alert-warning">
⚠️ <strong>The trailing slash is required.</strong> Use <code>/mcp/</code>,
not <code>/mcp</code> — same as <code>/a2a/</code>. A request to the bare
<code>/mcp</code> returns a <code>307</code> redirect; most MCP clients follow
it, but some HTTP clients drop the method or body on redirect. Point at
<code>/mcp/</code> and the problem never exists.
</div>

<div class="alert alert-info">
📝 MCP remote-HTTP client config formats vary between clients and change over
time. The shape above is the common one; check your client's current docs for
its exact remote-server syntax.
</div>

## Kubently as a sub-agent (A2A)

A2A is **core functionality and always enabled** — there is no flag to turn it
off. Kubently uses the official A2A Python SDK, so any A2A-compliant client
works.

### The agent card

```bash
curl https://<your-kubently-host>/a2a/.well-known/agent.json | jq .
```

```json
{
  "name": "Kubently Kubernetes Debugger",
  "description": "AI agent specialized in debugging and inspecting Kubernetes clusters...",
  "url": "https://<your-kubently-host>/a2a/",
  "version": "1.0.0",
  "capabilities": { "streaming": true, "pushNotifications": false },
  "skills": [
    {
      "id": "kubernetes-debug",
      "name": "Kubernetes Debugging",
      "tags": ["kubernetes", "k8s", "debugging", "troubleshooting", "kubectl",
               "logs", "pods", "deployments", "observability"],
      "examples": ["Show me all failing pods in the cluster",
                   "Debug why my pod is crashlooping", "..."]
    }
  ]
}
```

The `url` in the card is what tells clients where to connect back — set
`A2A_EXTERNAL_URL` to your externally reachable URL **including the trailing
`/a2a/`**, or A2A clients will be handed a localhost address:

```yaml
# values.yaml
api:
  env:
    A2A_EXTERNAL_URL: "https://kubently.your-domain.com/a2a/"
```

### Authentication

Every A2A request except the agent card needs `X-API-Key` (case-insensitive
variants `X-Api-Key` / `x-api-key` are also accepted) — the **same key** the
CLI and MCP use, from `API_KEYS`.

```bash
curl -X POST https://<your-kubently-host>/a2a/ \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $KUBENTLY_API_KEY" \
  -d @message.json
```

### Client libraries

```bash
pip install a2a                    # Python
npm install @a2aproject/a2a-client # JavaScript / TypeScript
```

```python
from a2a.client import AsyncA2AClient
from a2a.types import Message, MessagePart

client = AsyncA2AClient(
    base_url="https://<your-kubently-host>/a2a",
    headers={"X-API-Key": "<your-api-key>"},
)

message = Message(role="user", parts=[MessagePart(text="Why is checkout-api crashlooping in prod-east?")])
async for event in client.send_message_stream(message):
    print(event)
```

### Configuration

| Variable | Default | Description |
|---|---|---|
| `A2A_EXTERNAL_URL` | — | External URL published in the agent card. Include the trailing `/a2a/` |
| `A2A_SERVER_DEBUG` | `false` | A2A debug logging |
| `KUBENTLY_MAX_FLEET_CLUSTERS` | `10` | Max clusters per `execute_kubectl_multi` fan-out call — see [multi-cluster](/guides/multi-cluster/) |

Ingress note: route `/a2a` (and `/mcp`) to the API service on port 8080 — they
are paths on the one port, not separate services.

## External MCP servers as evidence

The other direction: Kubently's agent can **consume** tools from third-party
MCP servers — Grafana Cloud's remote MCP, Datadog's, or your own — alongside
its native kubectl, log, metric and change tools. Tools register under an
`mcp_<server>_` prefix so they can never collide with native tools or with
each other.

Only **streamable-HTTP** servers are supported (the transport remote MCPs use).

<div class="alert alert-warning">
🔒 <strong>Connect read-scoped servers and credentials only.</strong> Kubently
enforces read-only kubectl through its executor whitelist, but it has
<strong>no way to constrain what a remote server's tools do</strong> — a
write-scoped Grafana token lets the model mutate dashboards. Create
credentials with the narrowest read-only scope the vendor offers.
</div>

### Cloud — managed per-tenant OAuth {% include cloud-badge.html %}

Connect a provider from the **Integrations** page of your dashboard at
[cloud.kubently.io](https://cloud.kubently.io). The OAuth grant is stored per
tenant and scoped to your org — there is no token to create, paste, or rotate
yourself. A [Team-plan](https://cloud.kubently.io/pricing) feature; see
[Integrations (BYO-MCP)](/cloud/integrations/).

### Self-hosted — static configuration

Tokens live in secrets, never in values files:

```bash
kubectl create secret generic kubently-grafana-mcp \
  --from-literal=token="glsa_..." -n kubently
```

```yaml
# values.yaml
mcpServers:
  - name: grafana
    url: https://mcp.grafana.com/mcp
    existingSecret: kubently-grafana-mcp   # secret holding the bearer token
    secretKey: token                       # key within the secret (default "token")
  - name: datadog
    url: https://mcp.datadoghq.com/api/unstable/mcp
    headers:                               # optional NON-secret headers only
      X-Some-Header: value
```

The chart renders the server list (**minus tokens**) into
`KUBENTLY_MCP_SERVERS` and wires each `existingSecret` to a per-server env var
`MCP_TOKEN_<NAME>`, which the config references via `bearer_token_env` — so
tokens never appear in the rendered JSON or in values files.

Outside Helm, set `KUBENTLY_MCP_SERVERS` (inline JSON) or
`KUBENTLY_MCP_SERVERS_FILE` (a YAML/JSON file — a bare list, or under a
`servers:` key):

```yaml
servers:
  - name: grafana
    url: https://mcp.grafana.com/mcp
    bearer_token_env: GRAFANA_MCP_TOKEN      # preferred: token stays in the env
  - name: datadog
    url: https://mcp.datadoghq.com/api/unstable/mcp
    headers_env:                             # API-key-style credential headers
      DD-API-KEY: DATADOG_API_KEY_ENV_VAR
      DD-APPLICATION-KEY: DATADOG_APP_KEY_ENV_VAR
```

Entry fields: `name` and `url` (required); `bearer_token_env` or
`bearer_token` (literal, discouraged); `headers` (plain, non-secret);
`headers_env` (header name → env var). Invalid entries are skipped with a
warning; the rest still load.

### How third-party output is treated

**As untrusted input** — the same skepticism Kubently applies to alert
payloads:

- Tool **descriptions** (which enter the model's context) are sanitized,
  length-capped, and prefixed with an explicit untrusted-source marker.
- Tool **results** are wrapped in `BEGIN/END UNTRUSTED MCP RESULT` markers and
  size-capped, with an explicit truncation note. The system prompt instructs
  the model to treat the contents as **evidence, never as instructions**.
- **Credentials** are sent only as HTTP headers to the configured URL,
  redacted from errors, never logged, and never in model context.

### Failure isolation

An unreachable server at agent startup contributes **no tools** (a logged
warning) and investigations proceed on native tools. A server that fails or
times out mid-investigation returns an error string to the model — never an
exception — and the prompt tells the model to continue rather than retry-loop.

### Tuning

| Variable | Default | Description |
|---|---|---|
| `KUBENTLY_MCP_MAX_OUTPUT_CHARS` | `20000` | Per-result size cap; truncation is noted in the result |
| `KUBENTLY_MCP_CONNECT_TIMEOUT` | `15` | Seconds to wait per server when listing tools at agent startup |
| `KUBENTLY_MCP_TOOL_TIMEOUT` | `60` | Seconds per external tool call before a timeout error goes back to the model |

### Per-request injection (embedding services)

Services that embed the agent — a multi-tenant control plane brokering
per-tenant OAuth, for instance — can supply servers **per invocation** instead
of, or in addition to, the static config:

```python
from kubently.modules.a2a.protocol_bindings.a2a_server.agent import KubentlyAgent
from kubently.modules.a2a.protocol_bindings.a2a_server.mcp_client import MCPServerSpec

agent = KubentlyAgent(redis_client=redis)
async for event in agent.run(
    messages=[{"role": "user", "content": "why is checkout slow?"}],
    thread_id="tenant-42:incident-7",
    mcp_servers=[
        MCPServerSpec(
            name="grafana",
            url="https://mcp.grafana.com/mcp",
            headers={"Authorization": "Bearer <tenant-scoped token>"},
            secret_values=["<tenant-scoped token>"],  # enables redaction
        ),
    ],
):
    ...
```

The specs — and the credentials inside them — **live only for the duration of
that `run()` call**; the engine never stores them. Their tools exist only for
that invocation and are announced to the model with the same untrusted-data
warning.

## Verify

```bash
# Both interfaces mounted
kubectl logs -n kubently deploy/kubently-api | grep -iE "a2a|MCP server mounted"

# The agent card is reachable and points at the right URL
curl -s https://<your-kubently-host>/a2a/.well-known/agent.json | jq -r .url

# MCP responds (401 without a key is the correct answer)
curl -s -o /dev/null -w '%{http_code}\n' https://<your-kubently-host>/mcp/
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| MCP tool never appears in the client | Wrong URL shape or a dropped redirect | Use the trailing slash: `/mcp/` |
| `{"error": "Unauthorized: valid X-API-Key required"}` | Missing or wrong key | Use a key from `API_KEYS` — the same one the CLI uses |
| `mcp package not installed; MCP server not mounted` | The image lacks the `mcp` SDK (part of the `a2a` extra) | Use the published image, or install the `a2a` extra |
| A2A client connects to `localhost` | `A2A_EXTERNAL_URL` unset or wrong | Set it to the external URL **including** `/a2a/`, then restart the API deployment |
| Connection refused on `/a2a` or `/mcp` | They're paths on port 8080, not separate services | Route both to the API service, port 8080 |
| External MCP tools missing | The server was unreachable at agent startup | Check the API logs for the warning; restart the API pod after fixing connectivity |
| An external tool times out mid-investigation | `KUBENTLY_MCP_TOOL_TIMEOUT` too low for that server | Raise it; the model is told to continue on native tools either way |
| A remote server's results look like instructions | They're framed as untrusted and the prompt says so | If a server is injecting directives, disconnect it — Kubently cannot constrain a remote server's behavior |

## Related

- [Multi-agent systems](/guides/multi-agent/) — Kubently inside larger agent systems.
- [Integrations (BYO-MCP)](/cloud/integrations/) {% include cloud-badge.html %} — managed per-tenant OAuth.
- [API reference](/api/) — the REST surface for direct cluster primitives.
- [Security](/guides/security/) — auth, the allowlist, and the trust model.
- Upstream: [`docs/MCP.md`](https://github.com/kubently/kubently/blob/main/docs/MCP.md), [`docs/MCP_CLIENT_TOOLS.md`](https://github.com/kubently/kubently/blob/main/docs/MCP_CLIENT_TOOLS.md), [`docs/A2A_CONFIGURATION.md`](https://github.com/kubently/kubently/blob/main/docs/A2A_CONFIGURATION.md)

---
layout: page
title: Metrics & Logs
subtitle: Prometheus, multi-pod log search, and Loki as evidence sources.
permalink: /guides/observability/
---

{% include guide-stub.html upstream="https://github.com/kubently/kubently/blob/main/docs/ENVIRONMENT_VARIABLES.md" label="the environment variables reference" %}

kubectl tells you what Kubernetes thinks; metrics and logs tell you what your
workloads are actually doing. Kubently treats both as first-class evidence:

- **Prometheus** — a read-only `query_prometheus` tool (instant + range
  PromQL) for latency, saturation, OOM trends, restarts over time. GET-only
  against exactly two API paths, with the URL taken solely from the
  executor's own `PROMETHEUS_URL` — the control plane can never aim it
  elsewhere.
- **Multi-pod log search** — regex search across every pod matching a label
  selector, with time bounds, previous-container support for crash
  investigations, and context lines. The search runs **on the executor**;
  raw logs never transit the control plane or the model's context.
- **Loki** — LogQL range queries for aggregated and historical logs,
  including pods that no longer exist. One Helm value (`loki.url`) switches
  it on.

Everything is capped before it leaves the executor (series, samples, matches,
characters), with every cap that fires announced in the output the model
reads.

This guide will cover:

- Wiring `prometheus.url` and `loki.url` in Helm values
- How the agent chooses between metrics, live logs, and Loki
- Multi-tenant Loki (`loki.tenantId`)
- Tuning the caps for busy clusters

---
layout: page
title: Incident History & Postmortems
subtitle: “Have we seen this before?” gets a real answer.
permalink: /guides/incidents/
---

{% include guide-stub.html upstream="https://github.com/kubently/kubently/blob/main/CHANGELOG.md" label="the engine CHANGELOG's incident-history notes" %}

When an investigation concludes with a root cause, Kubently keeps a compact
record — timestamp, cluster, resources involved, symptom keywords, the
root-cause one-liner, and the resolution when stated. Those records become
searchable institutional memory:

- **The agent searches them itself.** A new investigation that strongly
  matches a past incident gets a one-line *"SIMILAR PAST INCIDENT (date):
  …"* note — framed as something to verify and cite, never to assume.
- **You can search them too**, via the `search_past_incidents` tool from
  chat or any A2A/MCP caller.
- **Postmortem export** turns a concluded investigation — evidence trail,
  timeline, root cause — into a postmortem draft, so the write-up starts
  written.

Records are namespaced per caller (they never cross tenants), TTL-bounded
(90 days by default), and capped per namespace. It is explicitly retrieval
over stored summaries — not a learning system.

This guide will cover:

- Searching incident history effectively
- Exporting and editing postmortems
- Retention tuning (`KUBENTLY_INCIDENT_TTL_SECONDS`, per-namespace caps) and disabling entirely

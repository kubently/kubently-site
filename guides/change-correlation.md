---
layout: page
title: Change Correlation
subtitle: “What changed before this broke?” — answered from the record.
permalink: /guides/change-correlation/
---

{% include guide-stub.html upstream="https://github.com/kubently/kubently/blob/main/CHANGELOG.md" label="the engine CHANGELOG's change-correlation notes" %}

Most sudden failures follow a change. Kubently's `get_recent_changes` tool
aggregates every change source for a workload or namespace into one
chronological timeline, and the agent is instructed to check it **first**
when investigating sudden failures — then correlate change timestamps against
the first error and name the correlated change in the RCA.

Sources on the timeline:

- Rollout history with ReplicaSet revision timestamps and images
- `kubectl rollout history` change-causes
- **Helm release history** (opt-in: `changeCorrelation.helmHistory.enabled`)
- **ArgoCD sync history** (opt-in: `changeCorrelation.argocd.url` + token secret)
- Normal + Warning events, including children via ownership chains

All of it read-only: `helm history`/`helm list` and fixed ArgoCD GET paths,
composed on the executor from validated fields — no raw arguments travel over
the channel.

This guide will cover:

- Enabling the Helm and ArgoCD sources (and the RBAC the Helm source needs)
- Reading a change-correlation timeline in an RCA
- How this pairs with deployment verification and GitOps remediation

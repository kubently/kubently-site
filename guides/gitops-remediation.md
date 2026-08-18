---
layout: page
title: GitOps Remediation
subtitle: Propose-only PRs against your manifests repo. A human always merges.
permalink: /guides/gitops-remediation/
---

{% include guide-stub.html upstream="https://github.com/kubently/kubently/blob/main/docs/GITOPS_REMEDIATION.md" label="docs/GITOPS_REMEDIATION.md" %}

When a diagnosis points at a manifest, Kubently can propose the fix as a pull
request against your GitOps repository (GitHub or GitLab) — diffed against
the real manifest, with the investigation evidence in the PR body, clearly
marked machine-proposed. Your GitOps controller applies it only after a human
reviews and merges.

The guardrails are the feature:

- **Default off.** The tools don't exist until a remediation target is fully configured.
- **Propose-only.** There is no merge capability in the tool surface, period.
- **Size caps** refuse oversized changes before anything reaches the Git host.
- **High-confidence only.** Prompt guidance restricts proposals to high-confidence RCAs with minimal fixes, citing change-correlation evidence.
- **Token isolation.** The repo-scoped token lives in a secret you create manually; it never enters model context, tool output, or traces. PR creation runs API-side — executors keep their read-only posture and never hold the token.

This guide will cover:

- Configuring the `gitRemediation` Helm block and the token secret
- What a proposed PR looks like, and reviewing one well
- Scoping the token, and the caps that bound proposals

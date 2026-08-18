---
layout: page
title: Operator Runbooks
subtitle: Your tribal knowledge, injected into every matching investigation.
permalink: /guides/runbooks/
---

{% include guide-stub.html upstream="https://github.com/kubently/kubently#operator-runbooks" label="the engine README's runbooks section" %}

Runbooks feed org-specific knowledge into investigations: hand-written
markdown with lightweight YAML frontmatter that says *when it applies* —
alert-name globs, namespace/workload selectors, free-text topic tags. When an
investigation matches, the agent receives the best runbook(s) as "the
operator's runbook for this situation": it follows them where applicable,
notes deviations, and cites the runbook by name in the RCA.

```markdown
---
name: checkout-db-pool
match:
  alerts: ["CheckoutHighErrorRate*"]
  namespaces: ["shop"]
  topics: ["database", "connection pool"]
---
If checkout-api errors mention "pool exhausted", check DB_POOL_SIZE first —
it was silently dropped in two past rollouts. Rollback beats tuning.
```

Deploy runbooks as Helm values (`runbooks:` map → ConfigMap, hot-reloaded
without a pod restart) or point `KUBENTLY_RUNBOOKS_DIR` at any directory of
`.md` files. Matching is scored (alert > selector > topic) with a size cap —
one complete best match beats fragments of everything.

This guide will cover:

- Writing runbooks that actually change investigations
- Match criteria and scoring in practice
- Managing a runbook library via Helm values or GitOps

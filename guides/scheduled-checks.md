---
layout: page
title: Scheduled Checks & Fleet Digests
subtitle: Cron-scheduled investigations that stay quiet when things are healthy.
permalink: /guides/scheduled-checks/
---

{% include guide-stub.html upstream="https://github.com/kubently/kubently#scheduled-fleet-health-digest" label="the engine README's scheduled-checks sections" %}

**Scheduled checks** are named investigations on a cron schedule — "every
morning, check every cluster for pods restarting more than 5 times and PVCs
above 85%". Noise discipline is built in: a PASS posts nothing unless you opt
in with `notifyOnPass`; a FAIL (or an unparseable verdict) always posts with
the evidence trail.

**Fleet health digests** sweep every registered cluster and post one summary —
healthy clusters collapse to a single line, so what's left is what needs you.

```yaml
# Helm values
fleetReport:
  enabled: true
  schedule: "0 13 * * 1-5"   # weekday mornings

scheduledChecks:
  checks:
    - name: restart-sweep
      schedule: "0 6 * * *"
      query: |-
        Check every cluster for pods restarting more than 5 times.
        One line per healthy cluster. No preamble.
```

This guide will cover:

- Writing check queries that produce crisp PASS/FAIL verdicts
- Previewing with `dry_run` before scheduling
- Customizing the digest question (values, prompt file, or per-request)
- Editing checks live — the checks file is read per request, no pod restart

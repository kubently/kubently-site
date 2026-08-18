---
layout: page
title: Alert-Triggered Diagnosis
subtitle: Alertmanager in, diagnosed RCA in Slack out.
permalink: /guides/alerts/
---

{% include guide-stub.html upstream="https://github.com/kubently/kubently#proactive-diagnosis-alertmanager--slack" label="the engine README's proactive-diagnosis section" %}

Point Alertmanager's webhook receiver at Kubently and every firing alert is
investigated by the agent — kubectl state, metrics, logs, and recent changes —
with the root cause posted to Slack, often before you've opened your laptop.

This guide will cover:

- Configuring the Alertmanager receiver (`/webhooks/alertmanager`) with API-key auth
- Slack delivery: the managed [Slack app](/cloud/slack-app/) {% include cloud-badge.html %} vs a self-hosted incoming webhook (`SLACK_WEBHOOK_URL`, secret-sourced)
- What the agent investigates per alert, and how runbooks matched to the alert name shape it
- Tuning noise: routing, grouping, and which alerts deserve a diagnosis

```yaml
# alertmanager.yml — the shape of it
receivers:
  - name: kubently
    webhook_configs:
      - url: https://<your-kubently-host>/webhooks/alertmanager
        http_config:
          http_headers:
            X-API-Key:
              secrets: ["<your-api-key>"]
```

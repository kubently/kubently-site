---
layout: page
title: Alert-Triggered Diagnosis
subtitle: Alertmanager in, diagnosed RCA in Slack out.
permalink: /guides/alerts/
---

Point Alertmanager's webhook receiver at Kubently and every firing alert gets
investigated by the agent — kubectl state, metrics, logs, recent changes — with
the root cause posted to Slack. The bot often explains the cause before you've
opened your laptop.

This guide wires the receiver, sets up Slack delivery, and tunes the grouping
so you get diagnoses instead of a diagnosis storm.

## Prerequisites

- A connected executor in the cluster(s) the alerts come from
  ([quickstart](/guides/quick-start/)).
- Alertmanager **0.28+** if you want the API key in `http_headers` (older
  versions need the [alternative](#older-alertmanager) below).
- A Kubently API key.
- **Self-hosted:** a Slack incoming-webhook URL. **Cloud:** the managed
  [Slack app](/cloud/slack-app/) {% include cloud-badge.html %} instead.

## 1. Slack delivery

### Self-hosted — one incoming webhook powers every proactive path

`SLACK_WEBHOOK_URL` is the single destination for Alertmanager diagnoses
(`/webhooks/alertmanager`), the [fleet digest](/guides/scheduled-checks/)
(`/webhooks/fleet-report`), [deployment verifications](/guides/cicd/)
(`/webhooks/verify-deployment`) and
[scheduled checks](/guides/scheduled-checks/) (`/webhooks/scheduled-check`).

The URL is a credential — anyone holding it can post to your channel — so
reference it from a secret rather than a values file:

```bash
kubectl create secret generic kubently-slack \
  --from-literal=url='https://hooks.slack.com/services/...' -n kubently
```

```yaml
# values.yaml
api:
  slackWebhook:
    existingSecret: "kubently-slack"   # takes precedence over api.env
    secretKey: "url"
```

```bash
helm upgrade kubently kubently/kubently \
  --namespace kubently --reuse-values -f values.yaml
```

### Cloud — the managed Slack app {% include cloud-badge.html %}

Kubently Cloud posts to the [managed Slack app](/cloud/slack-app/) instead of
a webhook you manage: diagnoses arrive as **threads** you can reply into, and
the agent continues the same investigation with its context intact. Install
the app and pick channels from the integrations page of your dashboard at
[cloud.kubently.io](https://cloud.kubently.io); no `SLACK_WEBHOOK_URL` to
create or rotate.

## 2. The Alertmanager receiver

### Cloud — a per-tenant hook, no auth headers {% include cloud-badge.html %}

Kubently Cloud gives you an **unguessable per-tenant hook URL** —
`https://<cloud-host>/hooks/alertmanager/{hook_id}` — from your dashboard.
The capability URL *is* the credential, the same model as a Slack incoming
webhook, so Alertmanager needs no custom auth headers at all:

```yaml
# alertmanager.yml
receivers:
  - name: kubently
    webhook_configs:
      - url: https://<cloud-host>/hooks/alertmanager/<hook-id>
```

It accepts the standard Alertmanager webhook receiver payload — nothing
special to configure on the Prometheus side.

<div class="alert alert-warning">
🔑 <strong>Treat the hook URL as a secret.</strong> Anyone holding it can
trigger diagnoses against your tenant. Keep it in your Alertmanager secret,
not in a config repo, and rotate it from the dashboard if it leaks.
</div>

### Self-hosted — the endpoint plus an API key

```yaml
# alertmanager.yml
receivers:
  - name: kubently
    webhook_configs:
      - url: https://<your-kubently-host>/webhooks/alertmanager
        http_config:
          http_headers:            # Alertmanager >= 0.28
            X-API-Key:
              secrets: ["<your-api-key>"]
```

### Routing (both paths)

Route to it like any other receiver:

```yaml
route:
  receiver: default
  group_by: ['alertname', 'cluster', 'namespace']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - receiver: kubently
      matchers:
        - severity =~ "critical|warning"
```

Reload Alertmanager, and test with a real firing alert (or `amtool alert add`).

### Older Alertmanager (self-hosted)

`http_headers` landed in Alertmanager 0.28. On older versions, put the key in
front of Kubently instead of in the receiver — an ingress annotation, a
sidecar, or a small proxy that adds `X-API-Key` — rather than exposing the
endpoint unauthenticated. Cloud is unaffected: the hook URL carries the
authority, so there is no header to add.

## 3. What Kubently does with the payload

Knowing the exact behavior is what lets you tune it.

**Both paths:**

- **Only `firing` alerts are diagnosed.** Resolved alerts in the same payload
  are ignored.
- **The question is built from the alert's labels and annotations:**

  | Alert field | Used as |
  |---|---|
  | `labels.alertname` | The alert name in the question and the Slack header |
  | `labels.cluster` | Which cluster to investigate |
  | `labels.namespace` | Which namespace |
  | `labels.pod` | Which pod |
  | `annotations.summary`, falling back to `annotations.description` | The human context appended to the question |

  Everything else in the payload is ignored. **Alerts that carry `cluster`,
  `namespace` and `pod` labels get materially better diagnoses** than alerts
  that carry only a name — that is the cheapest quality win available here.

- **The answer is formatted for Slack mrkdwn** (single-asterisk bold, no
  headings, no tables) and posted under a header naming the alert:

  ```
  :rotating_light: *Kubently diagnosis for `KubePodCrashLooping`*
  ```

- **Failures are logged, never retried into your channel.** A diagnosis that
  errors leaves a log line and no Slack message.

**The per-payload cap is the same on both paths.** `MAX_ALERTS_PER_PAYLOAD`
is **3** — a code constant with no environment override. Only the first 3
firing alerts in a single Alertmanager payload are diagnosed; **the rest are
dropped.** Cloud deliberately mirrors the OSS constant of the same name in
`kubently.modules.webhook.alertmanager`, so the number does not change when
you move between paths.

**What differs is what happens to those (up to) 3:**

| | Cloud {% include cloud-badge.html %} | Self-hosted |
|---|---|---|
| The 3 diagnosed alerts | **Grouped into a single diagnosis** | **Diagnosed separately** — up to 3 investigations |
| Slack output | One thread root for the payload | One message per diagnosed alert |
| Metering | One unit per payload | n/a |
| Dropped alerts | Silently dropped beyond the cap | Dropped, with a logged warning naming the count |
| Response | — | ACKs `202` with `{"accepted": <n>}`; diagnosis runs in the background because it takes minutes |

Two consequences worth internalizing:

- **A payload of ten alerts loses seven, on either path.** Grouping is not a
  way to hand the agent more evidence — past three, it is a way to lose
  alerts. Group so that a payload *is* one problem, and keep the alerts that
  reach Kubently few and meaningful.
- **On Cloud the surviving 3 are correlated in one investigation** and cost
  one unit; self-hosted runs them as three unrelated investigations that
  never see each other's evidence. That is the real advantage of the Cloud
  path here, not extra capacity.

## 4. Tuning the noise

The 3-alerts-per-payload cap and Alertmanager's grouping settings interact
directly, and the cap is not configurable — so grouping is your only lever.

**Group so that a payload is one problem.** `group_by: ['alertname',
'cluster', 'namespace']` means a hundred pods crashlooping in one namespace
arrive as one group with one alert, and Kubently investigates it once.
Grouping by `pod` would send a hundred payloads. Grouping so loosely that ten
*different* alertnames share a payload is the other failure — seven of them
are dropped.

**Don't route everything.** An alert that is actionable-by-definition (disk
full, cert expiring) doesn't need a root-cause investigation — route those to
your normal receiver. Route the alerts where *"why?"* is the hard part:
crashloops, error-rate spikes, latency regressions, pending pods.

**Let `group_wait` do its job.** A `group_wait` of 30s lets related alerts
coalesce into one payload instead of arriving as three payloads within a
minute. Cutting it to 0 triples your diagnosis volume for the same incident.

**Use `repeat_interval` deliberately.** Each repeat is a fresh investigation
and a fresh Slack post. Four hours is a reasonable floor for anything routed
here.

**Shape the answer with a runbook.** A [runbook](/guides/runbooks/) whose
`match.alerts` globs the alert name is injected into exactly these
investigations — that is how you make the diagnosis for `KubePodCrashLooping`
in `payments` check the DB pool before it blames traffic.

## Verify

**Cloud** {% include cloud-badge.html %} — post a synthetic payload straight
at your hook URL; no headers needed:

```bash
curl -X POST https://<cloud-host>/hooks/alertmanager/<hook-id> \
  -H 'Content-Type: application/json' \
  -d '{"alerts":[{"status":"firing",
        "labels":{"alertname":"KubePodCrashLooping","cluster":"prod-east",
                  "namespace":"shop","pod":"checkout-api-7d9f-abcde"},
        "annotations":{"summary":"Pod is restarting repeatedly"}}]}'
```

**Self-hosted:**

```bash
# The API mounted the webhook
kubectl logs -n kubently deploy/kubently-api | grep "Alertmanager webhook mounted"
# -> Alertmanager webhook mounted at /webhooks/alertmanager

# Send a synthetic Alertmanager payload
curl -X POST https://<your-kubently-host>/webhooks/alertmanager \
  -H "X-API-Key: $KUBENTLY_API_KEY" -H 'Content-Type: application/json' \
  -d '{"alerts":[{"status":"firing",
        "labels":{"alertname":"KubePodCrashLooping","cluster":"prod-east",
                  "namespace":"shop","pod":"checkout-api-7d9f-abcde"},
        "annotations":{"summary":"Pod is restarting repeatedly"}}]}'
# -> {"accepted":1}
```

The `202` means accepted, not diagnosed. Watch the API logs for
`Posted diagnosis for KubePodCrashLooping to Slack`, then check the channel.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Cloud: Alertmanager reports 404 on the hook | Wrong or rotated `hook_id` | Re-copy the hook URL from the dashboard |
| Cloud: three related alerts produced one diagnosis, not three | Cloud groups a payload's diagnosed alerts into a single investigation | Working as designed — one thread, one unit, and they are correlated |
| `503 SLACK_WEBHOOK_URL is not configured` | Self-hosted: the webhook secret isn't wired | Set `api.slackWebhook.existingSecret` and upgrade |
| `202 {"accepted":0}` | No alert in the payload had `status: "firing"` | Check the payload; resolved alerts are skipped by design |
| Only some alerts in a burst get diagnosed | The 3-per-payload cap fired (both paths) | Expected. Self-hosted logs a warning naming the count; adjust `group_by` or narrow the route so fewer distinct alerts share a payload |
| Diagnosis is vague about which cluster | The alert carries no `cluster` label | Add `cluster` (and `namespace`/`pod`) labels via Prometheus `external_labels` or relabeling |
| Nothing arrives and nothing is logged | Alertmanager isn't reaching the endpoint | `amtool config routes test`; check ingress and the `X-API-Key` header |
| Slack message is full of `**bold**` and `#` headings | Something other than Kubently is posting | The alert path formats for Slack mrkdwn; check the source of the message |

## Related

- [Scheduled checks & fleet digests](/guides/scheduled-checks/) — the proactive half that runs without an alert.
- [Runbooks](/guides/runbooks/) — make alert-triggered diagnoses follow your playbook.
- [Metrics & logs](/guides/observability/) — the evidence an alert diagnosis draws on.
- [Slack app](/cloud/slack-app/) {% include cloud-badge.html %} — two-way threads instead of one-way posts.

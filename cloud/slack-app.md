---
layout: page
title: Slack App
subtitle: Two-way incident conversations where your team already is.
permalink: /cloud/slack-app/
---

{% include cloud-badge.html %} The Kubently Slack app turns diagnosis into a
conversation in your incident channel — not just a notification.

- **Diagnoses arrive as threads.** Alert-triggered investigations,
  deployment verifications, and scheduled-check failures post their RCA and
  evidence into the channel you choose.
- **Two-way, with thread memory.** Reply in the thread — *"what changed
  before that?"*, *"check the other regions too"* — and the agent continues
  the same investigation with its context intact.
- **Ask cold, too.** Mention the bot with a fresh question and it starts a
  new investigation against your connected clusters.

The managed Slack app is a [Team-plan](/pricing/) feature. Self-hosted
deployments get one-way Slack notifications via an incoming webhook
(`SLACK_WEBHOOK_URL`) for alerts, verifications, digests, and scheduled
checks — see the [alerts guide](/guides/alerts/).

<div class="alert alert-info">
📝 Setup walkthrough (installing the app to your workspace, choosing
channels, permissions it requests) is being written. Install is initiated
from the integrations page of your dashboard at
<a href="https://cloud.kubently.io">cloud.kubently.io</a>.
</div>

---
layout: page
title: Multi-Cluster Fleets
subtitle: One question, every cluster, in parallel.
permalink: /guides/multi-cluster/
---

{% include guide-stub.html upstream="https://github.com/kubently/kubently/blob/main/docs/MULTI_CLUSTER_TLS.md" label="the upstream multi-cluster TLS doc" %}

Kubently is fleet-native: each cluster runs a lightweight executor that dials
**outbound** to the control plane, so you can register clusters behind
firewalls and NAT with no inbound ingress and no shared kubeconfig. A fleet
question — *"which clusters have pods crashlooping right now?"* — fans out
across registered clusters in parallel, with per-cluster output capped so one
noisy cluster can't drown the rest. An unreachable cluster is reported as
**unreachable — health unknown**, never as healthy.

In **Kubently Cloud** {% include cloud-badge.html %}, multi-cluster fleets
are a [Team-plan](https://cloud.kubently.io/pricing) feature: install the executor Helm chart into
each cluster with your tenant token. Self-hosted, register as many executors
as you like against your own API.

This guide will cover:

- Registering executors across clusters (Cloud and self-hosted paths)
- Cluster naming and per-cluster security modes
- Fleet fan-out behavior, caps, and the fleet health digest
- TLS between executors and a self-hosted control plane

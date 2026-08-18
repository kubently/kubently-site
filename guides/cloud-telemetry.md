---
layout: page
title: Cloud Telemetry
subtitle: CloudWatch, CloudTrail, and Cloud Logging — with zero stored credentials.
permalink: /guides/cloud-telemetry/
---

{% include guide-stub.html upstream="https://github.com/kubently/kubently/blob/main/docs/CLOUD_TELEMETRY.md" label="docs/CLOUD_TELEMETRY.md (copy-paste onboarding for both clouds)" %}

Some root causes live outside the cluster: IAM errors, API throttling,
managed-service failures, control-plane events. Kubently's executor can query
cloud logs, metrics, and audit trails from inside your account — **without
storing a single credential**:

- The executor pod assumes a **customer-controlled, read-only role** via
  EKS Pod Identity / IRSA (AWS) or GKE Workload Identity (GCP).
- Every cloud operation is on a **code-level allowlist** enforced at
  dispatch — IAM is never the only barrier.
- Results ride the existing outbound-only channel, capped with explicit
  truncation notes.
- Revocation is instant and on your side: detach the role, and the
  capability is gone.

Supported operations include CloudWatch Logs Insights, GetMetricData, EKS
control-plane logs, and CloudTrail on AWS; Cloud Logging, Cloud Monitoring,
and GKE audit-log slices on GCP. The executor probes what its identity can
actually do and advertises only that, so the agent never gropes for tools
that would fail.

This guide will cover:

- Creating the read-only role in AWS and GCP (Terraform and console paths)
- Annotating the executor's ServiceAccount (`executor.cloud` Helm values — default off)
- Verifying the capability report, and revoking access

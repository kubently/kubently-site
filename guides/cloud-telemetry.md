---
layout: page
title: Cloud Telemetry via Workload Identity
subtitle: CloudWatch, CloudTrail, and Cloud Logging as evidence — with zero stored credentials.
permalink: /guides/cloud-telemetry/
---

Some root causes live outside the cluster: an IAM denial, API throttling, a
managed-service failure, a control-plane event. This guide gives the Kubently
executor read-only access to your cloud provider's logs, metrics, and audit
trail so those causes land in the diagnosis instead of the "unknown" column.

When you finish, an investigation can answer *"the pods are fine — did the
node group's IAM role lose access to ECR at 09:14?"* using CloudWatch Logs
Insights, CloudWatch metrics, EKS control-plane logs and CloudTrail (AWS), or
Cloud Logging, Cloud Monitoring and GKE audit logs (GCP).

## The security model, first

**Nothing is uploaded, pasted, or rotated.** There is no credential field in
this feature.

- The executor pod picks up **short-lived credentials from the platform's
  native pod identity** — EKS Pod Identity / IRSA on AWS, Workload Identity
  on GKE. No access keys or service-account keys exist anywhere in the
  design.
- The role is **yours**: you create it, you scope it, you can revoke it. The
  Kubently control plane never holds a cloud credential — not in Redis, not
  in transit, not in memory.
- Results ride the executor's existing **outbound-only** channel, the same
  one kubectl results use.
- **Revocation is instant and on your side.** Detach the role and the
  capability is gone; Kubently cannot restore it.

Two independent guardrails keep this read-only:

1. **Your IAM policy** grants only read permissions.
2. **A code-level operation allowlist** in the executor
   ([`kubently/modules/executor/cloud/operations.py`](https://github.com/kubently/kubently/blob/main/kubently/modules/executor/cloud/operations.py))
   — only the exact operations below can run, even if the role were
   accidentally over-scoped. IAM is your boundary; the allowlist is
   Kubently's, and both must permit an operation for it to execute.

### The complete operation allowlist

Every entry maps to exactly one provider API call. There is no generic
"call any SDK method" escape hatch.

| Operation | Family | IAM permissions it needs |
|---|---|---|
| `aws.sts.get_caller_identity` | identity | *(none — GetCallerIdentity needs no permission)* |
| `aws.logs.insights_query` | logs | `logs:StartQuery`, `logs:GetQueryResults` |
| `aws.logs.start_query` | logs | `logs:StartQuery` |
| `aws.logs.get_query_results` | logs | `logs:GetQueryResults` |
| `aws.logs.describe_log_groups` | logs | `logs:DescribeLogGroups` |
| `aws.logs.filter_log_events` | logs | `logs:FilterLogEvents` |
| `aws.metrics.get_metric_data` | metrics | `cloudwatch:GetMetricData` |
| `aws.eks.control_plane_logs` | logs | `logs:FilterLogEvents`, `eks:DescribeCluster` |
| `aws.cloudtrail.lookup_events` | changes | `cloudtrail:LookupEvents` |
| `gcp.logging.list_entries` | logs | `logging.logEntries.list` |
| `gcp.monitoring.list_time_series` | metrics | `monitoring.timeSeries.list` |
| `gcp.gke.audit_logs` | changes | `logging.logEntries.list` |

Results are strictly size-capped, and every truncated result carries an
explicit truncation note into the model's context.

## Prerequisites

- A Kubently executor already installed and connected in the cluster
  ([self-hosted quickstart](/guides/quick-start/) or the
  [Cloud quickstart](/docs/cloud-quickstart/) {% include cloud-badge.html %}).
- Permission to create IAM roles in the AWS account, or service accounts and
  IAM bindings in the GCP project.
- **AWS**: an EKS cluster. **GCP**: a GKE cluster with Workload Identity
  enabled (`--workload-pool=PROJECT_ID.svc.id.goog`; on by default for
  Autopilot).

Everything below wires IAM to the executor's **ServiceAccount**, so its exact
name and namespace matter more than anything else on this page. The chart
names it `<release-name>-executor`:

| Install | Release | Namespace | ServiceAccount |
|---|---|---|---|
| Cloud onboarding {% include cloud-badge.html %} | `kubently-agent` | `kubently-system` | `kubently-agent-executor` |
| Self-hosted (typical) | `kubently` | `kubently` | `kubently-executor` |

**Confirm yours before you start** — a mismatch here is the single most
common reason the whole setup silently does nothing:

```bash
kubectl get serviceaccounts -A | grep executor
```

The examples below use `kubently` / `kubently-executor`. Substitute your own
namespace and ServiceAccount name throughout.

---

## AWS

You will create one IAM role with a read-only policy, wire it to the
executor's ServiceAccount, and turn the feature on in Helm.

### The minimal IAM policy (exact)

This is everything Kubently uses on AWS — nothing more. Save it as
`policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "KubentlyCloudWatchLogsRead",
      "Effect": "Allow",
      "Action": [
        "logs:DescribeLogGroups",
        "logs:StartQuery",
        "logs:GetQueryResults",
        "logs:FilterLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Sid": "KubentlyCloudWatchMetricsRead",
      "Effect": "Allow",
      "Action": ["cloudwatch:GetMetricData"],
      "Resource": "*"
    },
    {
      "Sid": "KubentlyEKSDescribe",
      "Effect": "Allow",
      "Action": ["eks:DescribeCluster"],
      "Resource": "*"
    },
    {
      "Sid": "KubentlyCloudTrailRead",
      "Effect": "Allow",
      "Action": ["cloudtrail:LookupEvents"],
      "Resource": "*"
    }
  ]
}
```

<div class="alert alert-info">
🔒 <strong>Tightening further (optional).</strong>
<code>logs:StartQuery</code> and <code>logs:FilterLogEvents</code> support
resource scoping. To restrict log access to EKS control-plane logs only,
replace the first statement's <code>Resource</code> with
<code>["arn:aws:logs:*:&lt;ACCOUNT_ID&gt;:log-group:/aws/eks/*", "arn:aws:logs:*:&lt;ACCOUNT_ID&gt;:log-group:/aws/eks/*:*"]</code>
— keep <code>logs:GetQueryResults</code> and
<code>logs:DescribeLogGroups</code> on <code>"*"</code>, they don't support
per-group scoping. The executor's startup permission probe (an unscoped
<code>DescribeLogGroups</code> with <code>limit=1</code>) still passes, so
capability detection is unaffected.
</div>

### Option A — EKS Pod Identity (recommended)

No OIDC provider setup, and **no Helm annotation needed**.

#### Terraform

```hcl
data "aws_caller_identity" "current" {}

resource "aws_iam_role" "kubently_executor" {
  name        = "kubently-executor-readonly"
  description = "Kubently executor: read-only cloud telemetry"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "pods.eks.amazonaws.com" }
      Action    = ["sts:AssumeRole", "sts:TagSession"]
    }]
  })
}

resource "aws_iam_role_policy" "kubently_readonly" {
  name = "kubently-cloud-telemetry-readonly"
  role = aws_iam_role.kubently_executor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "KubentlyCloudWatchLogsRead"
        Effect = "Allow"
        Action = [
          "logs:DescribeLogGroups",
          "logs:StartQuery",
          "logs:GetQueryResults",
          "logs:FilterLogEvents",
        ]
        Resource = "*"
      },
      {
        Sid      = "KubentlyCloudWatchMetricsRead"
        Effect   = "Allow"
        Action   = ["cloudwatch:GetMetricData"]
        Resource = "*"
      },
      {
        Sid      = "KubentlyEKSDescribe"
        Effect   = "Allow"
        Action   = ["eks:DescribeCluster"]
        Resource = "*"
      },
      {
        Sid      = "KubentlyCloudTrailRead"
        Effect   = "Allow"
        Action   = ["cloudtrail:LookupEvents"]
        Resource = "*"
      },
    ]
  })
}

resource "aws_eks_pod_identity_association" "kubently_executor" {
  cluster_name    = "my-eks-cluster"
  namespace       = "kubently"
  service_account = "kubently-executor"
  role_arn        = aws_iam_role.kubently_executor.arn
}
```

#### aws-cli

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
CLUSTER_NAME=my-eks-cluster          # your EKS cluster name
NAMESPACE=kubently                   # namespace the executor runs in
KSA=kubently-executor                # the executor's ServiceAccount name

# 1. Ensure the Pod Identity agent add-on is installed (once per cluster)
aws eks create-addon --cluster-name "$CLUSTER_NAME" --addon-name eks-pod-identity-agent || true

# 2. Create the role, trusting the EKS Pod Identity service
cat > trust.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "pods.eks.amazonaws.com" },
      "Action": ["sts:AssumeRole", "sts:TagSession"]
    }
  ]
}
EOF
aws iam create-role \
  --role-name kubently-executor-readonly \
  --assume-role-policy-document file://trust.json \
  --description "Kubently executor: read-only cloud telemetry"

# 3. Attach the minimal policy (policy.json from above)
aws iam put-role-policy \
  --role-name kubently-executor-readonly \
  --policy-name kubently-cloud-telemetry-readonly \
  --policy-document file://policy.json

# 4. Associate the role with the executor's ServiceAccount
aws eks create-pod-identity-association \
  --cluster-name "$CLUSTER_NAME" \
  --namespace "$NAMESPACE" \
  --service-account "$KSA" \
  --role-arn "arn:aws:iam::${ACCOUNT_ID}:role/kubently-executor-readonly"
```

#### Console

IAM → Roles → Create role → *AWS service* → **EKS – Pod Identity** → attach a
customer-managed policy containing the JSON above → name it
`kubently-executor-readonly`. Then EKS → your cluster → *Access* → *Pod
Identity associations* → Create: namespace `kubently`, service account
`kubently-executor`, the new role.

With Pod Identity there is no ServiceAccount annotation to set — skip to
[Enable in Helm](#enable-in-helm).

### Option B — IRSA (IAM Roles for Service Accounts)

Use this on clusters that already standardize on IRSA, or where the Pod
Identity add-on isn't available.

#### Terraform

Reuse `aws_iam_role_policy.kubently_readonly` from Option A; only the trust
policy changes.

```hcl
data "aws_caller_identity" "current" {}
data "aws_eks_cluster" "this" { name = "my-eks-cluster" }

locals {
  oidc = replace(data.aws_eks_cluster.this.identity[0].oidc[0].issuer, "https://", "")
}

resource "aws_iam_role" "kubently_executor" {
  name = "kubently-executor-readonly"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/${local.oidc}" }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${local.oidc}:sub" = "system:serviceaccount:kubently:kubently-executor"
          "${local.oidc}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })
}
```

#### aws-cli

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
CLUSTER_NAME=my-eks-cluster
NAMESPACE=kubently
KSA=kubently-executor

# 1. Ensure the cluster has an OIDC provider (once per cluster)
eksctl utils associate-iam-oidc-provider --cluster "$CLUSTER_NAME" --approve

OIDC_PROVIDER=$(aws eks describe-cluster --name "$CLUSTER_NAME" \
  --query "cluster.identity.oidc.issuer" --output text | sed 's|https://||')

# 2. Create the role with a web-identity trust policy
cat > trust.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${ACCOUNT_ID}:oidc-provider/${OIDC_PROVIDER}"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "${OIDC_PROVIDER}:sub": "system:serviceaccount:${NAMESPACE}:${KSA}",
          "${OIDC_PROVIDER}:aud": "sts.amazonaws.com"
        }
      }
    }
  ]
}
EOF
aws iam create-role \
  --role-name kubently-executor-readonly \
  --assume-role-policy-document file://trust.json

# 3. Attach the minimal policy (same policy.json as Option A)
aws iam put-role-policy \
  --role-name kubently-executor-readonly \
  --policy-name kubently-cloud-telemetry-readonly \
  --policy-document file://policy.json
```

IRSA **requires** the ServiceAccount annotation. Add it to your Helm values:

```yaml
executor:
  serviceAccount:
    annotations:
      eks.amazonaws.com/role-arn: "arn:aws:iam::123456789012:role/kubently-executor-readonly"
```

---

## GCP (GKE Workload Identity)

You will create one Google service account (GSA) with viewer roles, let the
executor's Kubernetes ServiceAccount (KSA) impersonate it, and annotate the
KSA via Helm.

### The minimal role grants (exact)

| Role | Grants | Used for |
|------|--------|----------|
| `roles/logging.viewer` | `logging.logEntries.list` (and log metadata) | Cloud Logging queries, GKE **Admin Activity** audit logs |
| `roles/monitoring.viewer` | `monitoring.timeSeries.list` (and metric metadata) | Cloud Monitoring time series |

Add `roles/logging.privateLogViewer` **only** if you also want the agent to
see **Data Access** audit logs. It is not required for the default feature
set.

#### Terraform

```hcl
resource "google_service_account" "kubently_executor" {
  project      = "my-project"
  account_id   = "kubently-executor"
  display_name = "Kubently executor (read-only telemetry)"
}

resource "google_project_iam_member" "kubently_logging" {
  project = "my-project"
  role    = "roles/logging.viewer"
  member  = "serviceAccount:${google_service_account.kubently_executor.email}"
}

resource "google_project_iam_member" "kubently_monitoring" {
  project = "my-project"
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.kubently_executor.email}"
}

resource "google_service_account_iam_member" "kubently_wi" {
  service_account_id = google_service_account.kubently_executor.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:my-project.svc.id.goog[kubently/kubently-executor]"
}
```

#### gcloud

```bash
PROJECT_ID=my-project
NAMESPACE=kubently
KSA=kubently-executor              # kubectl get sa -n kubently to confirm
GSA=kubently-executor

# 1. Create the read-only Google service account
gcloud iam service-accounts create "$GSA" \
  --project "$PROJECT_ID" \
  --display-name "Kubently executor (read-only telemetry)"

# 2. Grant the two viewer roles
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member "serviceAccount:${GSA}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role roles/logging.viewer

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member "serviceAccount:${GSA}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role roles/monitoring.viewer

# 3. Allow the executor's KSA to impersonate the GSA (Workload Identity)
gcloud iam service-accounts add-iam-policy-binding \
  "${GSA}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project "$PROJECT_ID" \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:${PROJECT_ID}.svc.id.goog[${NAMESPACE}/${KSA}]"
```

#### Console

IAM & Admin → Service Accounts → Create (`kubently-executor`) → grant *Logs
Viewer* and *Monitoring Viewer*. Then on the new service account →
*Permissions* → Grant access → principal
`my-project.svc.id.goog[kubently/kubently-executor]`, role *Workload Identity
User*.

Then annotate the KSA via Helm values:

```yaml
executor:
  serviceAccount:
    annotations:
      iam.gke.io/gcp-service-account: "kubently-executor@my-project.iam.gserviceaccount.com"
```

---

## Enable in Helm

The feature is **off by default**. Turn it on with the `executor.cloud` block:

```yaml
# cloud-values.yaml
executor:
  cloud:
    enabled: true
    provider: "auto"           # or "aws" / "gcp" to skip auto-detection
    # awsRegion: "us-west-2"   # optional; auto-detected on EKS
    # gcpProject: "my-project" # optional; auto-detected on GKE
    refreshInterval: 3600      # seconds between identity/permission re-detection

  # IRSA and GKE Workload Identity only — EKS Pod Identity needs no annotation
  serviceAccount:
    annotations: {}
```

```bash
# self-hosted release name/namespace; use kubently-agent / kubently-system on Cloud
helm upgrade kubently kubently/kubently \
  --namespace kubently --reuse-values -f cloud-values.yaml
```

### The environment variables behind those values

The chart renders the block above into these. You can also set them directly
outside Helm.

| Variable | Default | Values / meaning |
|---|---|---|
| `KUBENTLY_CLOUD_MODE` | `off` | `off` (feature disabled), `auto` (try AWS, then GCP), `aws`, `gcp`. Rendered from `executor.cloud.provider` when `executor.cloud.enabled` is true |
| `KUBENTLY_CLOUD_REFRESH_INTERVAL` | `3600` | Seconds between identity/permission re-detection |
| `KUBENTLY_CLOUD_AWS_REGION` | — | Overrides the region; auto-detected on EKS |
| `KUBENTLY_CLOUD_GCP_PROJECT` | — | Overrides the project; auto-detected on GKE |

<div class="alert alert-info">
📝 These four are absent from upstream
<a href="https://github.com/kubently/kubently/blob/main/docs/ENVIRONMENT_VARIABLES.md"><code>docs/ENVIRONMENT_VARIABLES.md</code></a>
today — a known gap in the engine's env-var reference, not a sign they are
unsupported. They are real and live in <code>sse_executor.py</code>, the
executor Dockerfile, and the executor Deployment template.
</div>

**If the cloud SDKs aren't present in the executor image**, enabling the mode
logs a warning and the feature stays disabled — it degrades rather than
crash-looping the pod. Check the executor logs if you enabled it and see no
identity line at all.

<div class="alert alert-info">
💡 <strong>Capability reporting turns itself on.</strong> The agent discovers
cloud access through the executor's capability report, so enabling cloud mode
implies capability reporting even if
<code>executor.capabilities.enabled</code> is still <code>false</code> — the
executor logs <em>"Cloud mode enabled; turning on capability reporting"</em>
and reports anyway.
</div>

## Verify

Two checks: the executor detected an identity, and the control plane sees the
capability.

**1. The executor detected its identity**

```bash
kubectl logs -n kubently deploy/kubently-executor | grep -i "cloud identity"
```

```
Cloud identity detected: aws (arn:aws:sts::123456789012:assumed-role/kubently-executor-readonly/...), usable families: ...
```

**2. The capability report shows the detected role and the usable operations**

```bash
curl -s -H "X-API-Key: $KUBENTLY_API_KEY" \
  "https://<your-kubently-host>/api/v1/clusters/<cluster-id>/capabilities" \
  | jq .capabilities.cloud
```

```json
{
  "provider": "aws",
  "identity": {
    "provider": "aws",
    "account": "123456789012",
    "principal": "arn:aws:sts::123456789012:assumed-role/kubently-executor-readonly/kubently-executor",
    "region": "us-west-2"
  },
  "operations": [
    "aws.cloudtrail.lookup_events",
    "aws.eks.control_plane_logs",
    "aws.logs.describe_log_groups",
    "aws.logs.filter_log_events",
    "aws.logs.get_query_results",
    "aws.logs.insights_query",
    "aws.logs.start_query",
    "aws.metrics.get_metric_data",
    "aws.sts.get_caller_identity"
  ],
  "usable_families": { "changes": true, "identity": true, "logs": true, "metrics": true },
  "checked_at": "2026-08-18T09:14:00+00:00"
}
```

Read it carefully — this is the whole mechanism in one payload:

- `identity` names the **role you created**, and contains an account and a
  principal. It never contains a credential.
- `operations` lists only the whitelisted operations whose permission family
  **probed as usable with your role**. The agent registers cloud tools for
  this cluster only when this section is present, so it never gropes for
  tools that would fail.
- `usable_families` shows the probe result per family — the fastest way to
  see which half of your policy didn't land.

Detection re-runs every `refreshInterval` seconds (default hourly), so IAM
changes are picked up without a pod restart.

**3. Ask a question that needs it**

> Did anything in CloudTrail change the checkout-api node group's IAM role in
> the last 6 hours?

## Revoke

Everything is under your control, in your account:

- **Instant and total** — delete the pod identity association (AWS), the
  `iam.workloadIdentityUser` binding (GCP), or the role/GSA itself.
- **Narrow instead** — edit the policy to drop a permission. The executor's
  next periodic probe notices, and the agent stops offering the affected
  operations.
- **Feature off** — set `executor.cloud.enabled: false` and upgrade.

No cleanup is needed on the Kubently side, because nothing was ever stored
there.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Log says `No cloud identity detected` | **AWS**: the pod identity association or the IRSA annotation points at the wrong ServiceAccount name. **GCP**: Workload Identity isn't enabled on the node pool, or the KSA annotation and the IAM binding disagree | `kubectl get sa -n kubently` and match the name exactly in the association/annotation/binding |
| Capability shows a provider but only a few operations | The role is missing a permission — each family is probed individually | Diff your policy against [the minimal policy](#the-minimal-iam-policy-exact); check `usable_families` to see which family failed |
| `AccessDenied` in results after it worked before | The role was narrowed or revoked | That is the design working. Re-grant if unintended |
| The agent says the cluster has no cloud access | The executor's capability TTL expired (executor offline?) or `executor.cloud.enabled` is `false` | `kubectl get pods -n kubently`; confirm the value with `helm get values` |
| Nothing in the logs mentions cloud at all | `executor.cloud.enabled` didn't reach the pod | `kubectl exec -n kubently deploy/kubently-executor -- env \| grep KUBENTLY_CLOUD` |

## Related

- [Metrics & logs](/guides/observability/) — in-cluster Prometheus and Loki evidence.
- [Change correlation](/guides/change-correlation/) — CloudTrail and GKE audit logs join the same "what changed?" timeline.
- [Security](/guides/security/) — the full allowlist/RBAC/auth model.
- Upstream: [`docs/CLOUD_TELEMETRY.md`](https://github.com/kubently/kubently/blob/main/docs/CLOUD_TELEMETRY.md)

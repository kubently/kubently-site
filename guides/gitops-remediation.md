---
layout: page
title: GitOps Remediation
subtitle: Propose-only PRs against your manifests repo. A human always merges.
permalink: /guides/gitops-remediation/
---

When a diagnosis points at a manifest, Kubently can close the loop by
**proposing** the fix as a pull request against your GitOps repository —
diffed against the real file, with the investigation evidence in the body,
clearly marked machine-proposed. Your GitOps controller applies it only after
a human reviews and merges.

**The agent's cluster access stays read-only.** This feature adds no write
path to any cluster; it adds a write path to one Git repository that you
scope.

**Default: OFF.** Nothing changes until you configure a remediation target,
and a partial configuration logs a warning and stays off.

## Security — read this before you configure anything

This is the only Kubently feature that holds a credential capable of writing
anywhere. Three things make it safe, and all three are your responsibility to
set up correctly.

### 1. Scope the token to the manifests repo — nothing else

**The token defines the blast radius of a bad proposal.** A user-wide or
org-wide token means a bad proposal can reach every repo that token can see.

- **GitHub** — a **fine-grained personal access token** (or a GitHub App
  installation token) granted to the **ONE** manifests repository, with
  permissions **Contents: Read and write** and **Pull requests: Read and
  write**. Do **not** use a classic PAT with the broad `repo` scope, and never
  a token that can see other repositories.
- **GitLab** — a **project access token** on the **ONE** manifests project,
  **Developer** role, **`api`** scope. Not a personal token, not a group
  token.

### 2. Protect the base branch

Require reviews on the base branch so **merging is enforced by the Git host,
not by convention**. The agent has no merge capability, but the guarantee you
actually want is one the platform enforces.

### 3. Create the secret manually — never in a values file

```bash
kubectl create secret generic kubently-gitops-token \
  --from-literal=token="<repo-scoped-token>" \
  --namespace kubently
```

Rotate it on your normal credential schedule: one secret update plus an API
pod restart.

### Where the token lives, and where it doesn't

PR creation runs on the **API server (control plane)**, never on executors:

- The Git host is an external service — nothing about the manifests repo is
  cluster-local, so the executor channel buys nothing here.
- **Executors are Kubently's read-only arm.** Giving every remote executor a
  Git write token would multiply the credential's blast radius across every
  monitored cluster.
- One API-side token means one secret to scope, one place to rotate, and fix
  PRs that still work when a cluster's executor is offline.

The token is read from the environment inside the provider client. It is
**never a tool argument, never in tool output, never in interceptor traces**,
and provider error bodies are redacted before they can reach model context.

## Prerequisites

- A GitOps manifests repository on GitHub or GitLab, with a GitOps controller
  (ArgoCD, Flux) applying its merged state.
- The repo-scoped token above.
- [Change correlation](/guides/change-correlation/) configured — prompt
  guidance requires proposals to cite change-correlation evidence, so this is
  what makes the feature usable rather than merely enabled.

## Configure

```yaml
# values.yaml
gitRemediation:
  enabled: true
  provider: "github"                    # or "gitlab"
  repo: "acme/k8s-manifests"            # GitHub: owner/repo. GitLab: full project path
  baseBranch: "main"
  existingSecret: "kubently-gitops-token"
  existingSecretKey: "token"
  maxFiles: 5                           # proposals touching more are refused
  maxLines: 200                         # changed lines (diff-measured)
  apiBase: ""                           # GHE / self-hosted GitLab override
```

```bash
helm upgrade kubently kubently/kubently \
  --namespace kubently --reuse-values -f values.yaml
```

For **GitHub Enterprise** set `apiBase: "https://github.example.com/api/v3"`;
for **self-hosted GitLab** set `apiBase: "https://gitlab.example.com/api/v4"`.

### Environment variables the chart renders

| Variable | Description |
|---|---|
| `KUBENTLY_GITOPS_PROVIDER` | `github` or `gitlab` |
| `KUBENTLY_GITOPS_REPO` | Manifests repo (GitHub `owner/repo`, GitLab project path) |
| `KUBENTLY_GITOPS_TOKEN` | Repo-scoped token, from the secret |
| `KUBENTLY_GITOPS_BASE_BRANCH` | Base branch for proposals (default `main`) |
| `KUBENTLY_GITOPS_MAX_FILES` | File cap per proposal (default `5`) |
| `KUBENTLY_GITOPS_MAX_LINES` | Changed-line cap per proposal (default `200`) |
| `KUBENTLY_GITOPS_API_BASE` | API base override for GHE / self-hosted GitLab |

**All three of provider, repo and token must be present** or the tools are not
registered. When off, the system prompt never mentions them.

## How a proposal happens

1. An investigation reaches a **high-confidence root cause** that maps to a
   concrete manifest change — image tag, resource limit, env var, replica
   count, probe threshold.
2. The agent calls **`get_manifest_file`** to fetch the current file from your
   repo. It diffs against reality, never against a remembered or imagined
   manifest.
3. The agent calls **`propose_fix_pr`**: branch off the base branch → commit
   the proposed content → open a PR whose body carries the investigation
   evidence (including the change-correlation citation) and is clearly marked
   **machine-proposed, pending human review**.
4. The PR URL comes back into the RCA. A human reviews, merges or closes, and
   GitOps applies the merged change.

What it looks like in a diagnosis:

```
User: payments pods are OOMKilled since this morning

Agent: (investigates: OOMKilled events, memory metrics at the limit,
        get_recent_changes shows revision 42 halved the memory limit)
       Root cause: revision 42 (deployed 09:14) reduced
       payments/deployment/payments memory limit 512Mi -> 256Mi; working set
       is ~430Mi. Proposed fix PR (pending human review):
       https://github.com/acme/k8s-manifests/pull/87 — restores the 512Mi
       limit. A human must review and merge; ArgoCD will then apply it.
```

## The guardrails

| Guardrail | Mechanism |
|---|---|
| **Propose-only** | The tool surface has **no merge or approve capability**. PR bodies carry a machine-proposed marker and an explicit do-not-merge-without-review note |
| **Size caps** | Proposals above `maxFiles` (5) or `maxLines` changed (200, **diff-measured** — a one-field edit in a 500-line manifest counts 2 lines) are refused **before any write reaches the Git host** |
| **Evidence required** | `propose_fix_pr` refuses proposals without an evidence summary; prompt guidance requires a high-confidence RCA, a minimal fix, and a change-correlation citation |
| **Fetch-before-edit** | Edits must be based on `get_manifest_file` output; identical-content proposals are rejected, which catches already-merged fixes and repo/cluster drift |
| **Token isolation** | Token never enters tool arguments, tool output, or traces; provider errors are redacted |
| **Path hygiene** | Repo paths are validated — no traversal, no absolute paths — before any request is made |

## Reviewing a proposal well

Treat it as a PR from a colleague who read the evidence and has never run this
system in production.

- **Check the evidence, not the diff.** The diff is usually two lines. The
  question is whether the cited change actually caused the symptom — the
  change-correlation citation is right there in the body.
- **Confirm the fix is minimal.** Restoring a limit is a good proposal;
  restructuring a Deployment is not, and the size caps exist to keep the
  second from arriving.
- **Watch for drift.** If the file in git doesn't match what's in the cluster,
  the proposal is fixing git while the cluster stays broken. That's a
  different problem — investigate the drift first.
- **Close freely.** A closed proposal costs nothing. The point is that the
  diagnosis arrived with a concrete change attached, not that every change
  ships.

## Verify

```bash
# Tools registered (a partial configuration logs a warning naming what's missing)
kubectl logs -n kubently deploy/kubently-api | grep -i gitops
```

Then run an investigation whose root cause is a manifest value — the easiest
reproducible case is a deliberately low memory limit on a scratch namespace —
and check that the RCA comes back with a PR URL.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Tools missing entirely | Partial configuration | Look for "GitOps remediation partially configured" in the API logs — it names which of provider/repo/token is absent |
| `REFUSED` on the size cap | The fix touches too many files or lines | The guardrail working. Make the change by hand, or raise `maxFiles`/`maxLines` deliberately |
| HTTP 404 from the provider on a repo that exists | Fine-grained tokens return 404 for repos they are **not granted** | Re-check the token's repository access — this is almost always the scoping, not a typo |
| Identical-content rejection | The fix may already be merged, or the live cluster has drifted from git | Investigate the drift first |
| The agent never proposes anything | Prompt guidance restricts proposals to high-confidence RCAs with a change-correlation citation | Configure [change correlation](/guides/change-correlation/); low-confidence diagnoses are supposed to stay diagnoses |
| GHE/self-hosted GitLab calls fail | `apiBase` not set | Set it to the API base, including the `/api/v3` or `/api/v4` suffix |

## Related

- [Change correlation](/guides/change-correlation/) — the citation a proposal is required to carry.
- [CI/CD integration](/guides/cicd/) — a FAIL verdict is often what a proposal follows.
- [Security](/guides/security/) — the wider trust model.
- Upstream: [`docs/GITOPS_REMEDIATION.md`](https://github.com/kubently/kubently/blob/main/docs/GITOPS_REMEDIATION.md)

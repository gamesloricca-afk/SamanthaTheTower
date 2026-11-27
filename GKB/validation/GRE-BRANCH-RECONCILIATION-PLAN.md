# GRE–GKB Branch Reconciliation Plan

- Prepared: 2026-11-27
- Working branch: `gre-gkb-integration-design`
- Base: `GKB` at `f34f5ce93c6396126ab3e9d40045415ebc03b2de`
- Scope: read-only branch analysis and proposed reconciliation; no history rewrite or cross-branch merge
- Status: PLAN ONLY — reconciliation not executed

## Objective

Make GRE evidence available to GKB without blindly merging two heavily diverged development branches, modifying `main`, or losing either branch's work.

## Observed branch heads

| Branch | Observed HEAD |
|---|---|
| `GKB` | `f34f5ce93c6396126ab3e9d40045415ebc03b2de` |
| `TestAccount` | `62ae508f3473231b81d27903bdf63e899bb739be` |
| `main` | `a0a92971e846a219d2b514d0c52411c205718269` |
| `phase3-completion` | `8ee5dcfb54460905563c99f56ade0df2a857ff8c` |

These are the exact refs inspected for this plan. Re-check branch heads immediately before any future reconciliation operation.

## Current compare results

GitHub compare `GKB...TestAccount`:

- Status: `diverged`.
- TestAccount-only commits (`ahead_by`): 257.
- GKB-only commits (`behind_by`): 339.
- Merge base: `bc9240b70a3d5763dbff05bf85694d16cc09e058`.

GitHub compare `main...GKB`:

- Status: `diverged`.
- GKB-only commits: 339.
- main-only commits: 50.

GitHub compare `main...TestAccount`:

- Status: `diverged`.
- TestAccount-only commits: 256.
- main-only commits: 49.

PR #1 (Phase 3A–3E) is merged into GKB. Its merge commit is `a8c03c6f822c4e22695a94a21f46390b48abb283`. The earlier Phase 3 completion report contains pre-merge wording and should not be treated as current PR state.

## Reconciliation decision

**Do not merge, rebase, reset, force-push, or cherry-pick either entire branch at this stage.**

Reason: the branches have hundreds of unique commits and contain different subsystems. A whole-branch merge has a broad, poorly bounded change surface and risks bringing unrelated account/SJI/XLSX work into GKB or disturbing GKB runtime history.

Recommended approach:

1. Keep `main` untouched.
2. Keep `GKB` as the canonical GKB development base.
3. Treat `TestAccount` as the source branch for GRE artifacts.
4. Integrate only explicitly selected GRE files into a dedicated integration branch based on the current GKB head.
5. Preserve the exact source branch and commit SHA for every imported GRE snapshot.
6. Review path collisions and generated/binary artifacts before copying anything.
7. Do not import account-specific saves, credentials, or unrelated project systems into GKB.
8. Submit a draft PR targeting `GKB`; merge only after owner review and CI.

## File-selection policy for a future GRE snapshot

Potentially relevant, subject to a file-by-file review:

- `GRE/EVIDENCE/**`: source/claim/conflict/report records and templates.
- `GRE/AUDIT/**`: audit notes required to interpret those records.
- Selected `GRE/1/*.md`, `GRE/2/*.md`, `GRE/3/*.md`: readable structural context.
- JSON exports only when a concrete adapter/test needs the exact source record and the file size is acceptable.

Do not copy the entire `TestAccount` branch or unrelated top-level directories. Do not assume every GRE JSON export is a gameplay fact. The original GRE binary is not present in the inspected tree; the manifest's recorded SHA-256 has not been independently recomputed here. Its licensing/redistribution status remains unknown.

## Known stale audit metadata

The existing `GRE/AUDIT/52_gkb_gre_sdk_integration_readiness.md` records an older TestAccount HEAD (`2328df...`) and older compare counts. The current inspected TestAccount HEAD is `62ae508...`. Keep the old audit as historical evidence; update the reconciliation record rather than silently rewriting its historical observation.

## Acceptance criteria before any branch reconciliation

- [ ] Re-fetch all four branch heads and compare results.
- [ ] Produce complete path inventory for selected GRE files and detect collisions.
- [ ] Confirm exact source commit and immutable source snapshot identity.
- [ ] Review license/attribution and binary handling.
- [ ] Confirm no unrelated TestAccount subsystem is included.
- [ ] Run GKB tests against the proposed integration branch.
- [ ] Obtain explicit approval before merging the PR into GKB.
- [ ] No operation targets `main` without separate explicit authorization.

## Current result

**VERIFIED:** a dedicated working branch has been created from the inspected GKB head for integration design.

**NOT PERFORMED:** branch merge/rebase, GRE file import, canonical claim creation, canonical claim promotion, or modification of `main`, `GKB`, and `TestAccount`.

# Samantha GKB — Phase 3A–3E Completion Report

**Overall status: COMPLETED AND CI-VERIFIED** on branch `phase3-completion`.  
**Integration status: NOT MERGED.** Draft PR [#1](https://github.com/gamesloricca-afk/SamanthaTheTower/pull/1) targets `GKB`. No changes were made to `GKB` itself, `main`, or `TestAccount`.

## Objective

Build a reliable staging-to-canonical pipeline without bulk import, automatic verification promotion, or automatic selection between conflicting fan-made sources.

## Phase 3A — Persistent Staging

**VERIFIED**

- Immutable snapshot directory keyed by GitHub Actions run ID.
- Each run stores an immutable manifest; payloads are stored once in a content-addressed object directory and reused by later snapshots.
- Manifests retain raw-input SHA-256, raw byte size, stable content SHA-256, object path/size, retrieval date, SDK package/version, previous-run comparison, and comparison algorithm.
- Stable content objects ignore only generation/retrieval timestamps; unknown fields and original source records remain preserved. Raw hashes remain available for integrity checks.
- Comparison states: `BASELINE`, `ALGORITHM_CHANGED`, `NEW`, `UNCHANGED`, and `CHANGED`.
- Existing run snapshots cannot be overwritten.
- Snapshots are committed to the feature branch; CI artifacts are supplementary.

Live verification:
- Run `45964132479`: first persistent baseline snapshot.
- Run `45964559484`: algorithm migration snapshot; all six files reported `ALGORITHM_CHANGED` because the first baseline predated stable content hashes.
- Run `45964708978`: compared against the second snapshot; all six staged payloads reported `UNCHANGED`.
- Run `45964899352`: compared against the third snapshot; all six staged payloads again reported `UNCHANGED`.
- Run `45965433662`: migrated prior run payloads to deduplicated content-addressed objects; all six payloads reported `UNCHANGED` against the previous run. Six unique object files now back the six staging payloads, while each run retains its own manifest.
- The latest pointer is maintained at `GKB/staging/latest-snapshot.json`; run history is retained under `GKB/staging/snapshots/`, and reusable payloads under `GKB/staging/objects/`.
- The synthetic pipeline test also verifies that timestamp-only changes are `UNCHANGED`, payload changes are `CHANGED`, and duplicate run IDs cannot overwrite an existing snapshot.

The six content-addressed payloads are:
1. `sdk-claims.json` — 320 node-level staging envelopes.
2. `sdk-assertions.json` — 1,618 assertion envelopes.
3. `sdk-edges.json` — 396 relationship candidates.
4. `sdk-contradictions.json` — 3 contradiction envelopes containing 6 source claims.
5. `sdk-domain-catalogs.json` — 347 raw records across four SDK catalogs.
6. `review-queue.json` — 1,618 pending assertion reviews.

Verified consecutive stable manifests include runs `45964708978`, `45964899352`, and `45965433662`; the current pointer is `GKB/staging/latest-snapshot.json`. The payload objects are deduplicated under `GKB/staging/objects/`.

## Phase 3B — Canonical Mapping

**VERIFIED**

- Added a Samantha-owned canonical domain registry with 20 stable domain IDs and labels.
- Added JSON Schema and tests for the registry; all 20 IDs and labels are unique.
- Controlled import accepts only a registered domain ID or label.
- SDK IDs and exact-name matches remain source identifiers/candidates; no Samantha claim IDs or entity mappings are generated automatically.
- Domain registry availability does not imply that every domain already has a populated canonical catalog.

## Phase 3C — Review Workflow

**VERIFIED**

- Assertion staging produces a separate review queue with `PENDING` decisions.
- Review decisions use `APPROVE`, `REJECT`, or `DEFER`.
- Reviewer identity and valid review date are required; duplicate decisions for one staging record are rejected.
- Reviewer identity and review note are preserved in the canonical source record.
- `VERIFIED` requires explicit evidence; `CONFLICTING` requires explicit conflict metadata.
- SDK verification labels are never automatically mapped to Samantha verification statuses.
- No source authority ranking or conflict winner selection occurs.

Live SDK review queue: 1,618 pending; 0 approved in CI. No real SDK claim was approved automatically.

## Phase 3D — Controlled Import

**VERIFIED — importer and synthetic batch test**

- Only explicit `APPROVE` decisions can enter the import preview.
- Batch size is limited to 25 claims.
- Duplicate claim IDs, duplicate decisions, unknown staging references, invalid reviewer metadata, and unregistered domains are rejected.
- Importer uses the existing review-gated canonical normalizer.
- Synthetic test verifies a one-claim approved batch and that its status remains `EXTERNAL-UNVERIFIED` by default.
- Current command emits `controlled-import-preview.json`; it does not write to canonical domain files.

**Not performed:** importing real SDK claims into canonical domain files. There are no user-approved real review decisions yet, so no real claims were imported. This is intentional and preserves the review gate.

## Phase 3E — End-to-End Validation

**VERIFIED**

Successful live runs:
- [Run 45964132479](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45964132479) — initial pipeline and first persistent snapshot.
- [Run 45964559484](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45964559484) — updated pipeline tests and second snapshot. The first attempt at this code revision exposed an incorrect test expectation; the test was corrected, and this run passed.
- [Run 45964708978](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45964708978) — all tests passed and real cross-run comparison returned `UNCHANGED` for all six payload files.
- [Run 45964899352](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45964899352) — repeated the full pipeline successfully; all six payloads again returned `UNCHANGED`.
- [Run 45965433662](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45965433662) — content-addressed storage migration passed; all six payloads returned `UNCHANGED` and were stored once.

Latest integrated synthetic test: 15 cases passed. It covers assertion staging, pending review, defer/approve decisions, canonical domain enforcement, reviewer metadata, duplicate rejection, batch-size enforcement, canonical normalization, and persistent snapshot comparison.

Live source staging against `thetowersdk@0.14.1`:
- 320 node envelopes.
- 1,618 assertion envelopes.
- 396 edge envelopes.
- 3 contradiction envelopes / 6 source claims.
- 347 domain catalog records.
- 1,618 pending review queue entries.
- 0 canonical claims imported; 0 verification statuses promoted.

All tests ran under the repository's Node.js 20 runtime with pinned dependencies.

## Safety and boundaries

- SDK package remains pinned to `thetowersdk@0.14.1`.
- SDK package version, SDK game-version marker, publication date, and retrieval date remain separate.
- Unknown source fields and original SDK records are preserved.
- Conflicting source claims remain separate; no winner is selected.
- No bulk import.
- No account-specific save data was promoted into universal GKB.
- No `main` or `TestAccount` modification.
- No merge has been performed.

## Final status and next step

Phase 3A–3E implementation and CI validation are complete. The feature branch is available in Draft PR #1 targeting `GKB`. The remaining human-controlled actions are PR review/merge authorization and, later, approval of real claims for small controlled canonical imports.

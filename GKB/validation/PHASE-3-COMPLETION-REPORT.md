# Samantha GKB — Phase 3 Completion Report

**Implementation:** COMPLETED on `phase3-completion`  
**CI verification:** PASS — workflow run [45964132479](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45964132479)  
**Integration:** Draft PR [#1](https://github.com/gamesloricca-afk/SamanthaTheTower/pull/1) targeting `GKB`; not merged.

## Objective

Complete Phase 3A–3E without modifying `main` or `TestAccount`, without bulk import, and without automatically promoting SDK claims or choosing between conflicting fan-made sources.

## Phase 3A — Persistent Staging

- Immutable snapshot directory keyed by GitHub Actions run ID.
- Stores raw generated staging JSON and a manifest with raw-file SHA-256, content SHA-256, byte size, retrieval date, SDK package/version, and previous-run comparison.
- Content comparison excludes generation/retrieval timestamps to avoid reporting routine run-time changes as content changes; raw-file hashes remain available for integrity.
- Comparison states: `BASELINE`, `ALGORITHM_CHANGED`, `NEW`, `UNCHANGED`, or `CHANGED`.
- Refuses to overwrite an existing run snapshot.
- Workflow commits snapshots to the development branch; CI artifacts are supplementary.

First verified snapshot:
- Run ID: `45964132479`
- SDK: `thetowersdk@0.14.1`
- Retrieval date: `2026-11-27`
- Files persisted: 6 JSON staging/review files plus manifest and latest pointer.
- Review queue: 1,618 assertions, all `PENDING`; 0 approved.
- Snapshot commit: `7a0b7550061c9a7f0fa72bcec61b36bb3ce40831`.
- Artifact: `gkb-phase3-45964132479`, 30-day retention.

A subsequent run is required to verify real cross-run comparison behavior using the stable content-hash algorithm.

## Phase 3B — Canonical Mapping

- Added Samantha-owned domain registry with 20 stable domain IDs and labels.
- Registry has a JSON Schema and test for unique IDs and labels.
- Controlled importer accepts only domain IDs or labels in this registry.
- SDK identifiers remain source identifiers. No IDs are generated from labels, array positions, or fuzzy matches.
- Existing exact-match crosswalks remain candidates only; no mapping is approved automatically.
- The registry does not claim that every domain has a populated canonical catalog.

## Phase 3C — Review Workflow

- Review queue is generated from assertion staging with `PENDING` state.
- Decisions are separate records: `APPROVE`, `REJECT`, or `DEFER`.
- Each decision requires reviewer and review date; duplicate decisions for one staging record are rejected.
- Approval defaults to `EXTERNAL-UNVERIFIED`; `VERIFIED` requires explicit evidence; `CONFLICTING` requires conflict metadata.
- Reviewer identity and review note are preserved in the canonical source record.
- No source ranking or automatic conflict resolution.

## Phase 3D — Controlled Import

- Importer accepts only explicit approvals and enforces a maximum of 25 claims per batch.
- Duplicate canonical IDs, duplicate decision references, unregistered domains, invalid reviewer metadata, and missing staging references are rejected.
- The command writes an import preview only; it does not write to canonical domain files.
- Production import of real claims requires reviewed decision records and a separate explicit integration step.

## Phase 3E — End-to-End Validation

Workflow run `45964132479` completed successfully:
- Node.js 20 runtime and pinned dependency verification passed.
- SDK claim staging test: 15 cases passed.
- SDK assertion staging test: 25 cases passed.
- SDK edge staging test: 24 cases passed.
- SDK contradiction staging test: 22 cases passed.
- SDK domain catalog staging test: 22 cases passed.
- Review-gated normalizer test: 22 cases passed.
- Source comparison validator test: 14 cases passed.
- Canonical domain registry test passed (20 unique domains).
- Phase 3 integrated synthetic pipeline test: 12 cases passed in this run; this test is being strengthened to cover stable content-hash comparisons and registry enforcement.
- Real SDK staging outputs generated: 320 node claims, 1,618 assertion envelopes, 396 edges, 3 contradiction records (6 source claims), and 347 catalog records across Research, Workshop, Cards/Masteries, and Perks.
- No canonical import or verification promotion was performed.

A passing test proves pipeline behavior and schema compatibility, not gameplay truth.

## Safety and interpretation

- SDK package version, SDK graph game-version marker, publication date, and retrieval date remain distinct.
- Unknown source fields remain in original staging records and canonical `sourceRecord`.
- Contradictory source claims remain separate; no winner is selected.
- Account-specific save data is not imported into universal GKB.
- No bulk import, `main` update, `TestAccount` update, or merge was performed.

## Remaining verification

- Run the updated Phase 3 pipeline again after the stable content-hash change and verify a real second-run comparison.
- Keep PR #1 in draft until that comparison is inspected.
- Real human review and any canonical catalog write are intentionally outside the synthetic CI test.

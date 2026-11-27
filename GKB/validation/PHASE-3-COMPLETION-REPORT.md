# Samantha GKB — Phase 3 Completion Report

**Status:** Implementation prepared; completion is conditional on the dedicated GitHub Actions pipeline passing against the pinned SDK and the persistent snapshot commit being verified.

## Objective

Complete Phase 3A–3E without modifying `main` or `TestAccount`, without bulk import, and without automatically promoting SDK claims or choosing between conflicting fan-made sources.

## Phase 3A — Persistent Staging

- Immutable snapshot directory keyed by GitHub Actions run ID.
- Stores the raw generated staging JSON files and a manifest with SHA-256, byte size, retrieval date, SDK package/version, and previous-run comparison.
- Compares each staged file as `BASELINE`, `NEW`, `UNCHANGED`, or `CHANGED`.
- Refuses to overwrite an existing run snapshot.
- Workflow commits snapshots to the development branch; artifacts are supplementary, not the sole persistence layer.

## Phase 3B — Canonical Mapping

- Added Samantha-owned domain registry with stable domain keys and labels.
- SDK identifiers remain source identifiers. No IDs are generated from labels, array positions, or fuzzy matches.
- Existing exact-match crosswalks remain candidates only; no mapping is approved automatically.
- Domain coverage gaps remain explicit; this registry does not claim that all canonical domain catalogs are populated.

## Phase 3C — Review Workflow

- Review queue is generated from assertion staging with `PENDING` state.
- Decisions are separate records: `APPROVE`, `REJECT`, or `DEFER`.
- Review metadata records reviewer and date.
- Approval still defaults to `EXTERNAL-UNVERIFIED`; `VERIFIED` requires explicit evidence; `CONFLICTING` requires conflict metadata.
- No source ranking or automatic conflict resolution.

## Phase 3D — Controlled Import

- Importer accepts only explicit approvals and enforces a maximum of 25 claims per batch.
- Duplicate canonical IDs and missing staging references are rejected.
- The current command writes an import preview only; it does not write to canonical domain files.
- Production import of real claims requires reviewed decision records and a separate explicit integration step.

## Phase 3E — End-to-End Validation

- Synthetic pipeline test covers SDK assertion staging → pending review queue → deferred/approved decisions → bounded canonical normalization → persistent snapshot and cross-run comparison.
- CI must also run existing staging and normalizer tests against the pinned SDK package.
- A passing test proves pipeline behavior and schema compatibility, not gameplay truth.

## Safety and interpretation

- SDK package version, SDK graph game-version marker, publication date, and retrieval date remain distinct.
- Unknown source fields remain in original staging records and canonical `sourceRecord`.
- Contradictory source claims remain separate; no winner is selected.
- Account-specific save data is not imported into universal GKB.
- No bulk import, main-branch update, TestAccount update, or merge is part of this phase.

## Verification record

The completion decision must be updated with actual workflow run URL, commit SHA, test results, and snapshot counts after CI execution. Until then, implementation is **NOT YET CI-VERIFIED**.

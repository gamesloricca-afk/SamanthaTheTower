# Batch 9 — Minimal GKB Source-Comparison Validator

**Branch:** `GKB`  
**Date:** 2026-11-27  
**Status:** IMPLEMENTED; CI execution NOT YET VERIFIED

## Objective

Add a small validator for competing fan-made/community source claims. Reuse the existing canonical claim schema and preserve multiple reports without choosing a winning source.

## Inspection

- Reused `GKB/schema/claim.schema.json`; no parallel claim model or schema change was needed.
- The canonical schema already supports separate claim IDs, per-claim provenance, conflict IDs, related claim IDs, and conflict statuses including `OPEN` and `NOT_COMPARABLE`.
- Runtime is ESM on Node.js 20 and already pins `ajv@8.17.1`.
- Existing GKB CI workflow runs on pushes to `GKB`.

## Implementation

Added:

- `GKB/validation/fixtures/coin-source-comparison.fixture.json`
- `GKB/adapter/source-comparison-validator.mjs`
- `GKB/tests/source-comparison-validator.test.mjs`
- Runtime command `npm run test:source-comparison`
- CI step in `.github/workflows/gkb-origin-compatibility.yml`

The fixture contains eight separate canonical claims:

1. Five Coin Bonus Enhancement cap reports:
   - Game Vault: level 100 / 2x.
   - TheTowerSDK 0.14.1: level 200 / 3x in implementation/tests.
   - Fandom CPK: level 200 / 3x.
   - Tower Hub CPK: level 200 / 3x.
   - Tower Hub Currency/Utility: level 300 / 4x.
2. Two Fetch CPM window descriptions:
   - SDK whole-run average pre-Fetch CPM.
   - Reddit rolling five-minute CPM at time of find.
3. One TowerStats observed Fetch coin share (~0.25% across six sample pre-v29 runs), kept as `NOT_COMPARABLE` because observed run share is not the same metric as a CPM-window formula.

## Validator behavior

- Validates every fixture claim against the existing canonical claim JSON Schema.
- Detects duplicate claim IDs and dangling related-claim references.
- Groups records by conflict ID and checks consistent conflict status.
- Checks that multi-claim conflict groups contain distinct claim text.
- Reports unknown/null source version, publication date, retrieval date, source reference, and applicable game version as provenance warnings.
- Does not select a winner, rank source authority, resolve conflicts, or promote claims to `VERIFIED`.

Missing provenance is a warning rather than an automatic rejection when the canonical schema permits an explicit `null`. This keeps incomplete source metadata visible without discarding the source record.

## Testing

- Test cases were added for schema validation, preservation of separate source claims, the three conflict groups, provenance warnings, malformed claims, and dangling conflict references.
- The new test command is included in the GKB workflow.
- **NOT TESTED:** No successful GitHub Actions run or local dependency-backed test execution was available to verify the new test in this session. The latest commit returned no commit status entries. Do not interpret the presence of the workflow step as a passing test.

## Remaining gaps

- Exact publication dates and applicable game versions remain unknown for several fan-made sources.
- Tower Hub's own CPK and Currency/Utility pages disagree; both records are preserved.
- Fetch's observed run-share result is not directly comparable to a CPM-window formula.
- No canonical claims have been promoted, and no conflicts have been resolved.

## Next priority

Run the GKB workflow and inspect its result. If the validator passes, extend the same minimal fixture pattern to the next small set of disputed mechanics. Do not bulk-import the source catalog.

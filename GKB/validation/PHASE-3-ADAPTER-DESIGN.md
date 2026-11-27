# Phase 3 — GKB Adapter Design

Date: 2026-11-27
Branch: `GKB`
Status: IMPLEMENTATION IN PROGRESS — assertion staging slice implemented; no bulk import or canonical promotion

## Objective

Extend the existing node-level SDK staging adapter so Samantha can inspect the actual SDK knowledge graph at assertion granularity while preserving node context, raw provenance, missing fields, and source-specific verification labels.

The adapter remains Samantha-owned. TheTowerSDK remains an external dependency pinned to `thetowersdk@0.14.1`.

## Existing adapter inspection

`GKB/adapter/sdk-claim-staging.mjs` currently:
- Creates one staging envelope per graph node.
- Uses a conservative display-hint fallback (`subject/title/name/id` and `claim/description/text/content/summary`).
- Preserves the complete source node in `sourceRecord`.
- Preserves raw origins and does not normalize them.
- Sets canonical verification status to `EXTERNAL-UNVERIFIED`.
- Does not promote or bulk-import records.

This is a safe node-level preview, but it does not expose the graph's 1,618 assertions as separate reviewable records. The summary fallback is not an assertion-level claim extraction.

## Observed SDK knowledge graph structure

From the pinned package's read-only CI inspection:
- 320 nodes, 396 edges, 1,618 assertions, 558 node-level source records.
- Node fields include `id`, `kind`, `label`, `summary`, `claimType`, `verification`, `compartment`, `assertions`, `sources`, `traps`, and optional schema fields `units`, `validRange`, `implementedBy`.
- Assertion fields observed: `subject`, `predicate`, `value`, `provenance`, and optional `verification`.
- Assertion provenance observed: `origin`, `ref`, `readAgainstVersion`, `verifiedAt`.
- 797 assertions have no assertion-level `verification` field. Do not copy the parent node's verification value into them.
- 1,504 assertions carry `readAgainstVersion: v28.3.0`; all 1,618 carry `ref` and `verifiedAt`.
- SDK verification values are `verified_here`, `unverified`, and `contradicted`.
- Node claim types are `objective` and `sentiment`.
- SDK edge kinds are `gates`, `scales`, `caps`, `independentOf`, `separatePurchaseFrom`, `derivedFrom`, `memberOf`, and `appliedBefore`.
- The graph has three contradiction records. SDK `findContradictions()` results include `likelyValue` and `authorityRank`.

## Proposed staging records

### A. Node context envelope

Keep the existing node envelope. It is the parent/context record:
- Retain the complete node in `sourceRecord`.
- Keep its SDK node ID, label, summary, claim type, verification, compartment, sources, units, valid range, traps, and unknown fields.
- Do not treat its summary as a complete list of claims.

### B. Assertion staging envelope

Create one separate review envelope per assertion:
- `stagingId`: deterministic ID derived from the source node ID and assertion index.
- `sourceNodeStagingId`: link to the parent node context envelope.
- `sourceAssertionIndex`: original index within the node's assertions array.
- `subject`: exact SDK assertion subject.
- `predicate`: exact SDK assertion predicate.
- `value`: exact typed SDK assertion value.
- `claimPreview`: deterministic display-only text, e.g. `predicate = JSON.stringify(value)`; it is not a canonical claim.
- `classificationCandidate`: `OBJECTIVE` for exact SDK `objective`, `SENTIMENT` for exact `sentiment`; otherwise null. This remains a candidate until review.
- `sourceVerification`: exact SDK assertion verification string, or null when the field is absent.
- `sourceNodeVerification`: exact parent node verification string, kept separately.
- `verificationStatus`: always `EXTERNAL-UNVERIFIED`.
- `provenance`: preserve raw `origin`, `ref`, `readAgainstVersion`, and `verifiedAt`; record SDK package/version and actual retrieval date separately.
- `sourceRecord`: complete unmodified assertion object, including unknown fields.
- `limitations`: explicitly state that this is staging only and has not been fact-checked.

Do not infer a canonical `applicableGameVersion` from `readAgainstVersion` until its semantics are assessed. Do not interpret `verifiedAt` as a publication date or Samantha review date.

### C. Edge staging envelope

Stage graph edges separately from claims:
- Preserve exact `from`, `to`, `kind`, `claimType`, `compartment`, `note`, and `sources`.
- An explicit, reversible syntax mapping may convert the eight SDK lower-camel kinds to Samantha's uppercase relationship enum.
- Relationship verification remains `EXTERNAL-UNVERIFIED`.
- Keep the original edge in `sourceRecord`.
- Do not infer a relationship that is not present in the SDK edge.

### D. Contradiction staging

Preserve each SDK contradiction record and its related source-specific claims. Keep `likelyValue` and `authorityRank` as SDK analysis metadata only. Do not use them to select a winner or set Samantha conflict status to RESOLVED.

## Explicit mapping policy

| SDK field | Staging treatment | Canonical treatment |
|---|---|---|
| node `claimType: objective/sentiment` | `classificationCandidate` | Requires review before canonical classification |
| assertion `verification` | Preserve raw as `sourceVerification` | Never automatically maps to Samantha status |
| missing assertion `verification` | Preserve as missing/null with presence flag | Never inherit node verification |
| `origin` | Preserve exact raw value and path | No mapping without explicit evidence/approval |
| `readAgainstVersion` | Preserve exact source field | Not automatically `applicableGameVersion` |
| `verifiedAt` | Preserve exact source date | Not publication date or Samantha review date |
| edge `kind` | Preserve raw plus explicit syntax mapping | Relationship remains EXTERNAL-UNVERIFIED |
| `likelyValue` / `authorityRank` | Preserve as SDK contradiction metadata | Never select factual winner |

## Origin handling

The SDK graph currently contains origin values:
- `code`: 1,522 occurrences
- `wiki`: 884
- `user`: 82
- `game`: 70
- `save`: 10
- `sheet`: 11

The SDK JSON Schema rejects `game`, although it occurs in the actual graph. Samantha's origin adapter already keeps `game` unresolved and requires explicit evidence for any mapping. Keep all other origins unmapped until reviewed; their names alone do not prove Samantha source-type equivalence.

## Test requirements before using the adapter

1. One assertion envelope is created for each actual assertion; count must equal 1,618 for the current pinned graph.
2. Missing assertion verification count remains 797.
3. Every assertion's raw object is preserved exactly.
4. Node context linkage resolves to the correct parent node.
5. `readAgainstVersion`, `verifiedAt`, and `ref` remain separate fields.
6. All raw origin values and occurrence counts are preserved, including 70 `game` values.
7. All eight edge kinds map reversibly to the Samantha relationship enum, with raw kind retained.
8. SDK contradiction `likelyValue` never changes claim or conflict resolution.
9. No canonical claim is created, no status is promoted, and no GKB bulk import is performed.

## Implemented first slice

Added:
- `GKB/schema/sdk-assertion-staging.schema.json`
- `GKB/adapter/sdk-assertion-staging.mjs`
- `GKB/tests/sdk-assertion-staging.test.mjs`
- Runtime commands `test:sdk-assertion-staging` and `stage:sdk-assertions`
- CI steps for the assertion-level test and actual pinned graph staging.
- Workflow artifact upload for both node-level and assertion-level staging files, retained for 14 days.

The existing node envelope was also aligned with the public package export:
- Source reference now uses `thetowersdk/knowledge-graph.json`.
- Node provenance now records SDK graph version, SDK schema version, graph `generatedFor`, and actual `retrievedAt` separately.
- Node records containing origin `game` now report `UNRESOLVED`, rather than generic unmapped status.
- Missing/invalid retrieval dates are rejected.

The synthetic adapter test passed 25 assertions/cases. It verifies:
- One envelope per source assertion.
- Source node linkage and source assertion index.
- Exact preservation of the original assertion object.
- Missing assertion verification remains missing even when the parent node has `verified_here`.
- SDK verification labels remain source metadata; Samantha status remains `EXTERNAL-UNVERIFIED`.
- `readAgainstVersion`, `verifiedAt`, and actual `retrievedAt` remain separate.
- `game` origin remains unresolved; other origins remain unmapped for review.
- No canonical claim, promotion, or GKB import occurs.

The actual pinned graph staging report passed in GitHub Actions run:
- https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45938447688

Actual staging counts:
- 320 source nodes.
- 1,618 assertion envelopes generated and schema-validated.
- Assertion verification: 554 `verified_here`, 266 `unverified`, 1 `contradicted`, and 797 missing.
- Classification candidates: 1,602 OBJECTIVE and 16 SENTIMENT. These are candidates only, not approved canonical classifications.
- Assertion-level origins: code 1,084; wiki 438; user 31; game 50; save 6; sheet 9.
- All 50 assertion-level `game` origins remain unresolved. The other origins remain unmapped pending review.
- The node-level staging adapter preserves the full node objects and their nested source records. The 20 additional `game` origin occurrences outside assertion provenance remain in those parent node records; the combined graph-level origin count remains 70.
- Workflow artifact upload succeeded for `sdk-claims.json` and `sdk-assertions.json`, with 14-day retention.

The assertion `claimPreview` is a deterministic display hint (`predicate = JSON.stringify(value)`), not a canonical natural-language claim. No source assertion was rewritten or promoted.

## Edge staging implementation

Added:
- `GKB/schema/sdk-edge-staging.schema.json`
- `GKB/adapter/sdk-edge-staging.mjs`
- `GKB/tests/sdk-edge-staging.test.mjs`
- Runtime commands `test:sdk-edge-staging` and `stage:sdk-edges`
- CI artifact path for `GKB/staging/sdk-edges.json`

The synthetic edge adapter test passed 24 cases. It checks all eight explicit SDK-to-Samantha relationship-name mappings, endpoint linking, unknown-kind preservation, unresolved endpoints, source preservation, and no canonical relationship promotion.

The actual pinned graph edge staging passed in GitHub Actions run:
- https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45938592716

Actual edge staging:
- 396 source edges.
- 396 edge envelopes generated and schema-validated.
- All 396 endpoints linked to parent node staging IDs.
- All eight SDK edge kinds mapped by exact name conversion only.
- Edge source origins: code 244, wiki 150, user 2.
- Every edge remains `EXTERNAL-UNVERIFIED`; every mapped relationship is a candidate only.
- No canonical GKB relationship was created.

The relationship mapping is syntactic and reversible. It does not assert that the underlying mechanic is true or that the SDK edge is correctly modeled.

## Contradiction staging implementation

Added:
- `GKB/schema/sdk-contradiction-staging.schema.json`
- `GKB/adapter/sdk-contradiction-staging.mjs`
- `GKB/tests/sdk-contradiction-staging.test.mjs`
- Runtime commands `test:sdk-contradiction-staging` and `stage:sdk-contradictions`
- CI artifact path for `GKB/staging/sdk-contradictions.json`

The synthetic contradiction adapter test passed 22 cases. It verifies that source claims, `likelyValue`, `authorityRank`, cross-source metadata, and unknown analysis fields are preserved without resolving a conflict.

The actual pinned graph contains 3 SDK contradiction analyses, which produced 3 staging envelopes containing 6 source claims:
- Source origins: code 3, wiki 3.
- `likelyValue` is preserved as SDK hint metadata only.
- `authorityRank` is preserved but never used to choose Samantha's winner.
- All records remain `UNRESOLVED`, `EXTERNAL-UNVERIFIED`, and `PENDING_REVIEW`.
- No canonical conflict group or GKB claim was created.

Example of one SDK conflict (preserved as two separate source claims):
- Subject: `module.subEffect.slot8`
- Predicate: `opensAtLevel`
- SDK code-origin claim: value `241`, authorityRank `2`.
- SDK wiki-origin claim: value `242`, authorityRank `5`.
- SDK `likelyValue`: `241`.

Samantha does not select 241 over 242. Both source reports remain available for display and later review.

GitHub Actions run:
- https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45938802821
- Result: SUCCESS, including all staging tests, generation steps, and staging artifact upload.

## Cross-stage integrity report

Added `GKB/adapter/sdk-staging-integrity-report.mjs` and runtime command `report:sdk-staging-integrity`. CI cross-checks the four staging streams against the exact SDK graph and the SDK contradiction helper output.

The combined integrity report passed in GitHub Actions run:
- https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45939132518

Verified counts:
- 320 node envelopes.
- 1,618 assertion envelopes.
- 396 edge envelopes.
- 3 contradiction envelopes.
- 2,337 total staging envelopes.
- 797 missing assertion verification fields preserved as missing.
- 396 edge endpoints linked to the corresponding node envelopes.
- All eight relationship candidates mapped by explicit reversible name conversion.
- All raw origins across nodes, edges, and graph contradictions match the source graph counts: code 1,522; wiki 884; user 82; game 70; save 10; sheet 11.
- Full sourceRecord preservation checks passed for nodes, assertions, edges, raw graph contradictions, and SDK contradiction analysis.
- No canonical claims, relationships, or conflict groups were created; no verification was promoted; no bulk import occurred.

The workflow uploaded five review files as artifact `gkb-sdk-staging-165` (14-day retention):
- [Download staging review artifact](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45939132518/artifacts/15171673370)

The artifact contains node, assertion, edge, contradiction staging JSON, and the combined integrity report. These are temporary review outputs, not canonical GKB data.

## Safety boundary

Phase 3 starts with deterministic staging and reports only. The canonical claim schema remains unchanged unless a demonstrated schema gap requires a separate review. Do not overwrite the unique-module catalog, repair SDK graph data, decrypt saves, or import player-specific records.

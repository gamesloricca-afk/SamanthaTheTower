# Phase 3 — GKB Adapter Design

Date: 2026-11-27
Branch: `GKB`
Status: DESIGN BASELINE — no bulk import or canonical promotion

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

## Safety boundary

Phase 3 starts with deterministic staging and reports only. The canonical claim schema remains unchanged unless a demonstrated schema gap requires a separate review. Do not overwrite the unique-module catalog, repair SDK graph data, decrypt saves, or import player-specific records.

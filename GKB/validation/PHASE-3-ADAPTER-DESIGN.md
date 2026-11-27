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

## Review-gated canonical normalizer

Added:
- `GKB/adapter/reviewed-assertion-normalizer.mjs`
- `GKB/tests/reviewed-assertion-normalizer.test.mjs`
- Runtime command `test:reviewed-assertion-normalizer`
- CI step `Test review-gated canonical claim normalizer`

The normalizer does not run against the full SDK graph. It requires a separate review object with:
- `decision: APPROVE`
- Explicit canonical claim ID, domain, subject, claim text, classification, and review date.
- Optional explicit source type, game version, source version, publication date, evidence, verification status, related claims, relationships, and conflict metadata.

It defaults to:
- `verificationStatus: EXTERNAL-UNVERIFIED`
- `sourceType: UNKNOWN`
- `applicableGameVersion: null`
- `sourceVersion: null`
- `publicationDate: null`

It never maps SDK `verified_here` to VERIFIED, never maps origin values to source types, and never maps `readAgainstVersion` to game version automatically. SDK fields remain in provenance and the full source assertion/node/staging records remain in `sourceRecord`.

The synthetic test passed 22 cases, including rejection of missing approval, invalid classification/date, VERIFIED without evidence, and CONFLICTING without explicit conflict metadata. No canonical claim was generated from the real SDK graph.

## Cross-stage integrity report

Added `GKB/adapter/sdk-staging-integrity-report.mjs` and runtime command `report:sdk-staging-integrity`. CI cross-checks the four staging streams against the exact SDK graph and the SDK contradiction helper output.

The combined integrity report passed in GitHub Actions run:
- https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45939435882

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
- [Download staging review artifact](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45939435882/artifacts/15171089758)

The artifact contains node, assertion, edge, contradiction staging JSON, and the combined integrity report. These are temporary review outputs, not canonical GKB data.

## Safety boundary

Phase 3 starts with deterministic staging and reports only. The canonical claim schema remains unchanged unless a demonstrated schema gap requires a separate review. Do not overwrite the unique-module catalog, repair SDK graph data, decrypt saves, or import player-specific records.


## Identifier mapping — first catalog pass

Added a conservative identifier comparison report:
- `GKB/adapter/sdk-identifier-mapping.mjs`
- `GKB/tests/sdk-identifier-mapping.test.mjs`
- Runtime commands: `test:sdk-identifier-mapping` and `report:sdk-identifier-mapping`
- CI artifact: `GKB/reports/sdk-identifier-mapping-report.json`

The first pass compares all 320 SDK graph nodes against the one currently available canonical catalog, `GKB/domains/modules-unique.json` (28 records).

Actual pinned SDK 0.14.1 result:
- 28 `NAME_CANDIDATE`: exact label/name equality for the 28 unique modules.
- 0 `EXACT_ID_MATCH`: SDK graph IDs use a different naming form from Samantha's module IDs.
- 0 `AMBIGUOUS`.
- 292 `UNMATCHED`: these nodes are outside the current 28-record catalog; this does not mean they are unknown to Samantha.

The report keeps SDK node IDs and Samantha canonical IDs side by side. Exact name matches remain candidates only. It performs no fuzzy matching, automatic approval, canonical rewrite, or import. A name match is not treated as proof of semantic equivalence.

GitHub Actions validation:
- Run: https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45943217861
- Result: SUCCESS.
- Staging artifact: `gkb-sdk-staging-193`, 14-day retention.

Remaining gap: expand the comparison catalog domain by domain only after each canonical catalog has stable IDs and its own schema validation. Do not try to resolve the 292 unmatched records by fuzzy matching.


## Identifier mapping — UW and Enemy reference pass

Extended the read-only identifier mapper to compare the SDK graph against:
- The canonical Unique Modules catalog (`GKB/domains/modules-unique.json`).
- Numbered section headings in `GKB/ULTIMATE_WEAPONS_MECHANICS.md`.
- Numbered section headings in `GKB/ENEMY_MECHANICS.md`.

Document heading matches are explicitly typed `DOCUMENT_REFERENCE_CANDIDATE`. Their IDs are navigation anchors such as `GKB-UW-001#chain-lightning`; they are not canonical entity IDs or claim IDs.

Pinned SDK 0.14.1 result from CI run #200:
- SDK graph nodes inspected: 320.
- Canonical Unique Modules records: 28; exact-name candidates: 28.
- Ultimate Weapon document anchors: 9; heading candidates: 9.
- Enemy document anchors: 21; heading candidates: 5.
- Total candidate matches: 42 (28 canonical-catalog name candidates and 14 document-reference candidates).
- Exact ID matches: 0.
- Ambiguous matches: 0.
- Unmatched nodes: 278.
- Approved mappings: 0.

The five enemy heading matches are Boss, Protector, Vampire, Scatter, and Saboteur. The remaining enemy document headings were not matched by exact label; no fuzzy or semantic inference was attempted.

Coverage gaps:
- Research, Workshop, Cards and Masteries, and Perks do not yet have Samantha-owned structured canonical catalogs in this branch. They remain `NO_CANONICAL_CATALOG`; SDK exports are not silently substituted for Samantha catalogs.
- Ultimate Weapons and Enemies are document-reference coverage only, not canonical catalog coverage.
- The 278 unmatched nodes are unmatched against the limited references above; this does not mean they are unknown to Samantha.

Safety:
- No canonical IDs were generated for UW or Enemies.
- No source document or SDK record was rewritten.
- No canonical claims or relationships were created.
- No verification statuses were promoted.
- No bulk import was performed.


## Raw SDK domain catalog staging — Research, Workshop, Cards/Masteries, Perks

Added a read-only staging adapter, structural schema, and fixture tests:
- `GKB/adapter/sdk-domain-catalog-staging.mjs`
- `GKB/schema/sdk-domain-catalog-staging.schema.json`
- `GKB/tests/sdk-domain-catalog-staging.test.mjs`
- Runtime commands: `test:sdk-domain-catalog-staging`, `stage:sdk-domain-catalogs`
- CI output: `GKB/staging/sdk-domain-catalogs.json` (artifact only; not committed as canonical data)

Verified against pinned `thetowersdk@0.14.1` by CI run #213, retrieved 2026-11-27:
- SDK game-version marker: `v28.3.0` (kept separate from SDK package version).
- Research: `LAB_CATALOG`, 234 records.
- Workshop: `getWorkshopStatDefinitions()`, 47 records.
- Cards and Masteries: `CARD_TEMPLATES`, 32 records.
- Perks: `ALL_PERKS`, 34 records.
- Total staged records: 347.

Raw records are wrapped with their original source index and retained without normalization, generated identifiers, deduplication, or field filtering. Unknown fields and source order are preserved. Each domain carries its SDK export reference and all records remain `OBJECTIVE / EXTERNAL-UNVERIFIED`.

This is staging data, not canonical Samantha knowledge. No canonical catalog, claim, or relationship was created; no verification status was promoted; no bulk import was performed.

CI:
- Run: https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45944793070
- Result: SUCCESS (42 steps).
- Artifact: `gkb-sdk-staging-213`, 14-day retention.

## Raw catalog structure review

Reviewed the staged artifact from the latest successful CI run (#215) without changing or normalizing its records:

- All 347 records are JSON objects.
- Research: 234/234 have non-empty unique `slug` and `name`; 229/234 contain `value`; 80/234 contain `description` and `unit`. Five records without `value`: `recharge_demon_mode`, `recharge_missile_barrage`, `recharge_nuke`, `recharge_second_wind`, and `swamp_rend_additional_enemies`.
- Workshop: 47/47 have non-empty unique `key` and `label`; each record also has `category`, `levels`, `minLevel`, and `maxLevel`.
- Cards and Masteries: 32/32 have non-empty unique `id` and `name`; each record has both card and mastery fields.
- Perks: 34/34 have non-empty unique `perk` text, `pool`, and `quantity`. No separate `id` field was observed. The text value is only an external identifier candidate, not a generated Samantha ID.
- No duplicate values were found in the four observed candidate-key fields within their respective catalogs. This does not establish cross-domain identity or canonical uniqueness.
- The 5 missing Research `value` fields remain missing; no defaults or inferred values were added.

Candidate source keys for future mapping are therefore `slug` (Research), `key` (Workshop), `id` (Cards/Masteries), and the literal `perk` field (Perks). Treat all as SDK-local source identifiers only. Do not generate Samantha canonical IDs from names, array positions, or perk display text.

Latest CI verification:
- Run #215: https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45945018208
- Result: SUCCESS; raw catalog staging test, schema validation, SDK generation, and artifact upload completed.
- Artifact: `gkb-sdk-staging-215`, 14-day retention.

Next priority: create a small, explicit crosswalk report from SDK graph nodes to these SDK data-catalog source keys only where exact identifier or exact label equality is present. Keep it labelled SDK-to-SDK candidate linkage, not Samantha canonical mapping; preserve ambiguity and unmatched records, and do not create canonical IDs or claims.



## SDK-to-SDK data catalog crosswalk — first execution

Activated the existing crosswalk in CI after the four raw domain catalogs are staged:
- `GKB/adapter/sdk-data-catalog-crosswalk.mjs`
- `GKB/tests/sdk-data-catalog-crosswalk.test.mjs`
- Runtime commands: `test:sdk-data-catalog-crosswalk` and `report:sdk-data-catalog-crosswalk`
- CI artifact: `GKB/reports/sdk-data-catalog-crosswalk.json`

The adapter compares the 320 SDK knowledge-graph nodes with the 347 staged data-catalog records using exact source-ID equality or exact label equality only. The explicit SDK source fields are `slug/name` (Research), `key/label` (Workshop), `id/name` (Cards and Masteries), and `perk` (Perks; no separate ID field observed). The date validation and report newline handling were corrected; the invalid-staging fixture was also corrected after the first CI test exposed that the fixture still supplied an array.

Verified result from CI run #224:
- Research: 3 exact source-ID matches and 3 exact-label candidates; 6 graph nodes with candidates.
- Workshop: 2 exact-label candidates; 2 graph nodes with candidates.
- Cards and Masteries: 6 exact-label candidates; 6 graph nodes with candidates.
- Perks: 0 exact-label candidates; 0 graph nodes with candidates.
- 14 distinct graph nodes have at least one candidate across the four catalogs.
- 0 ambiguous nodes within these domain comparisons; 0 approved mappings.

These are SDK-to-SDK candidates only. A candidate is not proof of semantic identity. The 306 remaining graph nodes are unmatched against these four selected catalogs, not necessarily unknown to the SDK or Samantha. Perks' zero result is limited to exact comparison between graph-node labels and the `perk` field; no semantic or normalized matching was attempted.

CI:
- Run: https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45946003553
- Result: SUCCESS.
- Artifact: `gkb-sdk-staging-224` (14-day retention), including the crosswalk report.

Safety boundary: no Samantha canonical IDs, claims, or relationships were created; no candidate was approved; no source data was modified; no canonical import or verification promotion occurred. This report does not replace the pending crosswalk from SDK records to Samantha-owned source documents and canonical catalogs.


## SDK domain catalog structural audit — CI integration

The existing read-only audit was connected to the runtime and CI pipeline:
- `GKB/adapter/sdk-domain-catalog-audit.mjs`
- `GKB/tests/sdk-domain-catalog-audit.test.mjs`
- Runtime commands: `test:sdk-domain-catalog-audit` and `report:sdk-domain-catalog-audit`
- CI report: `GKB/reports/sdk-domain-catalog-audit.json`

The audit covers the four staged SDK catalogs only: Research, Workshop, Cards and Masteries, and Perks. It reports:
- Missing/empty source identifiers and labels using the explicitly observed SDK field mapping.
- Duplicate source identifiers within a catalog, repeated labels, and structurally identical raw records.
- Missing fields, null/empty values, observed JSON type variations, source-index/order anomalies, record-count mismatches, and declared-versus-observed key mismatches.
- Exact labels shared across multiple selected catalogs as `CROSS_DOMAIN_LABEL_COLLISION` informational observations.

A cross-domain label collision is not treated as entity identity. Repeated labels are not automatically duplicates. Nulls, empty strings, and absent fields are reported without deciding whether the field is optional. The audit does not validate game mechanics, numerical ranges, units, formulas, or factual correctness.

The audit preserves raw records and source order. It does not deduplicate, normalize, repair, generate IDs, approve crosswalks, create canonical claims, or promote verification statuses. All SDK records remain `EXTERNAL-UNVERIFIED`.

The report's `PASSED` status means the audit completed successfully; it does not mean that every catalog is free of findings. Finding severity is reported separately as `ERROR`, `WARNING`, and `INFO`. Structural findings are not automatically gameplay conflicts.



## Nested SDK catalog structure and numeric observation audit

Extended the read-only domain catalog audit to recursively inspect nested JSON structures within each raw SDK record.

Additional report fields include:
- Nested field paths, using `[]` for array elements (for example, `levels[].value`).
- Observed JSON types and the number of records in which each path appears.
- Null and empty-string counts.
- Array-length observations.
- Nested object key-set variants with source record indices.
- Descriptive numeric count, minimum, maximum, and distinct-value count.

Additional informational findings:
- `NESTED_OBJECT_SHAPE_VARIATION`
- `NESTED_ARRAY_LENGTH_VARIATION`

These observations do not assume every record must have the same nested structure or array length. Numeric minimum/maximum are descriptive only; the audit does not infer expected bounds, units, level progression, costs, or gameplay formulas. A numeric/string type variation is reported, not coerced.

A dedicated nested-audit fixture test covers nested arrays, differing object key sets, mixed numeric/string values, nulls, and array-length differences. The full catalog report remains read-only; no source record is modified, normalized, repaired, deduplicated, or promoted. The CI artifact remains `GKB/reports/sdk-domain-catalog-audit.json`.


## Research–Workshop SDK catalog comparison audit

Added a read-only comparison report for the staged Research and Workshop exports:
- `GKB/adapter/sdk-research-workshop-comparison.mjs`
- `GKB/tests/sdk-research-workshop-comparison.test.mjs`
- `GKB/schema/sdk-research-workshop-comparison.schema.json`
- Runtime commands: `test:sdk-research-workshop-comparison` and `report:sdk-research-workshop-comparison`
- CI artifact: `GKB/reports/sdk-research-workshop-comparison.json`

Comparison rules:
- Research identity field: `slug`; display field: `name`.
- Workshop identity field: `key`; display field: `label`.
- Only exact string equality is used. No case folding, fuzzy matching, semantic matching, or identifier generation.
- Exact Research `slug` ↔ Workshop `key` equality is reported separately from Research `name` ↔ Workshop `label` text candidates.
- Shared top-level fields, domain-only fields, JSON types, and nested `levels` object-key shapes are reported.
- Candidate pairs remain observations only; no entity identity, mechanic equivalence, or cross-catalog relationship is inferred.

Initial observed result from CI:
- Research: 234 records; Workshop: 47 records.
- Shared top-level fields: `category` and `levels`.
- Research-only fields: `base`, `description`, `name`, `slug`, `unit`, `value`.
- Workshop-only fields: `key`, `label`, `maxLevel`, `minLevel`.
- Exact Research `name` ↔ Workshop `label` candidates: 21.
- Exact Research `slug` ↔ Workshop `key` matches: 0.
- For the 21 exact-label candidates, observed nested level entries use Research keys `level/cost/duration` and Workshop keys `level/value/cash/coins`; level-array lengths also differ by record.
- The text candidate `Defense %` does not equal `Defense Percent`; no spelling or label normalization was attempted.

No explicit cross-catalog reference field was established from the selected field mappings. This does not prove that relationships are absent elsewhere in the SDK. No values, units, costs, progression, formulas, or gameplay mechanics were reconciled. All SDK data remains `EXTERNAL-UNVERIFIED`.

Safety: source records are not changed, merged, deduplicated, or promoted. No Samantha canonical IDs, mappings, claims, or relationships are created.


## Research–Cards and Masteries SDK catalog comparison audit

Added a read-only comparison report for staged Research and Cards/Masteries exports:
- `GKB/adapter/sdk-research-cards-masteries-comparison.mjs`
- `GKB/tests/sdk-research-cards-masteries-comparison.test.mjs`
- `GKB/schema/sdk-research-cards-masteries-comparison.schema.json`
- Runtime commands: `test:sdk-research-cards-masteries-comparison` and `report:sdk-research-cards-masteries-comparison`
- CI artifact: `GKB/reports/sdk-research-cards-masteries-comparison.json`

Comparison rules:
- Research identifier/label: `slug` / `name`.
- Cards/Masteries identifier/label: `id` / `name`; mastery label: `masteryName`.
- Only exact string equality is used for Research.slug ↔ Cards.id, Research.name ↔ Cards.name, and Research.name ↔ Cards.masteryName.
- Shared top-level fields and separate nested array profiles are reported.
- Candidate matches are observations only; no entity identity, card/mastery mechanic relationship, or canonical mapping is inferred.

Initial observation from staged SDK 0.14.1 data:
- Research: 234 records; Cards/Masteries: 32 records.
- Shared top-level fields: `description` and `name`.
- Exact Research.slug ↔ Cards.id matches: 1 (`range`).
- Exact Research.name ↔ Cards.name candidates: 6.
- Exact Research.name ↔ Cards.masteryName candidates: 1.
- Research `levels` contains structured objects with `level/cost/duration` fields in the sampled catalog; Cards `levelValues` and `masteryValues` are separate scalar-number arrays. In this SDK snapshot, all 32 card records have 7 `levelValues` entries and 10 `masteryValues` entries.
- These are source-structure observations only. No values, units, progression, formulas, or gameplay equivalence are validated.

No dedicated cross-catalog reference field was established from these selected fields. The exact match `Research.name = Damage / Meter` and a card's `masteryName = Damage / Meter` is retained as an exact mastery-name candidate only; it is not promoted to a relationship. All SDK records remain `EXTERNAL-UNVERIFIED`.

Safety: no source record is modified, merged, deduplicated, or promoted. No Samantha canonical IDs, mappings, claims, or relationships are created.

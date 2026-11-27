# Phase 1 — Foundation Audit

Date: 2026-11-27
Branch: `GKB`
Status: FOUNDATION COMPLETE — legacy prose remains explicitly non-canonical

## Objective

Complete the GKB foundation before expanding universal game knowledge: claim taxonomy, canonical claim schema, provenance, version separation, conflict representation, dedicated schemas for other structured record types, and CI validation.

## Inspection

Inspected the GKB repository tree and the following components:
- Enemy Mechanics and Ultimate Weapons Mechanics prose documents.
- README and evidence/conflict governance.
- Unique module catalog.
- Canonical claim, SDK staging, origin registry, source-origin, and unique-module schemas.
- Origin registry data, SDK staging adapter, origin mapping adapter, origin validators, and CI workflow.

## Findings and decisions

### 1. Legacy evidence labels

The two mechanics documents retain historical labels:
- `Reported`
- `Supported`
- `Verified`
- `Unverified`

These are explicitly documented as legacy/unmapped labels. They are not canonical Verification Status values and were not automatically translated. The original mechanics prose and labels were preserved.

The mechanics documents are prose reference drafts, not canonical machine-readable claim records. README now defines this boundary. A prose claim may only be migrated to a canonical claim record when its own source and version context can be retained; missing provenance must not be fabricated.

### 2. Provenance and version separation

The canonical claim schema distinguishes:
- `applicableGameVersion`: game version to which a claim applies.
- `provenance[].sdkPackage` and `provenance[].sdkVersion`: SDK identity and version.
- `provenance[].sourceVersion`: source/document version, when available.
- `provenance[].publicationDate`: source publication date.
- `provenance[].retrievedAt`: retrieval date.
- `lastReviewedAt`: Samantha's review date.

The SDK staging envelope separately records SDK package/version, registry version, and game version. The origin registry separates `gameVersion`, SDK package/version, `recordedAt`, and SDK graph `generatedFor`.

The unique-module catalog source metadata was corrected:
- `sdkPackage` and `sdkVersion` identify the pinned package target.
- `sourceVersion` is null because no immutable source version was captured.
- `sourceRevision` records the inspected mutable branch reference `main`.
- `retrievedAt` is null because the original retrieval date was not captured.
- The caveat states that source-branch equivalence to the pinned npm package was not independently established.

No game version, SDK version, source version, or source date was inferred to fill a missing field.

### 3. Source attribution gaps in prose documents

Enemy Mechanics references official v28.3 patch notes and community reports, but does not consistently provide a direct source reference for each individual claim.

Ultimate Weapons Mechanics identifies Tower Hub as a main community source, but does not attach a per-claim source reference, publication date, or applicable game version throughout the document.

These documents remain non-canonical reference drafts. Their legacy labels do not promote the statements to VERIFIED canonical claims.

### 4. Conflict handling

The canonical claim schema supports optional conflict grouping:
- Conflict ID.
- Related claim IDs.
- Status: `OPEN`, `UNDER_REVIEW`, `RESOLVED`, or `NOT_COMPARABLE`.
- Optional note.

Tests cover two contradictory source-specific claims with separate IDs and provenance, both retained as `CONFLICTING`. The schema does not select a winning source. This matches the project policy for fanmade/community information.

### 5. Schema and CI coverage

Each structured record type has a dedicated schema and validation path:
- Canonical claim: `claim.schema.json`, claim/conflict tests.
- SDK staging envelope: `sdk-claim-staging.schema.json`, adapter schema validation and staging tests.
- Origin registry: `origin-registry.schema.json`, registry validator.
- Source-origin mapping: `source-origin.schema.json`, runtime/schema integration tests.
- Unique module catalog: `unique-modules.schema.json`, Ajv catalog test.

These structures are not forced into one schema because they represent different record types. README states that canonical claim records use the canonical claim schema, while prose reference drafts are not canonical claim records.

## Implementation completed

- Added canonical claim classification and verification-status enums.
- Kept game version, SDK identity/version, source version, publication date, retrieval date, and review date distinct.
- Preserved unknown fields in canonical claim/provenance records.
- Added optional conflict grouping without automatic source ranking.
- Added `legacyEvidenceStatus` to preserve an old label verbatim during a later claim migration without mapping it.
- Annotated legacy labels in Enemy Mechanics and Ultimate Weapons Mechanics as unmapped.
- Clarified in README that prose drafts are non-canonical until source-specific migration is possible.
- Corrected unique-module source provenance field names and explicitly retained unknown source revision/retrieval date as unknown.
- Added Ajv schema validation for the unique-module catalog and stronger date validation.
- Expanded canonical claim tests for all six statuses, invalid legacy status, date validity, version separation, unknown-field retention, and conflicting claims.

## Testing

Latest GitHub Actions run for the current audited branch:
- Run: [45936308924](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45936308924)
- Result: SUCCESS.
- Canonical claim schema/conflict test: PASSED, 27 cases.
- Unique module catalog schema test: PASSED, 28 modules.
- Origin registry validation: PASSED.
- SDK staging adapter test: PASSED, 15 cases.
- Source-origin mapping/schema integration: PASSED.
- TypeScript origin parser, SDK JSON export smoke test, and SDK graph compatibility checks executed.

Important separate SDK finding: the pinned `thetowersdk@0.14.1` knowledge graph contains 70 occurrences of origin `game` that are rejected by the SDK's own exported JSON Schema enum. The workflow records this as an unresolved `ORIGIN_GRAPH_SCHEMA_MISMATCH`; the run completes with an explicit conflict report. This is not silently repaired and belongs to Phase 2 SDK compatibility work.

## Phase 1 conclusion

The GKB foundation is in place and CI-validated. Structured records have dedicated schemas and validation paths; legacy prose is explicitly identified as non-canonical and is not misrepresented as schema-validated claims.

The remaining prose-to-claim migration is intentionally deferred until claim-level source/version provenance can be retained without fabrication. No bulk migration or knowledge expansion was performed.

## Safety and branch state

All changes in this phase target branch `GKB` only. No modifications or merges were made to `main` or `TestAccount`. Branch divergence remains unresolved and must be assessed separately before any merge.

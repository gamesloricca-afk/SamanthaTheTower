# Phase 1 — Foundation Audit

Date: 2026-11-27
Branch: `GKB`
Status: IN PROGRESS — not a Phase 1 completion declaration

## Scope inspected

The current GKB tree was inspected at commit `92cae6c3d58d1220f8d893715c0ef7eff8b821c8`, including:
- Core mechanics documents: Enemy Mechanics and Ultimate Weapons Mechanics.
- README and evidence/conflict governance.
- Unique module catalog.
- Canonical claim, SDK staging, origin, source-origin, and unique-module schemas.
- Origin registry, staging adapter, origin validators, and existing tests/workflow.

## Findings

### 1. Legacy evidence labels

The two mechanics documents still use the historical labels:
- `Reported`
- `Supported`
- `Verified`
- `Unverified`

These are document-level legacy labels, not canonical claim statuses. They must not be mechanically translated into canonical statuses. Preserve the wording until individual claims can be separated and their source context assessed. When migrated, the original label can be retained in `legacyEvidenceStatus`.

The README and evidence policy already explain that the older labels are non-canonical.

### 2. Provenance and version separation

The canonical claim model now distinguishes:
- `applicableGameVersion`: game version to which the claim applies.
- `provenance[].sdkPackage` and `provenance[].sdkVersion`: SDK identity and version.
- `provenance[].sourceVersion`: source/document version, when available.
- `provenance[].publicationDate`: source publication date.
- `provenance[].retrievedAt`: retrieval date.
- `lastReviewedAt`: Samantha's review date.

The unique-module catalog records the SDK target version as `0.14.1`, but its inspected source reference points to repository `main`. Its existing caveat correctly says equivalence to the pinned npm package was not independently established. Do not treat the SDK target version as the game version.

The origin registry records `gameVersion: null`, SDK `0.14.1`, and a separate SDK graph `generatedFor` date. The latter is not a game version.

### 3. Source attribution gaps in prose documents

The Enemy Mechanics document references official v28.3 patch notes and community reports, but the inspected document does not consistently provide a direct source reference for each individual claim.

The Ultimate Weapons document names Tower Hub as a main community source, but does not attach a per-claim source reference, publication date, or applicable game version throughout the document.

These documents remain useful reference drafts, but they are not yet normalized canonical claim records. Do not promote their prose into VERIFIED claims solely because a paragraph carries a legacy `Supported` or `Verified` label.

### 4. Conflict handling

The current policy already says to preserve competing reports and not select a winning community source. The canonical claim schema now has optional conflict metadata so related source-specific claims can be grouped without merging their propositions.

Conflict status values are limited to `OPEN`, `UNDER_REVIEW`, `RESOLVED`, and `NOT_COMPARABLE`. This tracking field does not itself decide which source is correct.

### 5. Schema coverage

Structured GKB records currently have separate schemas:
- Canonical claims.
- SDK staging envelopes.
- Origin registry.
- Source-origin mapping.
- Unique module catalog.

These structures serve different purposes and should not be forced into one schema. Canonical claim conformance applies to claim records; catalog and staging records retain their dedicated schemas.

## Changes made in this audit pass

- Marked the legacy status annotations in Enemy Mechanics and Ultimate Weapons Mechanics explicitly as unmapped legacy labels. Their original values and mechanics prose were retained; no claim was promoted or reclassified.
- Strengthened the unique-module catalog test so it actually compiles and applies its JSON Schema with Ajv, rather than checking only catalog counts and schema constants.

- Extended canonical claim provenance with distinct SDK package/version fields.
- Removed the duplicate top-level source publication date; publication date remains attached to each provenance source.
- Added date-shape constraints for publication, retrieval, and review dates.
- Added optional conflict grouping metadata.
- Added `legacyEvidenceStatus` for verbatim preservation during migration; it does not map to canonical status.
- Expanded canonical claim tests for status validation, dates, version separation, unknown-field preservation, and two conflicting source-specific claims.
- Added unique-module catalog validation to the GKB GitHub Actions workflow.

## Remaining work before Phase 1 can be completed

1. Confirm the latest GitHub Actions run after the documentation commits completes successfully.
2. Add/confirm dedicated tests for every structured schema, including source-origin schema coverage.
3. Audit remaining adapters and reports for accidental mixing of game version, SDK version, source version, and dates.
4. Decide a minimal claim-record migration format for the two mechanics documents, preserving source attribution and legacy labels. Do not bulk-convert prose without source-level records.
5. Confirm every JSON catalog and registry is validated by CI.
6. Re-run the complete GKB validation suite and review any remaining gaps.

## Safety

This audit and its code changes target branch `GKB` only. No changes or merge operations were made to `main` or `TestAccount`. The branch divergence remains unresolved and is not part of this phase.

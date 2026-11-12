# TheTowerSDK Origin Compatibility Record

**Document Version:** 1.0.0  
**Status:** CONFLICTING  
**Classification:** OBJECTIVE  
**Verification:** VERIFIED — Structural Compatibility Finding  
**SDK Package:** `thetowersdk`  
**SDK Version:** `0.14.1`  
**Validator:** Samantha GKB SDK Schema Inspector  
**Validator Version:** `2.2.0`  
**Recorded Date:** 2026-11-12

---

## 1. Purpose

This document records an origin compatibility conflict discovered during Samantha GKB validation of TheTowerSDK 0.14.1.

The purpose is to preserve the original SDK evidence, document the incompatibility, prevent unsupported normalization, and provide a traceable reference for future adapter development.

This record does not resolve or modify the upstream SDK conflict.

## 2. Finding

**Conflict ID:** `ORIGIN_GRAPH_SCHEMA_MISMATCH`

**Claim Type:** OBJECTIVE

**Verification Status:** CONFLICTING

The SDK Knowledge Graph contains the origin value:

`game`

The SDK JSON Schema does not include `game` in its allowed origin enum.

### Graph-observed origins

- `code`
- `game`
- `save`
- `sheet`
- `user`
- `wiki`

### Schema-allowed origins

- `in-game`
- `game-files`
- `code`
- `wiki`
- `user`
- `save`
- `external-repo`
- `sheet`

### Incompatibility

The graph uses `game`, while the JSON Schema rejects that value.

No evidence currently establishes that `game` is semantically equivalent to either `in-game` or `game-files`.

Therefore, automatic conversion is prohibited.

## 3. Validation Evidence

**Source:** Samantha GKB SDK Schema Inspector report

**SDK Version:** `0.14.1`

**Graph Version:** `3`

**Schema Version:** `1`

**Graph generatedFor:** `2026-10-15`

**Validator Version:** `2.2.0`

Observed validation results:

| Field | Result |
|---|---|
| Compatibility status | `CONFLICTING` |
| Conflict code | `ORIGIN_GRAPH_SCHEMA_MISMATCH` |
| Graph origin | `game` |
| Schema allows origin | `false` |
| Conflict occurrence count | `70` |
| Resolution | `UNRESOLVED` |
| Graph validation | `FAILED` |

The validator identified 70 origin enum validation errors associated with the `game` value.

These occurrences are not necessarily 70 independent root causes. They are recorded as 70 affected locations under one compatibility conflict.

## 4. Representative Evidence

Example validation location:

`/edges/386/sources/0/origin`

Schema path:

`#/properties/edges/items/properties/sources/items/properties/origin/enum`

Rejected value:

`game`

The complete validation report must remain available as the detailed evidence record:

`GKB/reports/sdk-knowledge-graph-validation-report.json`

## 5. Preservation Policy

Samantha GKB must:

1. Preserve the original origin value `game`.
2. Preserve the original SDK graph and schema.
3. Retain all 70 validation error locations.
4. Record the conflict without silently resolving it.
5. Keep SDK version and game version information separate.
6. Re-evaluate the conflict when a new SDK version becomes available.

The following transformations are prohibited without supporting evidence:

- `game` → `in-game`
- `game` → `game-files`
- Removing `game` from imported provenance.
- Rewriting the upstream SDK schema.
- Treating the conflict as resolved merely because validation is bypassed.

## 6. GKB Adapter Requirements

Before importing affected SDK claims, the Samantha adapter must:

- Preserve the raw origin value.
- Record the original SDK package and version.
- Retain the source record and its provenance.
- Mark affected records as requiring compatibility review.
- Preserve unknown fields.
- Report unsupported origin values.
- Avoid automatic origin normalization.

The adapter must distinguish schema compatibility from factual verification.

A schema-compatible record is not automatically a factually verified game mechanic.

## 7. Resolution Status

**Current Status:** `UNRESOLVED`

**Resolution Authority:** Pending upstream SDK evidence or independently verified compatibility documentation.

**Automatic Resolution:** Prohibited.

**Import Policy:** Affected provenance must not be silently normalized. Any future ingestion must preserve the conflict and its evidence.

## 8. Reassessment Conditions

Reassess this record when:

1. The SDK publishes a corrected JSON Schema.
2. The SDK changes its TypeScript origin definitions.
3. The SDK graph changes its origin representation.
4. Upstream documentation explicitly defines the semantics of `game`.
5. Independent evidence establishes an unambiguous mapping.

Any resolution must include evidence, SDK version, assessment date, and a documented change history.

## 9. Limitations

This finding establishes a structural incompatibility between the observed graph and schema.

It does not establish:

- That the underlying game mechanics are incorrect.
- That the graph's `game` provenance is invalid.
- That `in-game` or `game-files` is the correct replacement.
- That all SDK knowledge claims are factually verified.
- That SDK redistribution rights have been assessed.

---

## 10. Change History

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-11-12 | Initial record of the 70-occurrence origin compatibility conflict |

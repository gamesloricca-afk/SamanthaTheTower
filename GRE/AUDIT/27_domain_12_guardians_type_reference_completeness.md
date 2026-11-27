# GRE Audit 27 — Domain 12: Guardians (type-reference completeness and evidence limits)

- Audit ID: `GRE-AUDIT-027`
- Inspection date: 2026-11-27
- Repository: `gamesloricca-afk/SamanthaTheTower`
- Branch: `TestAccount`
- Source JSON: `GRE/2/12_guardians.json`
- Source JSON blob SHA: `b90726fbdc2425c0aed6b7a7830b1d73ae3eb05c`
- Scope: programmatic count of type-reference completeness across all 65 type records. Counts are based on the JSON structure, not on runtime inspection.

## 1. Completeness counts

The source contains 65 type records and the following aggregate declaration counts:

| Metadata item | Total |
|---|---:|
| Fields | 1,274 |
| Methods | 858 |
| Properties | 134 |
| Field type references | 1,274 |
| Method return type references | 858 |
| Method parameter type references | 404 |
| Property type references | 0 |

Resolved-reference coverage in the JSON:

| Reference category | Resolved | Unresolved / not represented |
|---|---:|---:|
| Field types | 0 / 1,274 | 1,274 unresolved |
| Method return types | 847 / 858 | 11 unresolved |
| Method parameter types | 324 / 404 | 80 unresolved |
| Property types | 0 / 0 | Not represented in the source structure |

For fields, every field has a `type_ref` object, but none has a populated `resolved_type` value. This means the field names are available while their field data types are not resolved in this JSON export. The property records likewise do not carry `type_ref` entries in this package.

## 2. Consequences for Guardian interpretation

This is a material limitation for interpreting the domain:
- `GuardianPresetData` field names such as `chipSlot` and `chipLevel` cannot be assigned a concrete type from this export, even though getter/setter names exist.
- `GuardianChips` fields such as `chipBenefits`, `chipBenefitCosts`, and `chipLevelsMax` cannot be identified as arrays, lists, dictionaries, or another structure from this export alone.
- `TowerBuddy` ability references and reward-history fields cannot be assigned concrete field types from this export.
- The 80 unresolved method parameter references and 11 unresolved return references should remain unresolved. Do not infer types from names or from adjacent methods.
- Property names and accessor method signatures can sometimes be cross-referenced, but a missing property type reference must not be silently filled from a getter name unless the relationship is explicitly represented and checked.

## 3. Evidence that remains usable

The following remain directly observable:
- Type names, indices, namespaces, tokens, offsets, and parent/declaring-type references as represented.
- Field names and their metadata positions.
- Method names, method tokens/offsets, and the subset of return/parameter types that are explicitly resolved.
- Property names and getter/setter method indices.
- Raw field default bytes and decoded candidates where present.

A resolved method signature is evidence of a declaration in this metadata export, not proof that the method executes in a particular way. The JSON contains no method bodies/IL in the inspected structures.

## 4. Validation notes

- Source package label `Assembly-CSharp.dll metadata v39` is a metadata-format/source label, not a verified game release version.
- No runtime execution or IL/body analysis was performed in this pass.
- No external fanmade corroboration was used to fill missing references.
- No numeric candidate values were upgraded.
- No conflicts were adjudicated.

## 5. Audit status

**Result:** type-reference completeness has been measured across the complete Domain 12 JSON. The export is strong for declaration names and selected method signatures, but incomplete for field typing and some method signatures.

**Recommended next evidence:** obtain a compatible metadata dump that resolves field/property types and includes method bodies or IL, or compare another independently sourced fanmade metadata export with known binary/game-version identity. If such evidence is unavailable, retain the unresolved references as explicit gaps.

No original GRE files were changed. No claims were promoted to GKB.

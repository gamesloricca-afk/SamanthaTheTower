# GRE Audit 00 — Repository, source identity, and safety

- Audit ID: `GRE-AUDIT-001`
- Inspection date: 2026-11-27
- Repository: `gamesloricca-afk/SamanthaTheTower`
- Audited branch: `TestAccount`
- Branch head at inspection: `f7ed7b86ce1ce35000cba6f323eae78b25873d19`
- Scope: existing `GRE/` package and its extraction metadata
- Changes in this phase: audit documentation only; no original GRE data changed

## 1. Branch safety

Observed refs at inspection:

| Branch | Head |
|---|---|
| TestAccount | `f7ed7b86ce1ce35000cba6f323eae78b25873d19` |
| GKB | `f34f5ce93c6396126ab3e9d40045415ebc03b2de` |
| main | `a0a92971e846a219d2b514d0c52411c205718269` |

GitHub compare results:

| Comparison | Status | Ahead | Behind |
|---|---:|---:|---:|
| TestAccount vs main | diverged | 92 | 49 |
| TestAccount vs GKB | diverged | 93 | 339 |

The branches have substantial independent history. No merge, rebase, cherry-pick, or branch reset is authorized or performed by this audit. Audit notes are added to TestAccount only. GKB promotion must be a separate reviewed operation after the audit, with its own divergence and conflict inspection. `main` is not a target.

## 2. Source binary identity

The GRE manifest identifies the input as:

- File: `DOC-20261127-WA0002.bin`
- Size: `11,069,036` bytes
- SHA-256: `8266355fab717d91b51482122b66551afc62502b0f62fd8527930962cbefe81c`
- Metadata format version: `39`

**Important distinction:** metadata format version 39 is not evidence of game release version 39, nor does the manifest establish the exact public game build corresponding to this binary. The binary itself is not present in the GRE directory tree inspected here, so this audit verifies the checked-in extraction outputs and their recorded identity; it does not independently re-hash the original binary.

## 3. Manifest inventory

The checked-in manifest records:

| Measure | Manifest value |
|---|---:|
| Assemblies | 125 |
| Type definitions across all assemblies | 14,153 |
| Types in Assembly-CSharp.dll | 1,617 |
| Game methods | 14,641 |
| Game fields | 15,513 |
| Game properties | 2,678 |
| Game parameters | 8,374 |
| Game field-default records | 2,682 |
| Candidate decoded numeric defaults | 2,238 |
| Filtered gameplay string-literal matches | 222 |
| Distinct types assigned to domains | 475 |

These are extraction inventory counts, not counts of verified mechanics or player-facing features.

## 4. Domain inventory and overlap

There are 20 domain JSON files. Their type-record counts sum to 1,059, while the manifest reports 475 distinct type indices assigned across domains. Therefore, domain membership is intentionally overlapping: the same type can be included in multiple topical views. The 1,059 records must not be interpreted as 1,059 unique game types, and overlapping appearances are not independent evidence.

All 20 domain JSON files were fetched and parsed as JSON in the structural pass. They share the top-level keys `domain`, `evidence_status`, `type_indices`, and `types`. For each file, the observed `type_indices` and `types` array lengths match. The declared evidence status is direct metadata declarations with behavioral meaning unverified.

## 5. Extraction method review

The checked-in `GRE/3/extract_metadata.py` shows that the package is produced by parsing metadata tables from a binary file. It:

- checks section bounds and table record layouts;
- resolves type-name references where a direct type definition is available;
- extracts fields, methods, parameters, properties, tokens, offsets, and raw type records;
- retains raw default bytes and attempts numeric decoding only for selected inferred primitive encodings;
- groups types into domains using regular-expression name patterns, then includes nested types based on declaring-type references;
- filters string literals using a keyword expression;
- builds a symbol-evidence map for selected mechanisms.

The script's own comments explicitly describe domain grouping as symbol-name based and allow overlap. It also explicitly states that the experimental category contains in-client feature markers only, not community evidence.

## 6. Structural audit findings

### VERIFIED — what the package contains

- A broad declaration-level map of the game assembly.
- Domain-specific JSON records with type, field, method, parameter, and property metadata.
- Raw type-record hex, metadata offsets, and tokens for traceability.
- Field-default records with raw bytes and candidate decoded values.
- A keyword-filtered string-literal inventory.
- A selected mechanism-symbol index and a manifest of extraction checks and limitations.

### LIMITATION — what it does not establish

The manifest explicitly says the source package does not provide native executable method bodies, runtime type registration, serialized asset tables, or remote configuration. It also says no call graph or formula reconstruction is available from names alone.

Consequently, this package alone cannot establish:
- the body or execution order of a method;
- the exact conditions under which a method runs;
- formula arithmetic, stacking order, caps, or timing;
- whether a declared field is currently used at runtime;
- live remote-configured values;
- asset-backed player-facing content not represented in these outputs;
- a definitive game release/build mapping.

### INFERRED — classification and presentation risks

- The domain files are useful navigation/indexing layers, not independent datasets.
- Compiler-generated names such as `<>c` and `<...>d__...` appear in domain records; they are implementation artifacts and should not be promoted as game concepts.
- A domain's title may overstate what its records contain. In particular, `19_version_history` is built around migration, PlayerData, ModuleManager, SaveLoad, and version-lock symbols; it is not a complete patch history.
- `20_experimental_community` includes Dissonance and Beta Module declarations, but the extraction script says this is an in-client marker category, not evidence of community-sourced claims.
- Keyword-filtered strings are drawn across assemblies and the manifest says their owning assembly is not established. A matching string should not automatically be assigned to a particular game system.

## 7. Issues to track during deeper audit

| ID | Finding | Status | Required treatment |
|---|---|---|---|
| GRE-A01 | Game release version is not established by metadata v39 | OPEN | Keep game version unknown until independently sourced |
| GRE-A02 | Domain classification is heuristic and overlapping | OPEN | Preserve source type index and all domain memberships |
| GRE-A03 | Numeric default decoding uses inferred primitive encodings | OPEN | Keep as candidate; verify type, unit, and use site |
| GRE-A04 | String-literal ownership is not established | OPEN | Do not assign strings to systems without corroboration |
| GRE-A05 | Method bodies/call graph are absent | OPEN | Treat method names as declaration evidence only |
| GRE-A06 | Version-history domain is not a full changelog | OPEN | Rename/qualify in future audit summaries, without altering source |
| GRE-A07 | Experimental/community label does not establish community provenance | OPEN | Record actual evidence origin separately |
| GRE-A08 | TestAccount and GKB are heavily diverged | OPEN | Keep work on TestAccount; inspect merge base and conflicts before promotion |

## 8. Corrected completion status

The later domain reports 22, 24, 29–46 and cross-domain reports 47–48 supersede the original sequencing plan above. All 20 numbered domains now have complete structural inventory reports.

- **Phase 0 — repository and branch safety: COMPLETE.**
- **Phase 1 — package and manifest structural inventory: COMPLETE WITH SOURCE LIMITATIONS.**
- **Phase 2 — Domain 01–20 structural inventories: COMPLETE.**
- **Phase 3 — cross-domain declaration consistency and selected relationship map: COMPLETE FOR THE CHECKED COMPARISONS.**
- **Runtime/mechanic verification: INCOMPLETE / SOURCE-LIMITED.** Native method bodies, call graph, serialized assets, and remote configuration are absent.
- **External fanmade-source comparison: NOT PERFORMED.**
- **GKB promotion: NOT PERFORMED.**

See [51_gre_package_structural_audit_closure.md](51_gre_package_structural_audit_closure.md) for the consolidated domain matrix, corrected status, and residual gaps.

## 9. Final disposition

The GRE structural audit is closed for the checked-in package: all 20 domain exports and their structural inventories are accounted for, and the cross-domain declaration checks are documented. This does **not** mean all game mechanics have been reverse-engineered or verified.

The original binary is not present for independent re-hashing; metadata version 39 is not a game release version; decoded values remain candidates until their types, units, and use sites are established; and method names do not prove runtime behavior.

Original GRE files remain unchanged. No claims or relationships were promoted to GKB. The `GKB` and `main` branches were not modified by this closure update.

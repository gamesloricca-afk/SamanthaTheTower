# Post-Audit GKB Re-check — GRE Domains 01–20

## Objective

Re-check the current `GKB` branch after completing structural inventories and declaration-level cross-domain review of GRE Domains 01–20. This is a read-only audit of GKB state against the completed GRE findings. No GKB, `main`, or canonical claim files are modified.

## Branch and source boundary

- Repository: `gamesloricca-afk/SamanthaTheTower`
- GKB branch inspected: `GKB`
- Development/audit branch: `TestAccount`
- Branch comparison at review time: `TestAccount` ahead 180, behind 339 relative to `GKB`; branches are diverged.
- All GRE audit work remains on `TestAccount`.
- GKB and `main` were not modified.

## GKB governance and schema findings

### Canonical claim schema

`GKB/schema/claim.schema.json` defines:
- Required: claimId, domain, subject, claim, classification, verificationStatus, provenance.
- Classification: `OBJECTIVE` or `SENTIMENT`.
- Verification status: `VERIFIED`, `USER-PROVIDED`, `EXTERNAL-UNVERIFIED`, `HYPOTHESIS`, `CONFLICTING`, `SUPERSEDED`.
- Provenance is a non-empty array; each source requires sourceType and sourceName, with optional source reference/version, SDK package/version, publication/retrieval date, evidence, and limitations.
- Relationships use the eight project-approved types: GATES, SCALES, CAPS, INDEPENDENT_OF, SEPARATE_PURCHASE_FROM, DERIVED_FROM, MEMBER_OF, APPLIED_BEFORE.

The schema can represent reverse-engineering sources using the available source-type vocabulary (for example OTHER or UNKNOWN) without claiming developer-official status. A claim can record a null applicable game version when the game release is unknown. Direct metadata observations and decoded constants should remain separate claim subjects/evidence descriptions.

### Domain registry

`GKB/domains/canonical-domain-registry.json` contains 20 Samantha-owned domain IDs corresponding to the 20 GRE topic domains. The strategy, version-history, and experimental/community labels are Samantha-owned canonical names; they need not duplicate the GRE file names exactly.

### Owner approval

The GKB README remains `Draft – Pending Owner Approval`. The two prose mechanics documents are also marked Draft/Pending Owner Approval. The governance workflow requires explicit Project Owner approval before promotion into universal GKB claims.

## Current canonical and staging state

### Canonical domain files

The inspected `GKB/domains` directory contains:
- `canonical-domain-registry.json`
- `modules-unique.json`

No canonical claim-record collection was present in that directory. The Enemy and Ultimate Weapons mechanics documents are prose reference drafts, not schema-validated canonical claim records.

### SDK staging snapshot

Latest pointer: run `45966274655`, retrieved 2026-11-27, pinned SDK `thetowersdk@0.14.1`. The manifest records all six staged payloads as `UNCHANGED` from the previous snapshot.

| Staged artifact | Records / size | Status |
|---|---:|---|
| Node claim envelopes | 320 records | PASSED staging; pending review |
| Assertion envelopes | 1,618 records | PASSED staging; pending review |
| Edge envelopes | 396 records | PASSED staging; pending review |
| Contradiction envelopes | 3 records | PASSED staging; pending review |
| Selected data catalogs | 4 catalogs: 234 Research, 47 Workshop, 32 Cards/Masteries, 34 Perks | EXTERNAL-UNVERIFIED |
| Review queue | 1,618 records | All PENDING |

The assertion staging report records:
- 1,602 OBJECTIVE and 16 SENTIMENT classification candidates.
- SDK source verification: 554 `verified_here`, 266 `unverified`, 1 `contradicted`, and 797 assertions with no assertion-level verification field.
- 50 assertion provenance occurrences with raw origin `game` remain unresolved.
- No Samantha canonical claims, verification mapping, origin mapping, or promotion were performed.

Do not inherit a node's verification label into its assertions. Do not translate SDK `verified_here` into Samantha `VERIFIED` automatically.

The staged catalog package-level game marker is `v28.3.0`; SDK package version is `0.14.1`. The catalog staging note explicitly says not to infer per-record game-version compatibility from the package-level marker.

## Existing validation issue

The latest machine-readable SDK graph validation report records:
- Overall: `COMPLETED_WITH_CONFLICTS`.
- Workflow execution: `PASSED`.
- SDK JSON Schema validation: `FAILED`.
- 70 schema errors.
- Origin evidence integrity: `PASSED`.

The known mismatch is the raw SDK graph origin `game`: it occurs in the graph and is allowed by the inspected TypeScript `ClaimOrigin` declaration, but it is rejected by the SDK's own exported JSON Schema enum. The existing compatibility review attributes all 70 validation errors to this mismatch.

**Handling:** retain the raw `game` origin, keep it unresolved, and do not rewrite it to `in-game`, `game-files`, or another source label. This is a source/schema compatibility conflict, not a reason to discard the underlying claims.

## Existing SDK contradictions — preserve both reports

The staged SDK contradiction set contains three source disagreements. No winner has been selected:

| Subject / predicate | SDK code report | SDK wiki report |
|---|---|---|
| `module.subEffect.slot8.opensAtLevel` | 241 | 242 |
| `perk.perkWaveRequirement.appliedAs` | `multiply` | `add` |
| `thorns.protectorPenaltyPercent` | 30 | 60 |

The code-side references are marked as SDK reference-model sources with independent validation not recorded. The wiki-side references identify community pages and dates. Preserve the two reports separately with their source metadata. Do not use SDK `likelyValue` or `authorityRank` as Samantha's winner-selection mechanism.

## Existing prose mechanics documents

### Enemy Mechanics

- Draft / Pending Owner Approval.
- Contains both official developer references and fan/community references.
- Explicitly records disagreement about whether Fleet main enemies count toward the Normal population cap.
- Uses legacy labels such as Reported, Supported, Verified, and Unverified; its own notice says they are unmapped and not canonical statuses.
- The GRE Enemy/Combat/Formula domains provide declaration-level evidence for Enemy types, damage sources, and named interfaces. They do not by themselves prove all population limits, immunity rules, Heat-Up values, Coin Decay, Mass Growth, or spawn formulas in the prose draft.

### Ultimate Weapons Mechanics

- Draft / Pending Owner Approval.
- Contains official patch-note and community references.
- Uses legacy `Supported` and `Verified` labels that are explicitly unmapped.
- GRE UW/Formula/Strategy declarations confirm the presence of UW identifiers, stat getter interfaces, controllers, and related methods, but do not establish every prose mechanic, formula, or value.

These documents should remain useful reference drafts. They should not be silently converted into canonical claims by copying their legacy status labels.

### Unique Module catalog

`GKB/domains/modules-unique.json` contains 28 module entries and is marked `EXTERNAL-UNVERIFIED`. It references the SDK repository's `main` branch, but its source revision and retrieval date are null; the document itself says equivalence to the pinned npm package 0.14.1 has not been independently established. Keep this catalog unverified until its source revision and game-version scope are reviewed. The GRE Module domain provides module data structures and effect interfaces, but its metadata export does not by itself verify all module effect text or rarity values in this catalog.

## Re-check conclusions

1. **VERIFIED:** GKB has a canonical claim schema and a 20-domain registry aligned with GRE's 20 topic areas.
2. **VERIFIED:** current SDK staging is separate from canonical GKB; 1,618 assertion records remain PENDING and no canonical claim promotion is recorded.
3. **VERIFIED:** the SDK graph has three source contradictions; all source-specific values are preserved in staging and none is resolved.
4. **VERIFIED:** the SDK origin/schema mismatch remains unresolved and is correctly visible as 70 schema errors; execution success does not mean schema validation passed.
5. **VERIFIED:** the Enemy and UW prose drafts retain legacy evidence labels as unmapped and remain pending owner approval.
6. **VERIFIED:** the 28-entry unique-module catalog remains EXTERNAL-UNVERIFIED and has incomplete source revision/retrieval provenance.
7. **INFERRED:** GRE reverse-engineering metadata can support new OBJECTIVE claims about directly observed declarations, enum names, method signatures, and extracted constants, provided each claim cites the exact GRE file/binary identity and preserves decoding limitations. It should not be treated as automatic verification of every runtime mechanic.
8. **NOT ESTABLISHED:** exact game release applicability of GRE metadata v39. The assembly metadata label is not a release number.
9. **NOT ESTABLISHED:** complete correctness of existing prose mechanics values from GRE declaration data alone.

## Recommended next step

Begin a controlled GKB review using the completed GRE audit as an additional source. Start with direct, mechanically observable reverse-engineering facts (declarations and independently validated decoded values), keep source/version provenance explicit, and leave runtime interpretations as HYPOTHESIS until supported. Preserve SDK/community disagreements side by side. Do not bulk-import, rewrite canonical records, or merge branches without explicit Project Owner authorization.

## Change and test status

- GKB branch: **READ ONLY**.
- `main`: **UNCHANGED**.
- `TestAccount`: audit report only.
- Canonical GKB import: **NOT PERFORMED**.
- Tests: **NOT RUN**; this report is a source/document inspection.

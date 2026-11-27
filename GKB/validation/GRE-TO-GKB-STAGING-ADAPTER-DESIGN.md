# GRE-to-GKB Staging Adapter — Design

- Prepared: 2026-11-27
- Working branch: `gre-gkb-integration-design`
- Base: GKB
- Status: DESIGN — implementation and runtime tests not yet performed

## 1. Goal

Connect GRE's source-linked evidence workspace to the existing Samantha GKB review pipeline with the smallest possible new component.

The adapter is a one-way, read-only ingestion boundary:

`Pinned GRE snapshot -> GRE parser/validator -> GRE staging envelopes -> existing GKB review queue -> existing controlled import preview`

It must not write directly to canonical domain files, auto-approve claims, or select a winning source.

## 2. Reuse existing GKB infrastructure

Reuse:

- `GKB/schema/claim.schema.json` as the canonical claim contract.
- `GKB/schema/canonical-domain-registry.schema.json` and `GKB/domains/canonical-domain-registry.json` for Samantha-owned domain mapping.
- Existing review decision schema and review queue.
- Existing controlled importer and reviewed assertion normalizer where their input contracts genuinely fit.
- Existing persistent staging/content-addressed snapshot infrastructure after the GRE envelope shape is stable.

Do not create a second canonical claim schema, a second reviewer workflow, or a separate conflict-resolution policy.

The current GKB review queue is assertion-oriented. Therefore the adapter should create a dedicated GRE staging envelope and a small, explicit bridge into the existing review queue; it should not pretend that a GRE claim is an SDK graph assertion.

## 3. GRE input types

Initial input scope:

1. GRE claim Markdown files under `GRE/EVIDENCE/claims/`.
2. GRE source Markdown files under `GRE/EVIDENCE/sources/`.
3. GRE conflict Markdown files under `GRE/EVIDENCE/conflicts/`.
4. Optional per-domain reports and audit references for context.

The current evidence workspace reports 12 source-linked claims, source-audit review complete for those 12, and one open conflict (`CNF-D04-DR-001`). These are a small initial fixture set, not evidence that all 20 domains are ready for canonical import.

GRE Markdown remains the source of record for this adapter version. Do not parse large domain JSON exports as claims in the first implementation.

## 4. Mapping contract

| GRE field | GKB staging field | Rule |
|---|---|---|
| Claim ID | `sourceClaimId` | Preserve exact ID; never reuse as canonical claimId automatically |
| Domain label/number | `domainCandidate` | Map only through explicit registry crosswalk |
| Subject | `subject` | Copy source text; no semantic rewriting |
| Claim content | `claimText` | Copy exact claim statement |
| Claim type | `classificationCandidate` | Map only exact OBJECTIVE/SENTIMENT |
| GRE verification label | `sourceVerificationLabel` | Preserve verbatim; never promote automatically |
| Game version/build | `sourceGameVersion` | Preserve exact value or UNKNOWN |
| SDK version | `sourceSdkVersion` | Separate from game version |
| Metadata format version | `sourceMetadataVersion` | Separate from game version and SDK version |
| Source ID/reference | `sourceReferences[]` | Preserve every source independently |
| Publication/source date | `publicationDate` | Only if explicitly supplied |
| Access date | `retrievedAt` | Adapter snapshot retrieval date, not source publication |
| Evidence file/function/test | `evidence[]` | Preserve exact path and locator as supplied |
| Limitations | `limitations[]` | Preserve wording |
| Related claim IDs | `relatedSourceClaimIds[]` | Keep as GRE identifiers until reviewed |
| Conflict ID | `sourceConflictIds[]` | Preserve open conflict links |
| Full parsed/raw source | `sourceRecord` | Retain original Markdown and parsed fields |

Unknown or unrecognized fields must be preserved in `sourceRecord` and reported. The adapter must never discard them silently.

## 5. Status and classification rules

- Every generated GRE staging envelope has Samantha staging status `PENDING_REVIEW`.
- Its provisional canonical verification status is always `EXTERNAL-UNVERIFIED`.
- GRE's source verification label is copied verbatim into `sourceVerificationLabel`.
- A GRE label such as `VERIFIED` is not sufficient to assign canonical GKB `VERIFIED`.
- If GRE says a statement is verified only as an SDK implementation, preserve that scope and limitation.
- Missing classification remains null/unknown and is sent to review; do not infer it from the domain or file name.
- Missing game version remains null/UNKNOWN. Do not infer a release from GRE metadata format v39 or SDK package version.
- Source types are mapped only by an explicit mapping table. Unknown attribution remains `UNKNOWN`; never infer COMMUNITY/official from an author's name alone.

A canonical claim ID, canonical domain, canonical classification, final verification status, and relationships require explicit reviewer input.

## 6. Source multiplicity and conflicts

A single GRE claim may reference multiple source records. Preserve each source as a separate provenance entry.

A GRE conflict record must be staged as a conflict envelope that references all involved source claim IDs. Do not combine conflicting statements into one synthesized claim, average numeric values, rank the sources, or choose a winner.

For the initial `CNF-D04-DR-001` fixture, keep the four source positions represented by DR-001, DR-003, DR-004, and DR-005 separately linked. Preserve the additional note that the SDK contains different helper scopes. Conflict state remains OPEN.

If a conflict's component claims are staged separately, the conflict envelope links their staging IDs. The adapter must report unresolved links instead of inventing missing claims.

## 7. Domain crosswalk

The adapter must use Samantha's 20-domain registry, not source directory numbers alone.

Initial exact label mapping:

| GRE domain | Canonical domain ID |
|---|---|
| 01 Game Fundamentals | `game-fundamentals` |
| 02 Enemies | `enemies` |
| 03 Battle Conditions | `battle-conditions` |
| 04 Combat Mechanics | `combat-mechanics` |
| 05 Ultimate Weapons | `ultimate-weapons` |
| 06 Workshop | `workshop` |
| 07 Workshop Enhancements | `workshop-enhancements` |
| 08 Research | `research` |
| 09 Modules | `modules` |
| 10 Cards and Masteries | `cards-and-masteries` |
| 11 Bots | `bots` |
| 12 Guardians | `guardians` |
| 13 Perks | `perks` |
| 14 Relics | `relics` |
| 15 Vault | `vault` |
| 16 Economy and Progression | `economy-and-progression` |
| 17 Formulas and Calculations | `formulas-and-calculations` |
| 18 Strategy Interactions | `strategies-and-build-interactions` |
| 19 Version History | `game-version-history` |
| 20 Experimental and Community | `experimental-and-community-knowledge` |

This table maps domain labels only. It does not assert that every domain has evidence-ready claims.

## 8. Suggested staging envelope (v1)

Required fields:

- `format`: `SAMANTHA_GKB_GRE_STAGING`
- `formatVersion`: 1
- `stagingId`: deterministic ID derived from pinned source commit + relative file path + stable claim ID
- `recordKind`: `GRE_CLAIM` or `GRE_CONFLICT`
- `sourceSnapshot`: repository, branch, commit SHA, relative path, retrieval date
- `sourceClaimId` or `sourceConflictId`
- `domainCandidate`
- `subject`
- `claimText`
- `classificationCandidate`
- `sourceVerificationLabel`
- `provisionalVerificationStatus`: `EXTERNAL-UNVERIFIED`
- `reviewStatus`: `PENDING_REVIEW`
- `sourceReferences[]`
- `evidence[]`
- `relatedSourceClaimIds[]`
- `sourceConflictIds[]`
- `limitations[]`
- `sourceRecord` (raw Markdown + parsed source content)

For conflict envelopes, `claimText` may be null and the envelope must contain the original conflict record plus its claim/source references. The full schema should allow unknown source data inside `sourceRecord`.

The staging ID must be stable for the same pinned commit/path/source ID, but a changed source commit must produce a distinguishable snapshot. Do not key solely on a mutable branch name.

## 9. Validation and reporting

The adapter test suite must cover:

1. Parse all 12 current GRE claim files.
2. Parse source records and resolve every declared source ID.
3. Parse the open conflict and verify all referenced claim IDs.
4. Preserve exact raw Markdown and unknown fields.
5. Reject duplicate claim IDs and duplicate source IDs where uniqueness is required.
6. Detect missing source references and report them as unresolved.
7. Preserve UNKNOWN game version and metadata version separately.
8. Preserve source publication date, access date, and review date separately.
9. Keep GRE verification labels separate from Samantha status.
10. Keep conflict claims separate; no winner selection.
11. Map only registered domain labels.
12. Produce deterministic staging IDs and stable output for the same pinned input.
13. Ensure every output record remains PENDING and EXTERNAL-UNVERIFIED.
14. Ensure no canonical domain file is written.

Report counts: parsed, staged, invalid, unmapped-domain, missing-source, unresolved-conflict-reference, unknown-field, pending, and rejected.

## 10. Integration with existing review queue

Add an adapter function that converts each GRE staging envelope into a generic review item accepted by the existing GKB review workflow. Keep source-specific fields and raw source data attached.

Do not call the current SDK assertion normalizer with a GRE envelope. Instead, either:
- extend the review queue with an explicit record-kind-aware adapter, or
- create a thin GRE-to-review-item mapper that emits the existing queue's stable identifiers and stores the complete GRE envelope as source context.

The controlled importer should receive only reviewer-authored canonical fields after APPROVE. The existing 25-record batch limit remains in force.

## 11. Implementation boundaries

First implementation should be read-only and produce files under a dedicated GRE staging directory on the integration branch. It must not modify GRE source files or existing SDK staging payloads.

Do not add GRE as a runtime dependency of the SDK adapter. Keep the two ingestion sources independent.

No real GRE claim is approved by this design document. No canonical claim is created by the design itself.

## 12. Completion gate

Implementation is ready for review only when:

- The staging schema validates all fixtures.
- The parser is deterministic and preserves raw source.
- The 12-claim fixture set and conflict fixture pass.
- Review queue receives pending GRE entries without SDK-specific assumptions.
- Controlled import preview works with a synthetic explicitly approved fixture.
- Existing SDK/GKB tests still pass.
- A report proves zero canonical writes and zero automatic approvals.
- A draft PR targets GKB and clearly states all limitations.

**Current status: DESIGN COMPLETE; IMPLEMENTATION NOT STARTED; TESTS NOT RUN.**

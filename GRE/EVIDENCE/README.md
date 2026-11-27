# GRE Evidence Expansion & Mechanism Review

- Workspace: `GRE/EVIDENCE/`
- Repository branch: `TestAccount`
- Parent source: `GRE/`
- Purpose: expand the completed GRE structural audit into source-traceable, version-aware mechanism evidence.
- Current phase: **Evidence Expansion**
- GKB import: **DISABLED until a separate review and approval**

## Mission

The GRE structural audit describes extracted metadata declarations. This workspace investigates what can and cannot be established about game mechanics using available implementation artifacts, SDK material, community sources, spreadsheets, player tests, and other traceable evidence.

Keep source statements separate. Community/fanmade sources are not official developer releases. If two or more sources disagree, preserve each source's claim and evidence side by side. Do not automatically select a winner.

## Work plan

### Phase E0 — Workspace and evidence rules
- Maintain source, claim, conflict, domain, and report indexes.
- Keep the original GRE exports and audit reports unchanged.
- Use stable IDs for sources, claims, and conflicts.
- Preserve unknown and unsupported information.

**Status: STARTED.**

### Phase E1 — Source registry
- Register each source with title/name, author or maintainer, URL/repository path, source type, publication/update date, access date, game-version scope, SDK version (if relevant), license/attribution, and limitations.
- Separate game version, SDK package version, metadata format version, and publication date.
- Never infer a game version from GRE metadata format v39.

**Status: SCAFFOLDED.**

### Phase E2 — Domain mechanism investigations
- Begin with Domain 04 — Combat Mechanics.
- Then investigate Domain 02 — Enemies and cross-reference relevant Combat Mechanics evidence.
- Continue domain by domain only after the evidence workflow is usable.
- Investigate declarations individually; do not treat a class or method name as proof of behavior.

**Status: D04-01 GRE cross-domain metadata review and source comparison completed; D04-02 initial evidence recorded; live-game details remain partially unresolved.**

### Phase E3 — Claim extraction and evidence linking
- Create small, atomic claims.
- Classify each claim as `OBJECTIVE` or `SENTIMENT`.
- Assign a verification status: `VERIFIED`, `USER-PROVIDED`, `EXTERNAL-UNVERIFIED`, `HYPOTHESIS`, `CONFLICTING`, or `SUPERSEDED`.
- Link every claim to one or more source records and exact evidence locations.
- Preserve quotes/observations and limitations without silently rewriting the source.

**Status: D04-01 and D04-02 have twelve source-linked claims; no bulk extraction.**

### Phase E4 — Values, formulas, and relationships
- Validate numeric values, units, ranges, caps, conditions, and formula inputs.
- Keep decoded GRE defaults as candidates until type, encoding, unit, and use-site evidence are established.
- Add relationships only when supported. Uncertain links remain hypotheses.
- Keep contradictory values as separate source-specific claims.

**Status: D04-01 conflict record and D04-02 source comparison recorded; runtime validation pending.**

### Phase E5 — Conflict review and reports
- Group claims that address the same subject without merging their source statements.
- Record where sources agree, differ, or do not address the same version/context.
- Report missing, inaccessible, unsupported, and inconsistent information.
- Assess source authority separately from recency.

**Status: D04-01 and initial D04-02 reports published; further domain reports pending.**

### Phase E6 — GKB staging review
- Map reviewed claims into the Samantha GKB schema.
- Preserve provenance, game version, source version, dates, evidence, relationships, and limitations.
- Produce a validation report and unresolved-conflict list.
- Keep unreviewed information in GRE Evidence staging.
- Promote nothing to GKB automatically; promotion requires a separate review/approval.

**Status: BLOCKED until evidence review and GKB compatibility checks are complete.**

## Workspace layout

| Path | Purpose |
|---|---|
| `sources/` | Source registry and source-specific records |
| `domains/` | Per-domain investigation notes and findings |
| `claims/` | Atomic source-linked claims |
| `conflicts/` | Source disagreements and version/context differences |
| `templates/` | Reusable claim and source templates |
| `reports/` | Domain, source, and validation reports |

Each directory has its own README explaining its contents. A directory is created by committing a file into it.

## Evidence rules

1. **GRE declarations are not runtime behavior.** A field/method/property name proves only that the declaration is present in the extracted metadata.
2. **Decoded constants remain candidates** until their primitive type, raw bytes, units, context, and use site are supported.
3. **No fabricated mechanics or formulas.** If evidence is missing, write `UNKNOWN`, `NOT ESTABLISHED`, or `NOT AVAILABLE`.
4. **Preserve source differences.** Do not average, normalize away, or silently resolve conflicting community values.
5. **Keep version dimensions separate:** game release/build, SDK version, GRE metadata format, source publication date, and access date.
6. **Preserve source wording and context.** Clearly distinguish source-derived statements from Samantha's inference.
7. **Account data is not universal game knowledge.** Player saves/tests are user-provided or sample-specific evidence unless independently validated and explicitly approved.
8. **No bulk import to GKB.** This workspace is an evidence staging area.

## Claim classification and status

- Claim type: `OBJECTIVE` or `SENTIMENT`.
- Verification status: `VERIFIED`, `USER-PROVIDED`, `EXTERNAL-UNVERIFIED`, `HYPOTHESIS`, `CONFLICTING`, `SUPERSEDED`.

A VERIFIED status must describe what was verified and within which source/version/context. It must not imply developer-official status unless the source is genuinely official.

## First investigation

Start here: [Domain 04 — Combat Mechanics](domains/04-combat-mechanics/README.md).

Latest reports: [D04-01 — Damage Reduction Pipeline](reports/D04-01_damage-reduction-pipeline.md) and [D04-02 — Land Mine Behavior](reports/D04-02_land-mine-behavior.md). Neither investigation has promoted a universal mechanic into GKB.

Existing structural/content references:
- [GRE Domain 04 JSON](../1/04_combat_mechanics.json)
- [GRE Domain 04 text export](../1/04_combat_mechanics.md)
- [GRE Audit 05 — Domain 04 content review](../AUDIT/05_domain_04_combat_mechanics.md)
- [GRE Audit 43 — Domain 04 complete structural inventory](../AUDIT/43_domain_04_combat_mechanics_complete_structural_inventory.md)
- [GRE mechanism evidence map](../3/MECHANISMS.md)
- [GRE mechanism evidence JSON](../3/mechanism_evidence.json)
- [GRE package closure](../AUDIT/51_gre_package_structural_audit_closure.md)

## Completion criteria

A domain investigation is not complete merely because all declarations have been listed. It is ready for review only when:
- relevant sources are registered;
- each claim is atomic and source-linked;
- versions and dates are explicit or marked unknown;
- disagreements are recorded without forced resolution;
- numerical claims include units/context or explicitly lack them;
- hypotheses and unknowns are visible;
- unsupported conclusions are excluded;
- a report summarizes findings and remaining gaps.

## Change policy

- Work on `TestAccount`.
- Do not modify `main` without explicit authorization.
- Keep original GRE exports unchanged.
- Make small, reversible changes and verify each committed file.

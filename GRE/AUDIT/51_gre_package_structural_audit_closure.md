# GRE Audit 51 — Package-wide structural closure and residual evidence gaps

- Audit ID: `GRE-AUDIT-051`
- Inspection date: 2026-11-27
- Repository: `gamesloricca-afk/SamanthaTheTower`
- Branch: `TestAccount`
- Scope: closure review of the checked-in GRE extraction package and all 20 numbered domain inventories
- Change type: audit documentation only
- Original GRE source files: unchanged
- GKB promotion: none

## 1. Objective

Reconcile the package-level audit status with the completed domain structural inventories, identify stale status statements, and state precisely what is and is not complete.

This report does not claim full gameplay reverse engineering. The GRE package is metadata extraction output and does not contain the executable method bodies, call graph, serialized assets, or remote configuration required to prove most runtime mechanics.

## 2. Source identity and limits

The manifest records:

- Input filename: `DOC-20261127-WA0002.bin`
- Recorded size: 11,069,036 bytes
- Recorded SHA-256: `8266355fab717d91b51482122b66551afc62502b0f62fd8527930962cbefe81c`
- Metadata format version: 39
- Game release/build: unknown

The original binary is not present in the checked-in GRE tree inspected for this audit. Its recorded hash was not independently recomputed. Metadata version 39 must not be presented as a public game version.

## 3. Domain coverage

All 20 numbered domain JSON sources are present in the TestAccount GRE tree and have a corresponding complete structural inventory report:

| # | Domain | Type records | Structural report |
|---:|---|---:|---|
| 01 | Game Fundamentals | 53 | [40](40_domain_01_game_fundamentals_complete_structural_inventory.md) |
| 02 | Enemies | 31 | [41](41_domain_02_enemies_complete_structural_inventory.md) |
| 03 | Battle Conditions | 48 | [42](42_domain_03_battle_conditions_complete_structural_inventory.md) |
| 04 | Combat Mechanics | 79 | [43](43_domain_04_combat_mechanics_complete_structural_inventory.md) |
| 05 | Ultimate Weapons | 70 | [44](44_domain_05_ultimate_weapons_complete_structural_inventory.md) |
| 06 | Workshop | 35 | [45](45_domain_06_workshop_complete_structural_inventory.md) |
| 07 | Workshop Enhancements | 34 | [46](46_domain_07_workshop_enhancements_complete_structural_inventory.md) |
| 08 | Research | 15 | [38](38_domain_08_research_complete_structural_audit.md) |
| 09 | Modules | 108 | [39](39_domain_09_modules_complete_structural_audit.md) |
| 10 | Cards and Masteries | 49 | [22](22_domain_10_cards_masteries_full_json_metadata.md) |
| 11 | Bots | 42 | [24](24_domain_11_bots_complete_type_inventory.md) |
| 12 | Guardians | 65 | [29](29_domain_12_guardians_complete_type_record_inventory.md) |
| 13 | Perks | 39 | [30](30_domain_13_perks_complete_structural_audit.md) |
| 14 | Relics | 45 | [31](31_domain_14_relics_complete_structural_audit.md) |
| 15 | Vault | 59 | [32](32_domain_15_vault_complete_structural_audit.md) |
| 16 | Economy and Progression | 137 | [33](33_domain_16_economy_progression_complete_structural_audit.md) |
| 17 | Formulas and Calculations | 57 | [34](34_domain_17_formulas_calculations_complete_structural_audit.md) |
| 18 | Strategy Interactions | 58 | [35](35_domain_18_strategy_interactions_complete_structural_audit.md) |
| 19 | Version History / Save and Migration | 23 | [36](36_domain_19_version_history_complete_structural_audit.md) |
| 20 | Experimental In-client Features | 12 | [37](37_domain_20_experimental_community_complete_structural_audit.md) |
| | **Total domain memberships** | **1,059** | |
| | **Distinct type indices in manifest** | **475** | |

The 1,059 domain memberships are overlapping topical views, not 1,059 unique game types. Repeated appearances of a shared type are not independent evidence.

## 4. Cross-domain consistency

The existing cross-domain audit [47](47_cross_domain_declaration_consistency_audit.md) records:

- 1,059 domain memberships across 20 exports.
- 475 distinct type indices.
- 97 repeated type indices with identical full records.
- 121 repeated decoded-candidate keys without decoded-value/raw-byte disagreement.
- Same-name types with different indices separately cataloged.

These results establish internal consistency for the comparisons performed. They do not establish that decoded values are correct gameplay values, nor that the extraction is complete relative to the original binary.

The declaration-level relationship map is recorded in [48](48_cross_domain_relationship_declaration_map.md). Candidate `GATES`, `SCALES`, `CAPS`, `INDEPENDENT_OF`, and `APPLIED_BEFORE` relationships must remain unasserted or explicitly hypothetical unless implementation or independent evidence supports them.

## 5. Evidence classes and handling

The GRE package contains several different evidence forms. Keep them separate:

1. **Direct metadata declarations:** type, field, method, parameter, property, enum, token, and offset records. These prove that the extraction contains the declaration, not that it is active or how it behaves.
2. **Decoded default candidates:** values decoded from raw bytes using inferred primitive encodings. Retain raw bytes, offset, type context, and decoder details. Do not promote a candidate to a verified mechanic without validating its type, unit, use site, and version.
3. **String-literal matches:** keyword-filtered strings whose owning assembly/system is not always established. Do not assign them to a mechanic based on wording alone.
4. **Mechanism symbol map:** selected method/field names and offsets. This is a navigation aid, not a reconstructed call graph or execution trace.
5. **Compiler-generated records:** closures, iterators, and coroutine state machines. Preserve in raw metadata; do not treat them as standalone player-facing game concepts without evidence.
6. **External fanmade claims:** not contained as corroborated community evidence merely because a domain is named Experimental and Community. Record actual source, author/site, date, game-version scope, and evidence separately.

## 6. Package-wide residual gaps

The following remain open because the source package does not contain the evidence needed to close them:

| ID | Gap | Required evidence / treatment |
|---|---|---|
| GRE-A01 | Public game release/build corresponding to metadata v39 unknown | Keep game version unknown until independently sourced |
| GRE-A02 | Domain grouping is heuristic and overlapping | Preserve original type index and all memberships |
| GRE-A03 | Primitive default decoding is inferred | Keep candidate status; validate type, units, and use site |
| GRE-A04 | String-literal ownership may be unknown | Do not assign to a system without corroboration |
| GRE-A05 | Native method bodies and call graph absent | Runtime logic/order/formulas remain unproven |
| GRE-A06 | Version History domain is not a complete patch history | Describe it as save/version/migration declarations |
| GRE-A07 | Experimental/Community domain is not community-source evidence | Treat it as in-client feature markers unless external provenance exists |
| GRE-A08 | Original input binary absent from checked-in GRE tree | Recorded hash not independently revalidated |
| GRE-A09 | External fanmade-source comparison not performed package-wide | Preserve each source independently; do not choose a winner |
| GRE-A10 | Serialized assets and remote configuration absent | Live catalogs, balance values, and remotely configured behavior remain unknown |

## 7. Corrected completion status

| Workstream | Status | Meaning |
|---|---|---|
| Repository and branch safety review | COMPLETE | Scope and branch restrictions recorded |
| Manifest/source identity review | COMPLETE WITH LIMITATION | Manifest inspected; binary itself not re-hashed |
| 20-domain source inventory | COMPLETE | All 20 JSON files cataloged |
| 20-domain structural inventories | COMPLETE | All 1,059 memberships / 475 distinct type indices accounted for in reports |
| Cross-domain declaration consistency | COMPLETE FOR CHECKED COMPARISONS | Repeated records and candidate keys compared |
| Declaration-level relationship map | COMPLETE FOR SELECTED LINKS | Unproven mechanic edges remain hypotheses |
| Decoded candidate verification | INCOMPLETE | Candidate values are not automatically gameplay facts |
| Runtime/mechanic reverse engineering | BLOCKED BY SOURCE CONTENT | Method bodies/call graph/config/assets are absent |
| External fanmade-source conflict review | NOT PERFORMED | Separate sources must be preserved side by side |
| GKB claim extraction/promotion | NOT PERFORMED | Requires separate schema/provenance validation |

## 8. Corrections to earlier audit status text

Earlier versions of [00_repository_and_source_audit.md](00_repository_and_source_audit.md) still stated that Domain 01–20 audits were not complete and instructed starting again at Domain 01. Those statements are superseded by the later complete structural inventory reports 22, 24, 29–46 and cross-domain reports 47–48.

Earlier partial-access notes for Domains 09 and 10 are historical. The later full JSON reports 39 and 22 document resolution of those access gaps. They must not be represented as current unresolved source-access gaps.

The phrase “complete GRE audit” in this workspace means **complete package/domain structural audit and evidence-boundary review**, not proof of every runtime game mechanic.

## 9. Final disposition

- Structural audit of GRE Domains 01–20: **COMPLETE**.
- Package-wide source and extraction limitations: **DOCUMENTED**.
- Cross-domain declaration consistency: **COMPLETE FOR THE CHECKED COMPARISONS**.
- Runtime behavior audit: **NOT COMPLETE / SOURCE-LIMITED**.
- External fanmade contradiction comparison: **NOT PERFORMED**.
- Original GRE data: **UNCHANGED**.
- GKB: **UNCHANGED**; no claim or relationship promoted.
- `main`: **UNCHANGED**.

## 10. Next permitted phase

The GRE structural audit can be treated as closed. The next work, if authorized, is a separate evidence-expansion phase: obtain method bodies/IL or equivalent implementation sources, asset/configuration data, and dated fanmade sources; compare claims without selecting a universal winner where sources conflict. Only after that should selected source-qualified claims be staged for GKB validation.

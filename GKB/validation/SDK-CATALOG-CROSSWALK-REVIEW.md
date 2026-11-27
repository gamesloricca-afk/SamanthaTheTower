# SDK Catalog Crosswalk and Comparison Review

- Review date: 2026-11-27
- Repository branch: `GKB`
- SDK package: `thetowersdk@0.14.1`
- SDK game-version marker: `v28.3.0`
- Source workflow: [GitHub Actions run 45956527357](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45956527357)
- Review status: `COMPLETED — CANDIDATES ONLY`

## Objective

Review the SDK graph-to-catalog crosswalk, current Samantha identifier mapping, and Research/Workshop/Cards/Masteries comparisons. Check whether the observed matches justify identity, whether structural differences are being preserved, and whether unmatched records are being mistaken for missing game knowledge.

## 1. SDK graph to data-catalog crosswalk

The run inspected 320 SDK graph nodes against four SDK catalogs:

| Catalog | Records | Exact source-ID matches | Exact-label candidates | Ambiguous | Unmatched |
|---|---:|---:|---:|---:|---:|
| Research | 234 | 3 | 3 | 0 | 314 |
| Workshop | 47 | 0 | 2 | 0 | 318 |
| Cards and Masteries | 32 | 0 | 6 | 0 | 314 |
| Perks | 34 | Not available | 0 | 0 | 320 |

Fourteen distinct graph nodes had at least one candidate across the selected catalogs. No mapping was approved.

Interpretation:

- Research has three exact source-ID matches and three exact-label candidates. These remain SDK-internal candidates, not Samantha canonical mappings.
- Workshop produced two exact-label candidates.
- Cards and Masteries produced six exact-label candidates.
- The observed Perks export has no separate ID field, and this crosswalk found no exact label candidates for it. This is not evidence that Perks are absent from the knowledge graph or unrelated to other systems.
- The 314/318/320 unmatched counts describe this limited crosswalk only. They do not mean those graph nodes are invalid, lost, or unknown to Samantha.

Matching is exact string equality only. Fuzzy matching, normalization, generated identifiers, promotion, and source modification are disabled.

## 2. Samantha identifier mapping coverage

The identifier mapping compared the 320 graph nodes with:

| Target | Type | Records |
|---|---|---:|
| Modules — Unique | Canonical catalog | 28 |
| Ultimate Weapons | Document headings only | 9 |
| Enemies | Document headings only | 21 |
| **Total targets** | | **58** |

Results:

| Result | Nodes |
|---|---:|
| Exact ID match | 0 |
| Exact name candidate | 28 |
| Document-reference candidate | 14 |
| Ambiguous | 0 |
| Unmatched | 278 |
| **Total graph nodes** | **320** |

No mapping was approved.

Important interpretation:

- The 28 module matches are name candidates, not ID matches. The current module catalog and SDK graph do not share exact IDs in this comparison.
- The 14 document-reference candidates point to headings in Ultimate Weapon or Enemy documents. They are navigation references, not canonical entity IDs.
- Research, Workshop, Cards and Masteries, and Perks have no Samantha canonical catalog in this mapping's current scope.
- Unmatched means only that no exact candidate was found in the listed targets. It does not establish that the game entity is missing from Samantha's knowledge.

## 3. Research and Workshop comparison

Observed top-level fields:

- Shared: `category`, `levels`
- Research-only: `base`, `description`, `name`, `slug`, `unit`, `value`
- Workshop-only: `key`, `label`, `maxLevel`, `minLevel`

Match observations:

- Research `slug` ↔ Workshop `key`: 0 exact matches.
- Research `name` ↔ Workshop `label`: 21 exact-label candidates; 0 ambiguous.
- Research `name` ↔ Workshop `key`: 20 cross-field text equalities.

The 20 cross-field matches are explicitly classified as text equality, not identifier matches. The selected fields do not establish an explicit cross-catalog reference.

The reports compare nested level object shapes and per-pair level counts. Shared field names do not establish equivalent meanings, units, costs, values, formulas, or gameplay effects. No numerical or gameplay-equivalence reconciliation was performed.

## 4. Research and Cards/Masteries comparison

Observed top-level fields:

- Shared: `description`, `name`
- Research-only: `base`, `category`, `levels`, `slug`, `unit`, `value`
- Cards/Masteries-only: `id`, `levelType`, `levelValues`, `masteryDescription`, `masteryName`, `masteryType`, `masteryValues`, `rarity`

Match observations:

- Research `slug` ↔ Card `id`: 1 exact string match; 0 ambiguous.
- Research `name` ↔ Card `name`: 6 exact-name candidates; 0 ambiguous.
- Research `name` ↔ Card `masteryName`: 1 exact-name candidate; 0 ambiguous.

These are candidate observations only. The comparison explicitly reports that an explicit cross-catalog reference is not established from the selected fields.

Nested arrays are structurally distinct in the inspected SDK snapshot:

| Field | Records with array | Entries | Entry type | Array length |
|---|---:|---:|---|---:|
| Research `levels` | 234 | 6,170 | Objects | 1–100 |
| Card `levelValues` | 32 | 224 | Numbers | 7 |
| Card `masteryValues` | 32 | 320 | Numbers | 10 |

Research level objects use the observed keys `cost`, `duration`, and `level`. Card level values and mastery values are separate numeric arrays. The comparison does not infer that these arrays represent the same progression or mechanics.

## 5. Data preservation and missing-data assessment

The reviewed adapters and tests are read-only:

- Raw SDK records are not modified.
- Records are not merged or deduplicated.
- No identifiers are generated.
- No canonical mapping or relationship is approved.
- No canonical claims are created.
- No verification status is promoted.
- No numerical values are treated as gameplay-equivalent.

The catalog structural audit for the same run reported 347 records across the four catalogs, with 0 ERROR, 0 WARNING, and 27 INFO findings. It found no missing primary IDs or labels, duplicate source-ID groups, repeated label groups, exact duplicate record groups, non-object records, or source-index problems in the inspected catalogs.

This is a structural audit, not a semantic or mechanics validation. Optional and heterogeneous fields remain present/absent as observed; they are not filled with inferred defaults.

## 6. Decisions

1. Keep the existing conservative matching policy.
2. Do not promote exact-label or cross-field text matches to identity or relationship claims.
3. Keep the 28 module name candidates separate from exact-ID mappings.
4. Keep document-heading references distinct from canonical entities.
5. Do not treat unmatched graph nodes as missing knowledge.
6. Preserve different nested structures for Research, Workshop, Cards, Masteries, and Perks.
7. Keep SDK records `EXTERNAL-UNVERIFIED` until reviewed against evidence.

No adapter code change is required by these findings. The current comparison reports already expose the relevant ambiguity and limitations, and their tests passed in the source workflow.

## 7. Test evidence

The workflow completed successfully. Relevant tests reported:

- SDK-to-SDK data catalog crosswalk: 17 cases passed.
- SDK identifier mapping: 25 assertions passed.
- Research–Workshop comparison: 12 cases passed.
- Research–Cards and Masteries comparison: 12 cases passed.
- SDK domain catalog structural audit: 21 cases passed.
- Nested catalog audit: 8 cases passed.

The workflow uploads the full JSON reports and staging files as artifact `gkb-sdk-staging-260` with a 14-day retention period. The summaries in this document are a review aid; the machine-readable artifact remains the detailed record.

## Limitations

- Findings describe only the pinned SDK snapshot `thetowersdk@0.14.1` with game-version marker `v28.3.0`.
- This review does not independently verify game mechanics or fanmade claims.
- Exact string matches do not prove semantic identity.
- No external community-source comparison is included.
- No canonical import or relationship promotion was performed.

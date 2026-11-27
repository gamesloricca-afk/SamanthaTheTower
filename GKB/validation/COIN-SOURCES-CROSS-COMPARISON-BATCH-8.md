# Batch 8 — Coin Sources Cross-Comparison & SDK Test Coverage

**Audit target:** TheTowerSDK `0.14.1`  
**Source mirror branch:** `TestAccount`  
**Report branch:** `GKB`  
**Retrieved/reviewed:** 2026-11-27  
**SDK code observations:** `OBJECTIVE`  
**Community-source statements:** `EXTERNAL-UNVERIFIED`  
**Cross-source disagreements:** preserved; no winner selected  
**Runtime tests:** `NOT TESTED`  
**Canonical GKB claims/edges:** none created

## 1. Objective

Compare coin-related SDK behavior and assumptions with separate fan-made sources. Review the real SDK test layout and coverage before deciding whether Samantha needs another validation harness.

Scope:
- Coin Bonus Enhancement cap and multiplier.
- CPK formula scope.
- Fetch drop-table odds and coin CPM model.
- SDK tests that cover these formulas and their boundaries.
- Availability and limitations of the repository's Master Sheet as a comparison source.

## 2. Repository inspection

### 2.1 Separate wiki sources are intentional

The SDK's `src/wiki/community/wikis.ts` defines two sources:
- Fandom — The Tower: Idle Tower Defense Wiki.
- Game Vault — The Tower Wiki and Guides.

The source documentation explicitly says Game Vault is a fork that has diverged. Some pages are empty stubs on Fandom but contain full tables on Game Vault. It also records different API/search/transport behavior for each wiki.

The SDK states both wikis are CC-BY-SA and pages are fetched rather than bundled. The two sites must therefore remain separate provenance sources; a shared fact is not automatically an independent confirmation if one page was copied from the other.

Source file:
- `src/wiki/community/wikis.ts`
- SHA: `0274e3307f3cd87803b804669748a85b0c456dd7`

### 2.2 Correct SDK test location found

The SDK test suite is under `tests/mechanics/`, not beside the implementation under `src/mechanics/resource-drops/`.

Relevant tests found:
- `tests/mechanics/resource-drops-coin-simulation.test.ts`
- `tests/mechanics/resource-drops-coin-module-cpk.test.ts`
- `tests/mechanics/resource-drops-coin-generator-modules.test.ts`
- `tests/mechanics/simulate-wave-coins.test.ts`
- `tests/mechanics/wave-ordinary-coin-weight.test.ts`

Earlier root-level test path probes returned 404 because they were aimed at the wrong directory. This does not indicate missing SDK tests.

### 2.3 Master Sheet boundary

The `TestAccount` root contains `Master Sheet with JSON.xlsx`. The XLSX Reader script reads this workbook with SheetJS and preserves worksheet rows and formulas in JSON output. However, the GitHub connector used for this inspection returns UTF-8 text and does not provide the workbook's binary contents. No extracted workbook output was present in the inspected `TestAccount` tree.

Therefore:
- Workbook existence is verified.
- Workbook contents/formulas were not inspected in this batch.
- No Master Sheet values are claimed or compared.
- Do not infer the workbook's contents from its filename.

The XLSX Reader is a separate subsystem; this report does not modify or merge its data into GKB.

## 3. Cross-source findings

### 3.1 Coin Bonus Enhancement cap: multiple published values

| Source | Reported cap | Reported maximum multiplier | Source date/context |
|---|---:|---:|---|
| TheTowerSDK 0.14.1 code | Level 200 | 3.00x | SDK source snapshot; test asserts level 250 remains 3x |
| Fandom — Coins Per Kill Bonus / Currency | Level 200 | 3.00x | Search index crawled about 5 months before retrieval |
| Tower Hub — Coins Per Kill Bonus | Level 200 | 3.00x | Page says last verified 2026-07-29 |
| Tower Hub — Currency / Utility Enhancements | Level 300 | 4.00x | Search result says last verified 2026-11-01 / Utility page recently crawled |
| Game Vault — Coins | Level 100 | 2.00x | Search result timestamp about 2 years before retrieval |

SDK implementation:
- `coinBonusEnhancementMult(level)` clamps the input to 0–200 and returns `1 + level × 0.01`.
- `resource-drops-coin-simulation.test.ts` asserts level 200 = 3x and level 250 = 3x.

Source pages:
- Fandom: https://the-tower-idle-tower-defense.fandom.com/wiki/Coins_Per_Kill_Bonus
- Fandom Currency: https://the-tower-idle-tower-defense.fandom.com/wiki/Currency
- Tower Hub CPK: https://www.tower-hub.com/wiki/workshop/coins-per-kill-bonus
- Tower Hub Currency: https://www.tower-hub.com/wiki/currency/currency
- Tower Hub Utility Enhancements: https://www.tower-hub.com/wiki/workshop/workshop-enhancement-utility
- Game Vault Coins: https://the-tower-idle-tower-defense.game-vault.net/wiki/Coins

**Assessment:** These are distinct published claims. Tower Hub's own indexed pages also disagree (200/3x versus 300/4x). Game Vault's Coins page reports 100/2x. The source pages have different freshness indicators and the Game Vault page is much older, but freshness does not authorize Samantha to erase the record. Store the source, page, date/crawl context, and reported cap separately. No winning value selected.

### 3.2 CPK formula: similar displayed formula, different calculation scope

Fandom and Game Vault's CPK pages report the following displayed CPK formula:

```
(Workshop × CPK lab + CPK mod effect)
× (1 + coin bonus enhancement)
× (1 + 0.15 × All Coin perk quantity)
× (1.8 × (1 + Improve Trade-Off lab))
```

Both pages state that Coin Bonus Enhancement affects both tier bonus and Coins/Kill, so its overall benefit is counted twice across those two paths. They also say to use 1 when the trade-off perk is inactive and to avoid rounding intermediate values.

Tower Hub's CPK page reports the same core formula and says its values are cross-checked against decoded save data and the Fandom wiki (last edited 2026-04-06).

The SDK's `buildResourceDropsCoinMultipliers` has a broader run-kill scope:
- Global stack: tier, dissonance, generator, Coin Bonus Enhancement, Coins card, theme, relic, pack, All Coin perk, trade-off.
- CPK core: Workshop × CPK lab + module bonus, then Vault CPK multiplier.
- Baseline kill stack: global stack × Coin Bonus Enhancement × CPK core × BHD multiplier.
- Timed UW/Bot multiplier is applied separately by the full simulator.

The CPK wiki formula is a displayed CPK formula, not a complete run coin total. Missing factors such as tier, theme, relic, pack, timed UW, and Vault/BHD are scope differences and must not be labeled formula contradictions without a same-output comparison.

**Enhancement handling:** the fan-made pages describe two overall applications: tier bonus and CPK. SDK code contains one Coin Bonus Enhancement term in its shared global stack and another in the kill-specific CPK branch. This is consistent in broad structure with the two-path explanation, but exact displayed-stat equivalence and game-version applicability remain unverified. Retain the earlier implementation review note; do not call it a proven bug or silently close it.

Sources:
- Fandom CPK: https://the-tower-idle-tower-defense.fandom.com/wiki/Coins_Per_Kill_Bonus
- Game Vault CPK: https://the-tower-idle-tower-defense.game-vault.net/wiki/Workshop/Coins_Per_Kill
- Tower Hub CPK: https://www.tower-hub.com/wiki/workshop/coins-per-kill-bonus

### 3.3 Coins per Wave

Fandom and Game Vault pages report:
- 149 Workshop levels.
- Base value 1.
- +1 per level, maximum 150.
- All Coin perk and tier coin bonus affect Coins/Wave.

The SDK has a separate CPW branch: Workshop CPW × shared global multiplier × CPW lab. It does not route CPW through the CPK module bonus, Vault CPK, or BHD CPK term.

Sources:
- Fandom: https://the-tower-idle-tower-defense.fandom.com/wiki/Coins_Per_Wave
- Game Vault: https://the-tower-idle-tower-defense.game-vault.net/wiki/Workshop/Coins_Per_Wave

No conflicting CPW Workshop cap was observed in the reviewed source snippets. This is not a full CPW table audit.

### 3.4 Fetch loot table: agreement on outcome weights

SDK `drops-game-data.ts` records the following outcome weights per successful Fetch find:

| Reward | SDK | Fandom | Tower Hub |
|---|---:|---:|---:|
| Coins | 86.5% | 86.5% | 86.5% |
| Gems | 4% | 4% | 4% |
| Medals | 2% | 2% | 2% |
| Reroll shards | 3% | 3% | 3% |
| Each module shard type | 1% | 1% | 1% |
| Common module | 0.4% | 0.4% | 0.4% |
| Rare module | 0.1% | 0.1% | 0.1% |

Fandom and Tower Hub also list caps of 20 Gems, 10 Medals, 5 Common Modules and 2 Rare Modules. The SDK has the same cap constants but its EV simulator does not apply them to accumulated run rewards.

Tower Hub's Chips page says its numbers are observed in game and notes cross-checking against decoded save data and the Fandom wiki (last edited 2026-02-23). This provenance is stronger detail than a bare table, but it remains a fan-made source.

Sources:
- Fandom Chips: https://the-tower-idle-tower-defense.fandom.com/wiki/Chips
- Tower Hub Chips: https://www.tower-hub.com/wiki/system/chips
- TowerStats Fetch guide: https://towerstats.org/guide/guardian/fetch/

### 3.5 Fetch coin CPM: formula model is not identical across sources

**SDK code model**

```
runCPM = runCoinTotalBeforeFetch / runDurationMinutes
FetchCoins = expectedProcs × 0.865 × runCPM × 0.002
```

The SDK calculates CPM from the entire modeled run's pre-Fetch coin total divided by estimated run duration. The comment calls 0.002 (~0.2%) community/wiki-derived but does not name a specific dated page.

**Community statements**

- A March 10, 2026 Reddit discussion says Fetch coin rewards are 0.2% of Coins Per Minute at the time of the find and describes CPM as a rolling average of the last five minutes. This is a community observation, not official documentation.
- TowerStats' Fetch guide, updated 2026-11-19, reports six sample farming battle reports (pre-v29) where fetched coins were approximately 0.25% of coins earned. These are observed sample outcomes, not a universal formula.
- Fandom and Tower Hub publish the 86.5% reward weight but the reviewed pages do not specify the 0.2% CPM formula.

Sources:
- Reddit discussion: https://www.reddit.com/r/TheTowerGame/comments/1rpvsx6/for_the_guardian_setup_bounty_and_summon_need_to/
- TowerStats: https://towerstats.org/guide/guardian/fetch/
- Fandom Chips: https://the-tower-idle-tower-defense.fandom.com/wiki/Chips
- Tower Hub Chips: https://www.tower-hub.com/wiki/system/chips

**Difference to preserve:** SDK's whole-run average CPM is not the same time basis as a rolling five-minute CPM measured at each Fetch event. TowerStats' approximately 0.25% run-share is a sample result and is not equivalent to either formula. The 0.2% coefficient and the time basis must remain separate claims. Do not replace one model with another.

### 3.6 Fetch version-history warning

Fandom's version-history pages report:
- v26.2.26: Fetch coin income was calculated incorrectly and was adjusted downward.
- v26.3: Fetch coins were added to Guardian Coins in the battle report, drop rates were added, Fetch was adjusted to be disabled during Intro Sprint, and an Intro Sprint CPM bug was fixed.

This history is relevant to version compatibility: a Fetch model inferred from older sample runs may not describe later game behavior. The changelog statements do not provide the exact current CPM formula.

Sources:
- https://the-tower-idle-tower-defense.fandom.com/wiki/Version_History
- https://the-tower-idle-tower-defense.fandom.com/wiki/Version_History/V0.26

## 4. SDK test coverage inspected

| Test file | Relevant coverage | Limitation |
|---|---|---|
| `resource-drops-coin-simulation.test.ts` | Coin Bonus Enhancement cap 200/3x; CPK monotonicity; BH lab x11; GT scaling; timed UW example; Fetch included in total; timeline behavior; Fetch responds to coin multipliers | Tests encode SDK assumptions; not independent confirmation of live game behavior |
| `resource-drops-coin-module-cpk.test.ts` | Parses `+0.4x`; combines primary and assist contribution | Small helper-level tests only |
| `resource-drops-coin-generator-modules.test.ts` | BHD, Singularity Harness, trade-off lab, Intro Sprint, Fetch CPM helper positive output | Fetch assertion checks only positive output, not rolling-CPM parity or exact game result |
| `simulate-wave-coins.test.ts` | Per-wave rows, Intro Sprint zero waves, spawn-yield model differences, Wave Skip payout | Does not establish which spawn model matches all game versions |
| `wave-ordinary-coin-weight.test.ts` | Tier mix changes and approximate parity to save-measured enemy coin weight | Contains save-derived calibration; not universal evidence |

Important test detail:
- The main coin simulation test explicitly asserts that Coin Bonus Enhancement caps at 3x at level 200 and remains 3x at level 250.
- It also checks that Generator and Dissonance multipliers scale Fetch coin output, and that a coin perk timeline can change Fetch output through the pre-Fetch total.
- The tests do not compare the SDK's whole-run CPM against a measured rolling five-minute CPM.
- Tests include a coin-guide example with BH x11 and GT x20.75, but this is an inlined scenario fixture, not a live-game assertion.

All test files were inspected, not executed in this audit. Runtime status remains `NOT TESTED`.

## 5. Conflict and provenance register for Samantha

| ID | Subject | Source claims to preserve | Suggested status |
|---|---|---|---|
| B8-01 | Coin Bonus Enhancement cap | SDK/Fandom/Tower Hub CPK page: 200/3x; Tower Hub Currency/Utility indexed result: 300/4x; Game Vault Coins: 100/2x | `CONFLICTING` |
| B8-02 | CPK formula scope | Fandom/Game Vault/Tower Hub displayed CPK formula vs SDK full run-kill multiplier stack | Separate output scopes; not yet a direct contradiction |
| B8-03 | Fetch CPM time basis | SDK whole-run average CPM vs Reddit rolling five-minute CPM at find time | `CONFLICTING` model definitions |
| B8-04 | Fetch observed run share | TowerStats sample reports ~0.25% of run coins; SDK uses 0.2% CPM per expected coin proc | Separate empirical/model claims |
| B8-05 | Fetch version changes | Fandom v26.2.26/v26.3 history records Fetch income adjustment and CPM bug fix | Version-scoped source claim |
| B8-06 | Master Sheet coin formulas | Workbook exists, content not accessible in this inspection | `UNKNOWN / NOT INSPECTED` |

## 6. Validation harness decision

No new duplicate SDK test suite was added.

Reason:
1. The SDK already has targeted deterministic tests in `tests/mechanics/`.
2. The inspected repository's XLSX Reader is a separate workbook-ingestion utility and has not produced an inspected workbook JSON output in the available tree.
3. Samantha's own GKB runtime conventions must be inspected before creating a cross-source comparator.
4. A useful Samantha harness should validate provenance preservation and report disagreements, not assert one fan-made value is universally correct.

Recommended next implementation:
- A read-only comparison fixture with source ID, source URL, source date/version, subject, predicate, value, units, output scope, and verification status.
- A deterministic validator that checks required provenance, duplicate source identity, and preserves multiple values for the same subject/predicate.
- No auto-winner selection and no canonical GKB promotion.

## 7. Next priority

**Batch 9 — Minimal GKB Source-Comparison Validator**
1. Inspect the existing GKB schema, validation scripts, runtime package and test conventions on branch `GKB`.
2. Reuse existing schema fields where possible; do not invent a parallel claim model.
3. Add a small fixture for the Coin Bonus Enhancement and Fetch CPM source variants recorded in this report.
4. Test that two or more values for one subject/predicate remain separate and that missing provenance is reported.
5. Verify readback and test results; do not touch `main` or modify the SDK mirror.

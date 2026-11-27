# Batch 7 — Coin Multiplier Inputs, Perk Timeline & Fetch CPM Provenance

**Audit target:** TheTowerSDK `0.14.1`, mirrored on `TestAccount`  
**Report branch:** `GKB`  
**Scope:** Source inspection and formula tracing only  
**SDK code observations:** `OBJECTIVE`  
**Underlying game mechanics:** `EXTERNAL-UNVERIFIED`  
**Runtime tests:** `NOT TESTED`  
**Canonical GKB claims/edges:** None created

## 1. Objective

Trace the inputs and formula boundaries behind:
- CPK (Coins / Kill) and CPW (Coins / Wave).
- Standard coin perks and trade-off perk.
- Module CPK primary/assist contributions.
- Golden Tower coin bonus, GT+, Black Hole/DW/Spotlight labs and Golden Bot.
- Fetch expected procs, coin outcome probability, run CPM and Fetch coin estimate.
- Perk coin timeline and its restrictions.

## 2. Source files inspected

All paths refer to the SDK mirror on `TestAccount`.

| Source | Blob SHA |
|---|---|
| `src/mechanics/resource-drops/coin-multipliers.ts` | `8370d15b9e66835a93b3c423a198d09ad723bcf9` |
| `src/mechanics/resource-drops/coin-fetch.ts` | `80a572f58addbb03651df755bdb1424adca962e7` |
| `src/mechanics/resource-drops/coin-simulation.ts` | `1357a0bd32f17854637a549b065dee755d91f5b0` |
| `src/mechanics/resource-drops/coin-perks.ts` | `9f3797c4db324dcf53dad7bd7c2bbc84258581fc` |
| `src/mechanics/resource-drops/coin-trade-off.ts` | `876f8b3a65547989d9908a0ac11f376d6c8579e8` |
| `src/mechanics/resource-drops/coin-module-cpk.ts` | `5149b6c745e190b4a71ca186c2a6279887e90f3f` |
| `src/mechanics/resource-drops/coin-iap.ts` | `c39cc0c7698c5edac436fe847b54222fe29e77bd` |
| `src/mechanics/resource-drops/coin-intro-sprint.ts` | `eda7d3b88042650844f9da70bb840a2d49b7f2ce` |
| `src/mechanics/resource-drops/simulate-wave-coins.ts` | `efd5df48c692954a9d13331280c638a9e43fdcb6` |
| `src/mechanics/resource-drops/types.ts` | `f516cf8f219e5eac6a1f7aaaf329570987b2bc12` |
| `src/mechanics/enemies/drops-simulation.ts` | `84f8548da5dc8d73a6f7432006620b137edfcaa7` |
| `src/mechanics/enemies/drops-game-data.ts` | `8425bcb6ede1b9b4c426ef0f06967eb37e8fd9fe` |
| `src/mechanics/uptime/compute.ts` | referenced by multiplier builder; not audited in depth in this batch |

## 3. Findings

### 3.1 CPK and CPW are distinct formula branches

The inspected multiplier builder forms a shared `globalMult`:

```
globalMult =
  tierCoinMult
  × dissonanceCoinMultiplier
  × generatorCoinMultiplier
  × coinBonusEnhancement
  × coinsCardMult
  × themeMult
  × relicMult
  × packMult
  × perkCoinMult
  × tradeOffCoinMult
```

The CPK branch is:

```
cpkCore = (Workshop CPK × CPK lab + module CPK bonus) × Vault CPK multiplier
baselineKillMult = globalMult × coinBonusEnhancement × cpkCore × BHD CPK multiplier
```

The CPW branch is:

```
coinsPerWaveMult = Workshop CPW × globalMult × CPW lab
```

This means CPK and CPW share global factors but have separate workshop and lab terms. Module CPK, Vault CPK and BHD CPK are in the kill branch, not the flat wave branch.

**Carry-over conflict from Batches 5–6:** Coin Bonus Enhancement is present in `globalMult` and appears again in `baselineKillMult`. CPW uses the shared stack once. The SDK code is unambiguous about what it currently computes; whether the second CPK factor is intended is not established. Keep this open as an implementation conflict.

### 3.2 Module CPK primary and assist contribution

The dedicated helper parses module substat display strings such as `+0.4x` as an additive multiplier term.

The resulting bonus is:

```
primaryAdd + assistAdd × (1 + assistSlotEfficiencyPct + substatEfficiencyLabLevel) × 0.01
```

The helper clamps assist slot efficiency and floors the lab level at zero. It does not multiply the primary substat by assist efficiency. This helper returns the module bonus that is subsequently added to Workshop CPK × CPK lab before the Vault CPK multiplier.

**Boundary:** the assist module's contribution must not be pre-scaled and then passed into this helper again; that would apply efficiency twice. This is an adapter/input-normalization concern, not a claim about the game UI.

### 3.3 Coin perk and trade-off perk

The SDK models the All Coin Bonuses standard perk as:

```
(1 + 0.15 × quantity) × (1 + Standard Perk Bonus / 100)
```

Quantity is clamped to 0–5. When quantity is zero, the helper returns 1; the SPB factor is therefore not applied through this perk helper alone.

The coin trade-off perk helper returns:
- 1 when inactive.
- `1.80 × (1 + Improve Trade-Off lab percent / 100)` when active.

These two factors are then multiplied into `globalMult`. They are separate helpers and should retain separate provenance and input fields.

### 3.4 Golden Tower, other UW coin labs, and GT+

Golden Tower coin multiplier is built from:

```
(GT stone multiplier + GT Bonus lab value) × GT perk multiplier + additive Core module bonus
```

The code comment cites a community measurement thread for the order of the GT perk and module bonus. The additive module bonus is outside the GT perk multiplication in this helper.

BH, DW and SL coin multipliers are read from their corresponding lab slugs. The timed kill multiplier then uses their uptime ratios, alongside GT and Golden Bot. The `assumeSyncedUwCoinWindows` input changes the expectation model:
- Synced: overlapping uptime applies the product of active multipliers during the common overlap; solo portions are added.
- Unsynced: uptime contributions are added independently.

GT+ is calculated separately from level and estimated kills during the GT window:

```
1 + ((1 + 0.0003 × (GT+ level + 1)) ^ estimatedKills − 1)
```

It is multiplied into the expected timed kill multiplier. The SDK approximation note explicitly says post-GT Golden Combo kill scaling beyond the GT+ approximation is not modeled.

**Limitations:** the GT window kill estimate uses a representative midpoint wave and average wave duration. This is a modeling approximation, not a per-wave simulation of every GT activation.

### 3.5 Golden Bot coverage

When enabled, Golden Bot base multiplier is resolved from the Bot upgrade data. The multiplier used by the coin model is range-adjusted:

```
1 + coverageFraction × (goldenBotBase − 1)
```

Coverage fraction is clamped to 0–1. The coin model also uses Golden Bot uptime from the shared uptime calculator. The range-coverage fraction and uptime ratio are distinct inputs; do not merge them into one percentage.

### 3.6 Theme, relic, pack and enhancement inputs

The source uses:
- Theme passive: `1 + themeCoinBonusPct / 100`.
- Relic: `1 + relicCoinBonusPct / 100`.
- Coin Bonus Enhancement: `1 + floor(level clamped 0–200) × 0.01`.
- Vault CPK: `1 + floor(level clamped 0–3) × 0.05`.
- Pack toggles: Starter Pack ×2, Epic Pack ×3, Disable Ads ×1.5; product of enabled toggles.

The legacy theme helper can derive a percentage from owned category counts only when the explicit collective theme percentage is absent. The primary input type exposes the collective percentage.

These are SDK input formulas and stored constants. Their game-version applicability and independent evidence are not established by this audit.

### 3.7 Fetch expected procs and outcome weights

The standalone `simulateFetchDrops` helper calculates:

```
attempts = targetWave × clamp(averageWaveSeconds, 1, 600) / max(1, cooldownSeconds)
expectedProcs = attempts × findChance × (1 + doubleFindChance)
```

If `fetchActive === false`, expected procs and resource outcomes are zero. The SDK comments say zero upgrade level is still an active base Fetch.

Fetch outcome weights in `drops-game-data.ts`:
- Gems 4%.
- Medals 2%.
- Reroll shards 3%.
- Cannon, Armor, Generator and Core shards 1% each.
- Common modules 0.4%.
- Rare modules 0.1%.
- Coins 86.5%.

The same source comments that daily caps (Gems 20, Medals 10, Common Modules 5, Rare Modules 2) are not modeled in the EV simulation. The coin estimate is likewise an expected value, not a guaranteed per-run reward.

### 3.8 Fetch coin estimate uses pre-Fetch run CPM

The standalone helper `estimateFetchCoinsFromRunCpm` computes:

```
cpm = max(0, runCoinTotalBeforeFetch) / max(1e-9, runDurationMinutes)
coinProcs = expectedFetchProcs × 0.865
fetchCoins = coinProcs × cpm × 0.002
```

The 0.002 (0.2%) coefficient is explicitly commented as community/wiki-derived. The inspected file does not provide a named page or dated evidence. Keep that source attribution broad and unverified.

The integrated run coin simulation passes:
- `runCoinTotalBeforeFetch = preFetchTotal`, which includes kill coins, kill Wave Skip bonus, flat wave payout and flat payout Wave Skip bonus, after the kill stack has been applied where appropriate.
- `runDurationMinutes = targetWave × averageWaveSeconds / 60`, with the duration helper clamping average wave seconds to at least 1 second (default 30 when absent).

Fetch is therefore calculated from the integrated run's pre-Fetch CPM, not from a separate kill-only CPM and not from the final total including Fetch. This avoids recursive Fetch-on-Fetch calculation.

### 3.9 Perk timeline constraints

The per-wave coin simulator accepts `perkCoinTimeline` events with:
- Sorted, unique, positive integer wave numbers.
- Maximum 4096 events.
- Wave number no greater than 1,000,000.
- Finite `coinMultiplier` and optional `killCoinMultiplier`, each at least 1.

An event applies from its specified wave onward until the next event changes it. The general coin multiplier affects kill and flat wave payout; the additional `killCoinMultiplier` is applied only to the kill path.

When a timeline is supplied, the SDK rejects non-neutral static All Coin perk level or the static coin trade-off perk flag. This is a guard against combining timeline representation with the same static perk inputs.

The timeline is processed in `simulate-wave-coins.ts`; the separate `simulate-wave-econ.ts` base coin columns do not apply this timeline. Do not assume all simulator APIs share timeline support.

## 4. Key source boundaries and unresolved points

| ID | Subject | Observation | Status |
|---|---|---|---|
| B7-01 | Coin Bonus Enhancement | Included in global stack and multiplied again in baseline CPK | `CONFLICTING` implementation review |
| B7-02 | Assist module CPK | Assist efficiency is applied inside dedicated helper | `OBJECTIVE` code behavior; ensure no pre-scaling |
| B7-03 | GT module bonus order | Added after GT stone + lab are multiplied by GT perk | `OBJECTIVE` code behavior; community measurement provenance |
| B7-04 | Timed UW sync | Synced and unsynced are alternate expectation assumptions | `HYPOTHESIS` as run behavior until timing evidence |
| B7-05 | GT+ | Uses representative estimated kills during GT window | `OBJECTIVE` approximation; post-GT Golden Combo omitted |
| B7-06 | Fetch CPM coefficient | 0.2% described only as community/wiki | `EXTERNAL-UNVERIFIED` |
| B7-07 | Fetch daily caps | Listed in source but not applied by EV simulator | `OBJECTIVE` limitation |
| B7-08 | Perk timeline | Supported by wave coin path, not the separate wave economy coin fields | `OBJECTIVE` API boundary |

## 5. Tests and validation

- Source inspection completed for the listed files.
- Guessed test locations `coin-simulation.test.ts`, `coin-fetch.test.ts`, `coin-perks.test.ts`, `coin-multipliers.test.ts`, and `simulate-wave-coins.test.ts` at the resource-drops directory root returned 404.
- No claim is made that those are the SDK's actual test locations or that the SDK has no tests.
- Runtime tests: `NOT TESTED`.
- No live-game measurements performed.
- No external fan-made source comparison performed.
- No canonical claims or relationships created.
- No SDK source files modified.

## 6. Recommended GKB representation

1. Keep CPK and CPW as separate formula branches with shared multiplier references.
2. Preserve the Coin Bonus Enhancement double-application issue as an unresolved SDK implementation conflict.
3. Store module primary and assist contributions separately, including assist efficiency input and its application stage.
4. Store static perk, trade-off perk, perk timeline, and timed UW multipliers as separate inputs.
5. Store GT stone, GT lab, GT perk, and additive Core bonus as separate source-backed components.
6. Store Golden Bot range coverage and uptime independently.
7. Store Fetch attempt/proc expectation, loot-table weights, CPM coefficient and daily-cap limitation as separate claims with separate provenance.
8. Keep Fetch coin output separate from pre-Fetch run coin total and clearly identify the CPM time basis.

## 7. Next priority

**Batch 8 — Coin Formula Cross-Source Comparison & Minimal Validation Harness**
1. Compare the SDK formulas and tables with available fan-made references in the repository.
2. Record each differing value side-by-side with source name, version/date, and exact reference.
3. Do not select a winner where fan-made sources disagree.
4. Add a small, reversible validation harness for deterministic formula helpers only after checking existing runtime conventions.
5. Report unknown, untested and unsupported fields rather than filling them with assumptions.

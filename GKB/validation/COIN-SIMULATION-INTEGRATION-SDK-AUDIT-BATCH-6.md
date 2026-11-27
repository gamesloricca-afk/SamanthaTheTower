# Batch 6 — Coin Simulation Integration & Formula Boundaries

**Audit target:** TheTowerSDK `0.14.1`, mirrored on `TestAccount`  
**Report branch:** `GKB`  
**Scope:** Source-code tracing; no runtime execution  
**Classification:** SDK implementation = `OBJECTIVE`; interpretation as actual game mechanics = `EXTERNAL-UNVERIFIED`  
**Canonical GKB claims/edges:** None created

## 1. Objective

Trace the end-to-end boundary between:
1. Per-wave coin simulation.
2. Per-wave economy simulation (coins plus cells/shards).
3. Run-level coin result and Fetch estimate.
4. Segment-wise kill-yield helper.

The audit checks where spawn yield, enemy count, coin weight, static multipliers, timed UW/Golden Bot, Wave Skip and flat Coins/Wave payout are applied. It also records places where similarly named outputs have different coverage.

## 2. Source files inspected

All files were read from `TestAccount`. SHA identifies the inspected source blob.

| File | Blob SHA |
|---|---|
| `src/mechanics/resource-drops/coin-simulation.ts` | `1357a0bd32f17854637a549b065dee755d91f5b0` |
| `src/mechanics/resource-drops/simulate-wave-coins.ts` | `efd5df48c692954a9d13331280c638a9e43fdcb6` |
| `src/mechanics/resource-drops/simulate-wave-econ.ts` | `323ef52b8648110134863918fe60b43af07cc031` |
| `src/mechanics/resource-drops/accumulate-wave-econ.ts` | `3b85a72ef1bec00afcbd8dc2a3fe7ccfda77c970` |
| `src/mechanics/resource-drops/coin-multipliers.ts` | `8370d15b9e66835a93b3c423a198d09ad723bcf9` |
| `src/mechanics/resource-drops/wave-skip-per-wave.ts` | `75fc123edeb18271af33a0f12b471ea226384015` |
| `src/mechanics/resource-drops/wave-ordinary-coin-weight.ts` | `9e0303145274f052a8835cfb41b98f7af683badb` |
| `src/mechanics/resource-drops/types.ts` | `f516cf8f219e5eac6a1f7aaaf329570987b2bc12` |
| `src/mechanics/waves/spawn-yield.ts` | `d39155c96198b3919ba08ae0084082fbf28fc7f9` |

The SDK test paths attempted under `src/mechanics/resource-drops/__tests__/` for coin simulation, wave coins, wave economy and accumulation returned 404. This means those exact paths were not available at the inspected mirror paths; it does not establish that no tests exist elsewhere.

## 3. Formula map

### 3.1 Per-wave expected kill count

The normal non-gate path in `killsPerWaveFromSpawnContext` is:

```
expectedKillsBeforeWaveSkip
  = WaveAcceleratorSpawnChartCap(wave, WA mastery)
  × EnemyBalanceMultiplier
  × ExpectedEnemiesPerSpawnTick(spawnYield)
```

Default per-tick yield is 3.25 when no explicit gate overrides are supplied. Account-derived yield can be requested with `useAccountSpawnYield`; gate-based mode can use Quantum or legacy additive-probe calculations. These are distinct input paths.

The per-wave coin simulator then applies the Wave Skip spawn fraction:

```
expectedKills = expectedKillsBeforeWaveSkip × spawnFraction
spawnFraction = 1 / (1 + skipChance × (expectedSkipsPerProc − 1))
```

This is an expected-value fraction over nominal wave indices, not a literal partial enemy count in a particular wave.

### 3.2 Per-wave kill coin base

In `forEachWaveCoinRow`:

```
playedBaseKillCoins
  = expectedKills
  × waveIndex
  × ordinaryCoinWeightAtTier(tier, input)
  × timelineCoinMultiplier
  × timelineKillCoinMultiplier
```

For waves at or below `introSprintZeroCoinWaveCap`, the base kill coin value is zero.

The source's `ordinaryCoinWeightAtTier` is used here. This is distinct from the save-derived `RESOURCE_DROPS_AVG_ENEMY_COIN_WEIGHT` used by `accumulateResourceDropsKillYields` (see §3.7).

### 3.3 Wave Skip coin income

For kill coins and flat wave payout, the per-wave simulator computes a separate skip-income EV from:
- Previous wave's total payout.
- Previous played base payout (the anchor for multi-skip burst correction).
- Skip chance.
- Expected skips per proc.
- Spawn fraction.
- The configured skip income multiplier (default 1.10).

The row values are:
- `rawKillCoins = playedBaseKillCoins + skipKillCoins`
- `waveCoins = playedBaseWaveCoins + skipWaveCoins`

The totals retain both total and skip-only fields. In `simulateResourceDropsCoins`, the final split is reconstructed as total minus skip and skip-only.

**Important:** the per-wave path does not simply multiply all coin totals by `waveSkipMult`. It applies a spawn fraction and a recursive per-wave skipped-income EV. The `waveSkipMult` in the multiplier breakdown is a separate summary field; the inspected final aggregation uses the per-wave row totals.

### 3.4 Flat Coins/Wave path

The played base wave payout is:

```
playedBaseWaveCoins
  = coinsPerWaveMult × spawnFraction × timelineCoinMultiplier
```

The `coinsPerWaveMult` builder uses:
- Coins/Wave Workshop value.
- Global coin multiplier stack.
- Coins/Wave lab multiplier.

This flat payout does not use the CPK core and does not receive the timed UW/Golden Bot kill multiplier in the final aggregation.

### 3.5 Static multiplier stack and kill/wave separation

The inspected `buildResourceDropsCoinMultipliers` creates:

```
globalMult
  = tierCoinMult
  × dissonanceCoinMultiplier
  × generatorCoinMultiplier
  × coinBonusEnhancement
  × coinsCardMult
  × themeMult
  × relicMult
  × packMult
  × perkCoinMult
  × tradeOffCoinMult

CPK core
  = (Workshop CPK × CPK lab + module CPK bonus) × Vault CPK multiplier

baselineKillMult
  = globalMult × coinBonusEnhancement × CPK core × BHD CPK multiplier

coinsPerWaveMult
  = Workshop CPW × globalMult × CPW lab
```

**Carry-over review flag from Batch 5:** Coin Bonus Enhancement appears in `globalMult` and is multiplied again in `baselineKillMult`. It is not multiplied a second time in the shown CPW expression. This remains an SDK implementation inconsistency to preserve, not a correction made by this audit.

### 3.6 Timed UW and Golden Bot

The final run-level kill stack is:

```
killStack = baselineKillMult × expectedTimedKillMult
```

The timed multiplier is built from uptime ratios for GT, BH, DW, SL and Golden Bot. The SDK supports:
- `assumeSyncedUwCoinWindows = true`: common overlap uses the product of active multipliers, and non-overlap portions are added.
- `false`: each uptime contribution is added independently.

GT+ is multiplied into `expectedTimedKillMult`. The final aggregation applies this timed stack to kill coins, including skip kill-coin income. It does not apply it to flat Coins/Wave payout.

`perkCoinTimeline.killCoinMultiplier` is documented as an additional timed UW kill-path ratio and is not applied to flat wave payout. This is separate from the static global multiplier builder.

### 3.7 Run-level final result and Fetch

`simulateResourceDropsCoins` performs these steps:

1. Build wave context and multiplier breakdown.
2. Accumulate per-wave coin rows using `coinsPerWaveMult`.
3. Calculate `killStack = baselineKillMult × expectedTimedKillMult`.
4. Split total kill coins into played and Wave Skip portions, then apply the same kill stack to both.
5. Split flat wave payout into played and Wave Skip portions; these values are already on the CPW path.
6. Sum all four pre-Fetch components.
7. Estimate run duration and Fetch coins from the pre-Fetch run CPM.
8. Add Fetch coins to produce `totalCoins`.

Thus Fetch is a separate final contribution. It is not part of the per-wave coin rows.

### 3.8 Segment-wise helper is not the same coin model

`accumulateResourceDropsKillYields` uses:
- `RESOURCE_DROPS_AVG_ENEMY_COIN_WEIGHT = measuredAverageEnemyCoinWeight()`.
- A segment-wise aggregation over Wave Accelerator spawn chart rows.
- Spawn yield and Enemy Balance assumptions.
- The Intro Sprint zero-coin cap.

It returns only `totalKills` and `rawKillCoins`. The inspected implementation does not apply the per-wave `ordinaryCoinWeightAtTier`, perk timeline, Wave Skip income recursion, static coin multiplier stack, timed UW/Golden Bot, CPW or Fetch.

It is therefore a compact pre-multiplier helper, not a substitute for `simulateResourceDropsCoins`. Its coin weight also comes from a different model basis than the wave-by-wave simulator.

### 3.9 Per-wave economy path

`forEachWaveEconRow` uses the same broad spawn context and `ordinaryCoinWeightAtTier`, but it is a distinct output path:

- `rawKillCoins = expectedKills × wave × coinWeightPerKill` (zero under the Intro Sprint cap).
- `waveCoins = coinsPerWaveMult × spawnFraction` (zero under the Intro Sprint cap).
- Cells, module shards and reroll shards are calculated through `computeWaveDropYield`.
- Wave Skip income recursion is explicitly applied to cells in this function.
- Boss and fleet shard handling uses separate Wave Skip resource-multiplier logic.
- The row path does not apply `baselineKillMult`, timed UW/Golden Bot, perk timeline coin multipliers, Fetch, or the per-wave kill/wave skip coin-income recursion shown in `simulate-wave-coins.ts`.

The economy rows therefore expose base coin quantities alongside resource yields; they are not final total coins. The totals fold these rows without adding the missing final coin multipliers.

## 4. Comparison of the four paths

| Component | Wave coin rows | Wave economy rows | Run coin result | Segment kill-yield helper |
|---|---|---|---|---|
| Spawn chart / Enemy Balance | Yes | Yes | Through wave coin rows | Yes |
| Explicit/account spawn-yield modes | Yes | Yes | Through wave coin rows | Optional |
| Coin weight source | Tier Wave Info mix | Tier Wave Info mix | Through wave coin rows | Save-measured average |
| Wave Skip spawn fraction | Yes | Yes | Yes, via rows | No |
| Skip coin income recursion | Kill + CPW | Not in coin fields | Via rows | No |
| Static kill multiplier stack | No | No | Yes | No |
| Timed UW / Golden Bot | No | No | Kill path only | No |
| Static CPW multiplier | Passed in | Passed in | Yes | No |
| Perk coin timeline | Yes | No | Via wave coin rows | No |
| Cells / shards | No | Yes | Not part of coin result | No |
| Fetch | No | No | Final separate addition | No |

## 5. Findings and review flags

### B6-01 — Different coin-weight sources

- Wave coin and wave economy simulators use `ordinaryCoinWeightAtTier`.
- Segment-wise helper uses save-derived `measuredAverageEnemyCoinWeight()`.
- Both are legitimate SDK model inputs, but they are not interchangeable. The helper must not be used as a direct validation oracle for wave coin rows without normalizing the coin-weight method.

**Status:** `CONFLICTING` model basis; preserve both with source and scope.

### B6-02 — Wave economy coin columns are pre-multiplier/base outputs

Wave economy rows do not apply the run-level kill stack, timed UW/Golden Bot, perk timeline, Fetch or the kill/CPW Wave Skip income recursion.

**Status:** `OBJECTIVE` about code path; callers must not interpret these columns as final run coin totals.

### B6-03 — Wave Skip summary field versus per-wave recursion

The multiplier breakdown exposes `waveSkipMult`, while the main coin result is computed from `spawnFraction` and recursive `waveSkipIncomeEv` values. The summary field is not the direct multiplier used by the final per-wave coin calculation.

**Status:** `OBJECTIVE` about code structure; no conclusion that the summary field is erroneous.

### B6-04 — Coin Bonus Enhancement double application

Same review flag from Batch 5: enhancement appears inside `globalMult` and again in `baselineKillMult`, but only once in CPW. Do not silently normalize this.

**Status:** `CONFLICTING` internal implementation review.

### B6-05 — Perk timeline has a strict input contract

The wave coin simulator validates:
- At most 4096 events.
- Sorted, unique, positive integer wave numbers up to 1,000,000.
- Finite multipliers at least 1.
- Timeline cannot be combined with non-neutral static all-coin perk level or the static trade-off perk flag.

The economy simulator does not process this timeline in its coin columns.

**Status:** `OBJECTIVE` about input validation and path coverage.

## 6. Testing and limitations

- Source files inspected and SHA values recorded.
- Runtime execution: `NOT TESTED`.
- Candidate unit-test paths attempted but returned 404; no assertion results are claimed.
- No live-game experiment.
- No canonical claims or relationships created.
- No SDK source was modified.
- No external fan-made formula comparison performed.
- SDK behavior is not treated as developer-confirmed game truth.

## 7. Recommended GKB representation

1. Store each output path with an explicit scope: `BASE_PER_WAVE`, `RUN_COIN_TOTAL`, `RESOURCE_ECONOMY`, or `SEGMENT_ESTIMATE`.
2. Record coin-weight model identity as part of every derived result.
3. Keep static kill multipliers, timed kill multipliers, CPW and Fetch as separate components.
4. Preserve Wave Skip spawn fraction and skipped-income recursion separately from the summary `waveSkipMult`.
5. Keep the Coin Bonus Enhancement double-application issue open until competing evidence is recorded.
6. Never label `WaveEconSimRow.rawKillCoins` or `waveCoins` as final coins without explicitly applying the missing stages.

## 8. Next priority

**Batch 7 — Multiplier Inputs, Perk Timeline & Fetch CPM Provenance**
1. Trace source tables and input normalization for each CPK/CPW component.
2. Trace Fetch run CPM construction and verify which pre-Fetch coin components enter it.
3. Compare `estimateFetchCoinsFromRunCpm` with the standalone Fetch EV model.
4. Inspect tests and provenance for static perk, timeline, GT+, BHD, and Bot coverage.
5. Preserve source disagreements and unknowns; do not promote claims without evidence.

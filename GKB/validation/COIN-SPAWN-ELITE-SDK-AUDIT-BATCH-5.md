# Batch 5 — Coin Multipliers, Ordinary Coin Weight, Spawn Yield & Elite Spawn Chart

**Audit target:** TheTowerSDK `0.14.1` mirrored under `TestAccount`  
**Repository implementation branch:** `GKB`  
**Source scope:** SDK source inspection only  
**Claim classification:** SDK implementation observations = `OBJECTIVE`; game-mechanic interpretation = `EXTERNAL-UNVERIFIED`  
**Runtime tests:** `NOT TESTED`  
**Canonical GKB claims/edges created:** None

## 1. Objective

Trace the coin reward multiplier pipeline and the upstream assumptions used to estimate ordinary enemy kills, enemies per wave, Wave Accelerator spawn caps, and elite spawn counts. Preserve model boundaries and identify internal inconsistencies without choosing an unsupported winner.

## 2. Source files inspected

All source files below were read from the `TestAccount` branch. SHA values identify the exact inspected blobs.

| Source | Blob SHA |
|---|---|
| `src/mechanics/resource-drops/coin-multipliers.ts` | `8370d15b9e66835a93b3c423a198d09ad723bcf9` |
| `src/mechanics/resource-drops/wave-ordinary-coin-weight.ts` | `9e0303145274f052a8835cfb41b98f7af683badb` |
| `src/mechanics/enemies/type-mix.ts` | `089b547b6c5e18f839ce0ef80b9bca7398dac66a` |
| `src/mechanics/waves/spawn-yield.ts` | `d39155c96198b3919ba08ae0084082fbf28fc7f9` |
| `src/mechanics/waves/spawn-tick-constants.ts` | `055eac781fcffc2f6b87aec81b188b7382238888` |
| `src/mechanics/waves/accelerator-spawn-rate-cap.ts` | `0115f05c91a55aee2e165d562ee684881940a734` |
| `src/mechanics/waves/spawn-type-chances-coin-mix.ts` | `57e1c6b538ced0fe714b57052e5b6118a0304c8f` |
| `src/mechanics/waves/base-empirical-scaling.ts` | `ff2fbfac1d48ed373aae2d4c983c8739016c039c` |
| `src/mechanics/waves/scaling-regression-profile.ts` | `131741c304644bc017c64216f87d25f65aa72717` |
| `src/mechanics/enemies/elite-spawn-chance.ts` | `317a4ccca9c7c0badd3244e42f4b244e6a27cc62` |
| `src/data/charts/data.ts` | `2e09125ba4063a39953f170cb8bada70ca2d4398` |
| `src/data/enemies/data.ts` | `8a6d2934c0478d998d3fe5ddf24b00ad128832be` |
| `src/mechanics/resource-drops/coin-fetch.ts` | `80a572f58addbb03651df755bdb1424adca962e7` |

## 3. Findings

### 3.1 Coin multiplier pipeline

**OBJECTIVE — SDK code behavior; game application EXTERNAL-UNVERIFIED.**

The inspected `buildResourceDropsCoinMultipliers` constructs separate components for:

- Campaign tier coin reward curve.
- Dissonance and Generator coin multipliers.
- Coin Bonus Enhancement.
- Coins card level and mastery.
- Theme passive and relic bonus.
- Pack/IAP toggles.
- Perk and trade-off perk bonuses.
- Coins/Kill Workshop and lab values.
- Module Coins/Kill bonus and Vault Coins/Kill skill.
- BHD Coins/Kill bonus.
- Coins/Wave Workshop and lab values.
- Wave Skip resource multiplier.
- Timed UW and Golden Bot uptime contributions, plus GT+.

The code computes a shared `globalMult` containing tier, dissonance, generator, Coin Bonus Enhancement, Coins card, theme, relic, pack, perk and trade-off factors.

**Potential internal inconsistency to review:** `baselineKillMult` multiplies `globalMult` by `coinBonusEnhancement` again, even though that factor is already included in `globalMult`. The Coins/Wave path uses `globalMult` once. This is a code-level observation, not proof that the game applies the enhancement twice or that the SDK is wrong. Keep it as a review item until the intended game formula and source history are checked.

The CPK core is built as:
`(workshopCoinsKillMult × coinsKillLabMult + moduleBonus) × vaultMult`,
then combined with the global factors and BHD bonus. This is not equivalent to multiplying every CPK-related value independently; the module bonus is added before the Vault multiplier in this implementation.

The timed UW model supports two assumptions:
- `assumeSynced = true`: overlaps are modeled as the product of active multipliers during the common overlap, with solo uptime contributions added.
- `assumeSynced = false`: uptime contributions are added independently.

These are alternative modeling assumptions, not evidence that UW activation windows are actually synchronized in a run.

### 3.2 Campaign tier coin reward curve

**OBJECTIVE — SDK table contents; game applicability EXTERNAL-UNVERIFIED.**

The SDK's `CAMPAIGN_COIN_REWARD_CURVE` is read directly by `empiricalTierCoinMultiplier`. The stored values are:

| Tier | Multiplier | Tier | Multiplier |
|---:|---:|---:|---:|
| T1 | 1 | T13 | 12.2 |
| T2 | 1.8 | T14 | 14.7 |
| T3 | 2.6 | T15 | 17.6 |
| T4 | 3.4 | T16 | 21.3 |
| T5 | 4.2 | T17 | 25.2 |
| T6 | 5 | T18 | 29.1 |
| T7 | 5.8 | T19 | 33 |
| T8 | 6.6 | T20 | 40 |
| T9 | 7.5 | T21 | 48 |
| T10 | 8.7 | T22 | 60 |
| T11 | 10.3 | T23 | 72 |
| T12 | 12.2 | T24 | 86 / 103* |

*Correction to the compact table above: exact source order is T1–T24 = 1, 1.8, 2.6, 3.4, 4.2, 5, 5.8, 6.6, 7.5, 8.7, 10.3, 12.2, 14.7, 17.6, 21.3, 25.2, 29.1, 33, 40, 48, 60, 72, 86, 103. Thus T12=12.2, T13=14.7, T14=17.6, T15=21.3, T16=25.2, T17=29.1, T18=33, T19=40, T20=48, T21=60, T22=72, T23=86, T24=103.*

The SDK comments that T22–T24 changed from 75/92/115 to 72/86/103 and says its values were checked against the in-game tier screen on 2026-08-16. That is a provenance statement inside the SDK source, not independently verified by this audit. Preserve it as an SDK-reported source note.

### 3.3 Ordinary enemy coin weight and save-derived type mix

**OBJECTIVE — stored constants and implementation; game mechanic EXTERNAL-UNVERIFIED.**

The SDK's base coin values are Basic=0, Fast=2, Tank=4, Ranged=2. Critical Coin is modeled as a separate expected Basic reward input by `wave-ordinary-coin-weight.ts`. Protector is assigned relative coin value 1 in that helper, but the tier-based ordinary coin mix sets Protector chance to 0 because the SDK treats it as spawn-gated rather than part of the ordinary random draw.

The current `MEASURED_ENEMY_TYPE_KILLS` constants are:
- Basic 109,691
- Fast 156,256
- Tank 147,353
- Ranged 138,923

The source describes these as measured counters from `test/playerInfo.dat`, waves 600–4875. It explicitly says Basic is the game's `totalEnemiesDestroyedNormalThisRound` counter, not a residual. It also says the named ordinary type counters do not account for all round kills; the unexplained remainder is not assigned to Basic.

**Internal inconsistency:** the `type-mix.ts` documentation says the measured average coin weight is 2.34. Applying the implementation's own current counts and base values (without Critical Coin) gives:
`(156256×2 + 147353×4 + 138923×2) / (109691+156256+147353+138923) ≈ 2.136`.
The comment and the currently stored values/function therefore do not agree. This report does not choose which one should be corrected.

A second route, `ordinaryCoinWeightAtTier`, derives the mix from fitted tier coefficients and the tier spawn-weight table. It is tier-dependent but explicitly does not vary by wave. The source comments say the per-wave fast/tank/ranged spawn formula is not modeled in this coin-mix helper. The model should not be described as a measured per-wave kill distribution.

### 3.4 Spawn yield and Wave Accelerator cap

**OBJECTIVE — SDK model structure; live spawn behavior EXTERNAL-UNVERIFIED.**

The default v29 calibrated spawn-yield constants are:
- 3 random Basic spawn call sites per tick.
- Gate pass rate 1.
- Separate double-spawn chance 0.25.
- Expected yield = 3 × 1 + 0.25 = 3.25 enemies per spawn tick.

The source says this 3.25 value is calibrated against a real save. The gate-based model is available as an opt-in alternative and is explicitly described as remaining opt-in until it reproduces the calibrated figure.

`killsPerWaveFromSpawnContext` combines expected yield per tick, enemy-balance multiplier and a Wave Accelerator chart-derived spawn cap. If `useSpawnGates` is enabled, the SDK offers two separate paths:
- Quantum v29 path, which estimates enemies per wave from wave length and gate thresholds.
- Legacy additive probe, which multiplies the chart cap by a per-tick expected yield.

The default path uses the calibrated per-tick yield. These modes are not interchangeable and should remain explicitly named in any GKB representation.

Wave Accelerator mastery maps to chart columns in 10% increments (level 0 → 10%, level 9 → 100%). The chart data has spawn-count rows 37, 39, 40, 42, 44, 46, 48, 49, 50, 52, 54 and 56. The cap function chooses the highest row whose mastery-adjusted wave threshold is reached; below the first threshold it scales linearly toward the first cap. This describes the SDK lookup algorithm, not an independently verified in-game spawn cap.

### 3.5 Elite Spawn Chance chart

**OBJECTIVE — SDK lookup and expected-value formulas; live spawn behavior EXTERNAL-UNVERIFIED.**

The SDK reads `ELITE_SPAWN_CHANCE_ROWS` from `src/data/charts/data.ts`. Each row carries a Double% value, a Single% value and tier-specific wave thresholds. The lookup selects the highest row whose threshold for the selected tier is not greater than the current wave.

The helper exposes distinct outputs:
- Single spawn percentage.
- Chart Double percentage.
- Effective Double percentage after Enemy Balance mastery.
- Expected elite kills per wave.
- Probability of 2+ elites.
- Next elite spawn-tier unlock.

The SDK applies Enemy Balance mastery as an additional double-spawn process. Its documented expected-value logic differs before and after the Single% reaches 100%:
- Before 100% Single: `pSingle × (1 + pEB)`.
- At 100% Single: `(1 + pEB) × (1 + pChartDouble)`.

The 2+ probability is a separate calculation and must not be substituted with expected elite count. A value such as expected elite kills per wave is an expectation, not a promise of an integer spawn count on a particular wave.

The elite chart table itself has no row-level source URL or publication metadata in the inspected `data.ts` file. The SDK source says it is the same table as its Elite Spawn Chance chart, but this audit did not independently retrieve or compare that chart against other fan-made sources.

### 3.6 Fetch coins

**OBJECTIVE — SDK implementation; underlying reward mechanic EXTERNAL-UNVERIFIED.**

`coin-fetch.ts` sets `FETCH_COIN_CPM_FRACTION = 0.002` and calculates Fetch coin expectation as expected Fetch procs × coin outcome weight × run CPM × 0.002. Its comment attributes the approximate 0.2% factor to community/wiki information. The SDK file does not identify a specific wiki page or dated evidence here. Keep the factor's provenance at community/wiki level, not as a developer-confirmed value.

## 4. Conflicts and review flags

| ID | Subject | Source A / observation | Source B / observation | Status |
|---|---|---|---|---|
| B5-01 | Coin Bonus Enhancement in baseline CPK multiplier | Included in `globalMult` | Multiplied again in `baselineKillMult` | `CONFLICTING` — internal implementation review |
| B5-02 | Measured ordinary enemy coin weight | `type-mix.ts` comment says 2.34 | Current constants + implementation calculate approximately 2.136 without Critical Coin | `CONFLICTING` — internal documentation/data mismatch |
| B5-03 | Spawn yield | Default calibrated path uses 3.25 enemies/tick | Gate-based / Quantum alternatives use different inputs and formulas | Separate model modes; not resolved as a factual disagreement |
| B5-04 | Elite chart provenance | SDK source says same table as site chart | Inspected raw table has no row-level source/date metadata | `EXTERNAL-UNVERIFIED`; provenance gap |

No external fan-made source comparison was completed in this batch. Therefore no external source winner is selected and no claim is promoted.

## 5. GKB handling recommendation

1. Preserve the multiplier components as separate source claims rather than flattening them into one universal formula.
2. Store the double Coin Bonus Enhancement application as an implementation review flag; do not silently correct it.
3. Preserve both 2.34 (SDK comment) and approximately 2.136 (recomputed from the current source constants/function) with their exact derivations.
4. Store calibrated, gate-based, Quantum and legacy additive spawn-yield modes as separate model variants.
5. Keep tier-based ordinary coin mix separate from save-derived kill distribution.
6. Preserve Elite chart values with SDK file provenance and an explicit missing row-level source/date note.
7. Keep Fetch's 0.2% coefficient tagged as community/wiki-derived and unverified.

## 6. Testing and limitations

- Source inspection completed.
- Runtime execution: `NOT TESTED`.
- SDK unit tests: not run in this audit.
- No live-game experiment performed.
- No canonical GKB claims or relationships created.
- No account-derived values promoted into universal GKB.
- No external fan-made chart comparison performed.
- The SDK's own statements about parity, calibration and in-game checks remain source assertions until independently assessed.

## 7. Next priority

**Batch 6 — Coin Simulation Integration & Formula Boundaries**
1. Trace `coin-simulation.ts`, `simulate-wave-coins.ts` and `simulate-wave-econ.ts` end-to-end.
2. Map the exact point where enemy counts, coin weight, Critical Coin, CPK, CPW, timed UW and Wave Skip enter the expected coin result.
3. Compare the single-wave, multi-wave and run-total paths for duplicated or omitted multipliers.
4. Preserve alternative spawn-yield inputs and source-specific assumptions.
5. Produce a compact formula map and a list of unresolved disagreements; do not create canonical claims until the foundation is reviewed.

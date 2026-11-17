import { describe, expect, it } from 'vitest'
import { buildWaveContext } from '../../src/mechanics/enemies/drops-wave-context'
import { simulateFetchDrops } from '../../src/mechanics/enemies/drops-simulation'
import { accumulateWaveCoin, simulateWaveCoinRows } from '../../src/mechanics/resource-drops/simulate-wave-coins'
import { accumulateWaveEcon } from '../../src/mechanics/resource-drops/simulate-wave-econ'
import { computeDurations, computeEffectiveCooldowns, computeUptimeRatio } from '../../src/mechanics/uptime/compute'
import type { UptimeCoreState } from '../../src/mechanics/uptime/types'
import { spawnYieldForWave } from '../../src/mechanics/resource-drops/coin-multipliers'
import { computeWaveDropYield } from '../../src/mechanics/resource-drops/wave-drop-yield'

describe('explicit resource equipment state', () => {
  it('UW kill-only timeline leaves wave payout unchanged and skipped income uses previous wave factors', () => {
    const input = baseCoinInput({ targetWave: 60, fetchActive: true })
    const baseRows = simulateWaveCoinRows(input, { coinsPerWaveMult: 1 })
    const timeline = [{ wave: 50, coinMultiplier: 1, killCoinMultiplier: 3 }]
    const rows = simulateWaveCoinRows({ ...input, perkCoinTimeline: timeline }, { coinsPerWaveMult: 1 })
    expect(rows[48]).toEqual(baseRows[48])
    expect(rows[49]!.skipKillCoins).toEqual(baseRows[49]!.skipKillCoins)
    expect(rows[49]!.rawKillCoins - rows[49]!.skipKillCoins)
      .toBeCloseTo(3 * (baseRows[49]!.rawKillCoins - baseRows[49]!.skipKillCoins), 8)
    expect(rows.map(row => row.waveCoins)).toEqual(baseRows.map(row => row.waveCoins))
    const base = simulateResourceDropsCoins(input)
    const boosted = simulateResourceDropsCoins({ ...input, perkCoinTimeline: timeline })
    expect(boosted.coins.coinsFromWavePayout).toEqual(base.coins.coinsFromWavePayout)
    expect(boosted.coins.coinsFromFetch).toBeGreaterThan(base.coins.coinsFromFetch)
    for (const invalid of [NaN, Infinity, .99]) expect(() => simulateResourceDropsCoins({ ...input,
      perkCoinTimeline: [{ wave: 1, coinMultiplier: 1, killCoinMultiplier: invalid }] })).toThrow(/Perk coin timeline/)
  })
  it('applies perk coin events only from their wave and weights Fetch once', () => {
    const input = baseCoinInput({ targetWave: 100, waveSkipActive: false, fetchActive: true })
    const baseline = simulateResourceDropsCoins(input)
    expect(simulateResourceDropsCoins({ ...input, perkCoinTimeline: [] })).toEqual(baseline)
    const delayedInput = { ...input, perkCoinTimeline: [{ wave: 50, coinMultiplier: 2 }] }
    const delayed = simulateResourceDropsCoins(delayedInput)
    expect(delayed.coins.totalCoins).toBeGreaterThan(baseline.coins.totalCoins)
    expect(delayed.coins.totalCoins).toBeLessThan(baseline.coins.totalCoins * 2)
    expect(delayed.coins.coinsFromFetch / baseline.coins.coinsFromFetch)
      .toBeCloseTo(delayed.coins.totalCoins / baseline.coins.totalCoins, 10)
    expect(accumulateWaveEcon(delayedInput).cells).toEqual(accumulateWaveEcon(input).cells)
    expect(accumulateWaveEcon(delayedInput).moduleShards).toEqual(accumulateWaveEcon(input).moduleShards)
    expect(simulateResourceDropsCoins({ ...input, perkCoinTimeline: [{ wave: 101, coinMultiplier: 9 }] })).toEqual(baseline)
  })
  it('skip EV on an event wave uses the previous wave coin factor', () => {
    const input = baseCoinInput({ targetWave: 60 })
    const base = simulateWaveCoinRows(input, { coinsPerWaveMult: 1 })
    const delayed = simulateWaveCoinRows({ ...input, perkCoinTimeline: [{ wave: 50, coinMultiplier: 2 }] }, { coinsPerWaveMult: 1 })
    expect(delayed[48]).toEqual(base[48])
    expect(delayed[49]!.skipKillCoins).toEqual(base[49]!.skipKillCoins)
    expect(delayed[49]!.skipWaveCoins).toEqual(base[49]!.skipWaveCoins)
    expect(delayed[49]!.rawKillCoins - delayed[49]!.skipKillCoins)
      .toBeCloseTo(2 * (base[49]!.rawKillCoins - base[49]!.skipKillCoins), 8)
  })
  it('rejects malformed or double-applied perk timelines', () => {
    for (const timeline of [[{ wave: 0, coinMultiplier: 1 }], [{ wave: 1.5, coinMultiplier: 1 }],
      [{ wave: 1_000_001, coinMultiplier: 1 }], [{ wave: 2, coinMultiplier: 2 }, { wave: 2, coinMultiplier: 3 }],
      [{ wave: 3, coinMultiplier: 2 }, { wave: 2, coinMultiplier: 3 }], [{ wave: 1, coinMultiplier: Infinity }],
      [{ wave: 1, coinMultiplier: .5 }]]) {
      expect(() => simulateResourceDropsCoins(baseCoinInput({ perkCoinTimeline: timeline }))).toThrow(/Perk coin timeline/)
    }
    expect(() => simulateResourceDropsCoins(baseCoinInput({ allCoinPerkLevel: 1, perkCoinTimeline: [] })))
      .toThrow('neutral static coin perks')
    expect(() => simulateResourceDropsCoins(baseCoinInput({ perkCoinTimeline: Array.from({ length: 4097 },
      (_, index) => ({ wave: index + 1, coinMultiplier: 1 })) }))).toThrow('exceeds 4096')
  })
  it('applies Generator main multiplier once to coins including Fetch, preserving other drops and legacy default', () => {
    const legacy = baseCoinInput({ fetchActive: true, targetWave: 100, dissonanceCoinMultiplier: 3 })
    const neutral = simulateResourceDropsCoins(legacy)
    expect(simulateResourceDropsCoins({ ...legacy, generatorCoinMultiplier: 1 })).toEqual(neutral)
    const coefficient = 4.25
    const boostedInput = { ...legacy, generatorCoinMultiplier: coefficient }
    const boosted = simulateResourceDropsCoins(boostedInput)
    expect(neutral.coins.coinsFromFetch).toBeGreaterThan(0)
    for (const key of ['totalCoins', 'coinsFromKills', 'coinsFromWavePayout', 'coinsFromFetch'] as const) {
      expect(boosted.coins[key] / neutral.coins[key]).toBeCloseTo(coefficient, 10)
    }
    const drops = accumulateWaveEcon(legacy)
    const boostedDrops = accumulateWaveEcon(boostedInput)
    for (const key of ['cells', 'skipCells', 'moduleShards', 'moduleShardsOneType', 'rerollShards'] as const) {
      expect(boostedDrops[key]).toEqual(drops[key])
    }
  })
  it('rejects nonfinite or subneutral Generator multipliers', () => {
    for (const value of [NaN, Infinity, -Infinity, 0, .99]) {
      expect(() => buildResourceDropsCoinMultipliers(baseCoinInput({ generatorCoinMultiplier: value })))
        .toThrow('Generator coin multiplier must be finite and at least 1')
    }
  })
  it('applies earned Dissonance to kill, wave and Fetch coins once without changing other drops', () => {
    const legacy = baseCoinInput({ fetchActive: true, targetWave: 100 })
    const neutral = simulateResourceDropsCoins(legacy)
    expect(simulateResourceDropsCoins({ ...legacy, dissonanceCoinMultiplier: 1 })).toEqual(neutral)
    const coefficient = 7.2076329569
    const boostedInput = { ...legacy, dissonanceCoinMultiplier: coefficient }
    const boosted = simulateResourceDropsCoins(boostedInput)
    expect(neutral.coins.coinsFromFetch).toBeGreaterThan(0)
    for (const key of ['totalCoins', 'coinsFromKills', 'coinsFromWavePayout', 'coinsFromFetch'] as const) {
      expect(boosted.coins[key] / neutral.coins[key]).toBeCloseTo(coefficient, 10)
    }
    const drops = accumulateWaveEcon(legacy)
    const boostedDrops = accumulateWaveEcon(boostedInput)
    for (const key of ['cells', 'skipCells', 'moduleShards', 'moduleShardsOneType', 'rerollShards'] as const) {
      expect(boostedDrops[key]).toEqual(drops[key])
    }
  })
  it('rejects invalid Dissonance coin multipliers instead of silently normalizing them', () => {
    for (const value of [NaN, Infinity, -Infinity, 0, 0.99]) {
      expect(() => buildResourceDropsCoinMultipliers(baseCoinInput({ dissonanceCoinMultiplier: value })))
        .toThrow('Dissonance coin multiplier must be finite and at least 1')
    }
  })
  it('inactive Enemy Balance also disables retained mastery in elite drops and account spawn bridges', () => {
    const retained = baseCoinInput({ enemyBalanceActive: false, enemyBalanceMasteryLevel: 9,
      useAccountSpawnYield: true, useSpawnGates: false })
    const noMastery = { ...retained, enemyBalanceMasteryLevel: -1 }
    expect(computeWaveDropYield(retained, 5000, 1, 1)).toEqual(computeWaveDropYield(noMastery, 5000, 1, 1))
    expect(spawnYieldForWave(retained, 5000)).toEqual(spawnYieldForWave(noMastery, 5000))
    expect(accumulateWaveCoin(retained, { coinsPerWaveMult: 1, maxRows: 1 }))
      .toEqual(accumulateWaveCoin(noMastery, { coinsPerWaveMult: 1, maxRows: 1 }))
    expect(accumulateWaveEcon(retained, { maxRows: 1 })).toEqual(accumulateWaveEcon(noMastery, { maxRows: 1 }))
    expect(computeWaveDropYield({ ...retained, enemyBalanceActive: true }, 5000, 1, 1).expectedEliteKills)
      .toBeGreaterThan(computeWaveDropYield(retained, 5000, 1, 1).expectedEliteKills)
  })
  it('Golden Bot coin uptime includes cooldown and duration labs without changing UW timing', () => {
    const uptime: UptimeCoreState = {
      mvnRarity: 'Disabled', mvnGt: false, mvnDw: false, mvnBh: false,
      gtCdLevel: 20, gtDurLevel: 32, gtDurLab: 20, gtCdStat: 'None', gtCdAssist: 'None', gtDurStat: 'None', gtDurAssist: 'None',
      bhCdLevel: 15, bhDurLevel: 21, bhCdStat: 'None', bhCdAssist: 'None', bhDurStat: 'None', bhDurAssist: 'None',
      dwCdLevel: 25, dwBaseWavesLevel: 4, dwCdStat: 'None', dwCdAssist: 'None', dwQtyStat: 'None', dwQtyAssist: 'None',
      slAngleLevel: 30, slQtyLevel: 3, slAngleStat: 'None', slAngleAssist: 'None',
      psCdLevel: null, psDurLevel: null, psCdStat: 'None', psCdAssist: 'None', psDurStat: 'None', psDurAssist: 'None',
      cfCdLevel: null, cfDurLevel: null, cfDurLab: 0, cfCdStat: 'None', cfCdAssist: 'None', cfDurStat: 'None', cfDurAssist: 'None',
      smCdLevel: null, smQtyLevel: null, smCdStat: 'None', smCdAssist: 'None', smQtyStat: 'None', smQtyAssist: 'None',
      ilmCdLevel: null, ilmCdStat: 'None', ilmCdAssist: 'None',
      gbCdLevel: 15, gbDurLevel: 30, gbCdLab: 0, gbDurLab: 0,
      abCdLevel: null, abDurLevel: null, abCdLab: 0, abDurLab: 0,
      bbCdLevel: null, bbDurLevel: null, bbCdLab: 0, bbDurLab: 0,
      fbCdLevel: null, fbDurLevel: null, fbCdLab: 0, tbCdLevel: null, tbDurLevel: null, tbCdLab: 0,
      wavesPerBoss: 10, compressor: 'Disabled', waLevel: 0, pkgChance: 0,
      assistEffPct: 0, tournament: false, bhPerk: false, cfDurPerk: false, dwPerk: false, smQtyPerk: false,
      uwBc: false, bcLabLevel: 0, summonCooldownLevel: null, summonDurationLevel: null,
      attackCooldownLevel: null, allyCooldownLevel: null, bountyCooldownLevel: null, fetchCooldownLevel: null,
      scoutCooldownLevel: null, scoutDurationLevel: null,
    }
    const baseInput = baseCoinInput({ uptime, useGoldenBotCoinBonus: true, goldenBotCoverageFraction: 0.5, goldenBotBonusLevel: 30 })
    const base = buildResourceDropsCoinMultipliers(baseInput)
    expect(base.gbUptimeRatio).toBe(35 / 75)
    const withLabs = { ...uptime, gbCdLab: 25, gbDurLab: 10 }
    const enhanced = buildResourceDropsCoinMultipliers({ ...baseInput, uptime: withLabs })
    expect(enhanced.gbUptimeRatio).toBe(computeUptimeRatio(computeDurations(withLabs).gb, computeEffectiveCooldowns(withLabs).gb))
    expect(enhanced.gbUptimeRatio).toBeGreaterThan(base.gbUptimeRatio)
    expect(enhanced.expectedTimedKillMult).toBeGreaterThan(base.expectedTimedKillMult)
    for (const key of ['gtUptimeRatio', 'bhUptimeRatio', 'dwUptimeRatio', 'slUptimeRatio'] as const)
      expect(enhanced[key]).toBe(base[key])
  })
  it('disabled cards are neutral despite retained owned levels and mastery', () => {
    const input = baseCoinInput({ coinsCardLevel: 7, coinsCardMastery: 9,
      enemyBalanceCardLevel: 7, enemyBalanceMasteryLevel: 9,
      waveSkipCardLevel: 7, waveSkipMasteryLevel: 9,
      coinsCardActive: false, enemyBalanceActive: false, waveSkipActive: false })
    const context = buildWaveContext(input)
    const mult = buildResourceDropsCoinMultipliers(input)
    expect(context.enemyBalanceMult).toBe(1)
    expect(context.waveSkipSkipChance).toBe(0)
    expect(context.waveSkipMasteryDoubleChance).toBe(0)
    expect(context.waveSkipResourceMult).toBe(1)
    expect(mult.coinsCardMult).toBe(1)
    expect(mult.waveSkipMult).toBe(1)
    expect(accumulateWaveCoin(input, { coinsPerWaveMult: mult.coinsPerWaveMult }).skipKillCoins).toBe(0)
    expect(accumulateWaveCoin(input, { coinsPerWaveMult: mult.coinsPerWaveMult }).skipWaveCoins).toBe(0)
    expect(accumulateWaveEcon(input).skipCells).toBe(0)
  })
  it('disabled Fetch produces no loot or Fetch coins at any retained level', () => {
    const input = baseCoinInput({ fetchActive: false, fetchCooldownLevel: 10,
      fetchFindChanceLevel: 10, fetchDoubleFindLevel: 10 })
    expect(Object.values(simulateFetchDrops(input)).every(value => value === 0)).toBe(true)
    expect(simulateResourceDropsCoins(input).coins.coinsFromFetch).toBe(0)
    expect(simulateResourceDropsCoins({ ...input, fetchActive: true }).coins.coinsFromFetch).toBeGreaterThan(0)
  })
  it('omitted flags preserve existing active calculations exactly', () => {
    const legacy = baseCoinInput({ coinsCardLevel: 7, enemyBalanceCardLevel: 7, waveSkipCardLevel: 7 })
    const explicit = { ...legacy, coinsCardActive: true, enemyBalanceActive: true,
      waveSkipActive: true, fetchActive: true }
    expect(simulateResourceDropsCoins(legacy)).toEqual(simulateResourceDropsCoins(explicit))
    expect(accumulateWaveEcon(legacy)).toEqual(accumulateWaveEcon(explicit))
    expect(simulateFetchDrops(legacy)).toEqual(simulateFetchDrops(explicit))
  })
})

/**
 * Example multipliers from the site's coin guide, inlined so this test does not
 * depend on site content. If the guide changes these, this test is measuring a
 * scenario the guide no longer describes -- update both together.
 */
const COIN_GUIDE_MULTIPLIER_EXAMPLE = {
  blackHoleMultiplier: 11,
  goldenTowerMultiplier: 20.75,
  combinedMultiplier: 228.25,
} as const
import { computePackCoinMultFromIapToggles, RESOURCE_DROPS_COIN_IAP_MULTIPLIERS } from '../../src/mechanics/resource-drops/coin-iap'
import { moduleCoinsKillBonusFromSubstats } from '../../src/mechanics/resource-drops/coin-module-cpk'
import { allCoinBonusesPerkMult } from '../../src/mechanics/resource-drops/coin-perks'
import {
  accumulateResourceDropsKillYields,
  buildResourceDropsCoinMultipliers,
  coinBonusEnhancementMult,
  computeGoldenTowerCoinMult,
  expectedTimedCoinKillMult,
  RESOURCE_DROPS_AVG_ENEMY_COIN_WEIGHT,
  RESOURCE_DROPS_ENEMIES_PER_SPAWN_TICK,
  type ResourceDropsCoinSimulationInput,
  simulateResourceDropsCoins,
  themePassiveCoinMult,
  themePassiveCoinMultFromBonusPct,
} from '../../src/mechanics/resource-drops/coin-simulation'
import {
  enemySpawnRateCapFromWaveAcceleratorChart,
  findWaveAcceleratorMasteryForSpawnCap,
} from '../../src/mechanics/waves/accelerator-spawn-rate-cap'

export function baseCoinInput(overrides: Partial<ResourceDropsCoinSimulationInput> = {}): ResourceDropsCoinSimulationInput {
  return {
    tier: 1,
    targetWave: 100,
    enemyBalanceCardLevel: 1,
    enemyBalanceMasteryLevel: 0,
    waveSkipCardLevel: 1,
    waveSkipMasteryLevel: 0,
    waveAcceleratorMasteryLevel: -1,
    commonDropLabLevel: 0,
    rareDropLabLevel: 0,
    rerollShardsLabLevel: 0,
    shatterShardsLabLevel: 0,
    deathWaveCellsBonusLevel: 0,
    cellsPerKillBonusLevel: 0,
    shatterCommonModules: true,
    shatterRareModules: false,
    fetchCooldownLevel: 1,
    fetchFindChanceLevel: 1,
    fetchDoubleFindLevel: 1,
    wavesPerBoss: 10,
    averageWaveSeconds: 30,
    coinsKillWorkshopLevel: 0,
    coinsWaveWorkshopLevel: 0,
    coinBonusEnhancementLevel: 0,
    coinsKillLabLevel: 0,
    coinsWaveLabLevel: 0,
    gtBonusLabLevel: 0,
    bhCoinLabLevel: 0,
    dwCoinLabLevel: 0,
    slCoinLabLevel: 0,
    coinsCardLevel: 1,
    coinsCardMastery: 0,
    themeCoinBonusPct: 0,
    relicCoinBonusPct: 0,
    iapToggles: { hasStarterPack: false, hasEpicPack: false, hasDisableAds: false },
    moduleCoinsKillBonus: 0,
    vaultCoinskillLevel: 0,
    allCoinPerkLevel: 0,
    standardPerkBonusPct: 0,
    hasCoinTradeOffPerk: false,
    improveTradeOffLabPct: 0,
    introSprintZeroCoinWaveCap: 0,
    bhdCpkBonusPct: 0,
    gtPlusLevel: 0,
    goldenBotCoverageFraction: 1,
    goldenBotBonusLevel: 0,
    useGoldenBotCoinBonus: false,
    assumeSyncedUwCoinWindows: true,
    uwLevels: {
      gtMultiplierLevel: 0,
      gtCdLevel: 0,
      gtDurLevel: 0,
      gtCdLab: 0,
      gtDurLab: 0,
      bhCdLevel: 0,
      bhDurLevel: 0,
      bhCdLab: 0,
      bhDurLab: 0,
      dwCdLevel: 0,
      dwQtyLevel: 0,
      slCdLevel: 0,
      slQtyLevel: 0,
      slAngleLevel: 0,
    },
    botLevels: {
      gbBonusLevel: 0,
      gbCdLevel: 0,
      gbDurLevel: 0,
      gbCdLab: 0,
      gbDurLab: 0,
    },
    uptime: null,
    ...overrides,
  }
}

describe('resource-drops-coin-simulation', () => {
  it('coin bonus enhancement caps at 3× at level 200', () => {
    expect(coinBonusEnhancementMult(0)).toBe(1)
    expect(coinBonusEnhancementMult(200)).toBe(3)
    expect(coinBonusEnhancementMult(250)).toBe(3)
  })

  it('theme passive accepts collective bonus pct', () => {
    expect(themePassiveCoinMultFromBonusPct(15)).toBeCloseTo(1.15, 6)
    expect(themePassiveCoinMult({
      themeCoinBonusPct: 15,
      towerThemesOwned: 10,
      backgroundThemesOwned: 5,
      menuThemesOwned: 4,
      guardianThemesOwned: 2,
    })).toBeCloseTo(1.15, 6)
  })

  it('IAP toggles multiply to 9× when all owned', () => {
    expect(computePackCoinMultFromIapToggles({
      hasStarterPack: true,
      hasEpicPack: true,
      hasDisableAds: true,
    })).toBe(
      RESOURCE_DROPS_COIN_IAP_MULTIPLIERS.starterPack
      * RESOURCE_DROPS_COIN_IAP_MULTIPLIERS.epicPack
      * RESOURCE_DROPS_COIN_IAP_MULTIPLIERS.disableAds,
    )
  })

  it('module coins-per-kill substat uses assist substat efficiency', () => {
    expect(moduleCoinsKillBonusFromSubstats(0.4, 0.4, 25, 30)).toBeCloseTo(0.4 + 0.4 * 0.56, 6)
  })

  it('all coin perk stacks multiplicatively', () => {
    expect(allCoinBonusesPerkMult(5, 0)).toBeCloseTo(1.75, 6)
  })

  it('synced BH × GT timed mult matches guide example shape', () => {
    const timed = expectedTimedCoinKillMult({
      gtCoinMult: COIN_GUIDE_MULTIPLIER_EXAMPLE.goldenTowerMultiplier,
      bhCoinMult: COIN_GUIDE_MULTIPLIER_EXAMPLE.blackHoleMultiplier,
      dwCoinMult: 1,
      slCoinMult: 1,
      goldenBotMult: 1,
      gtUptimeRatio: 0.25,
      bhUptimeRatio: 0.25,
      dwUptimeRatio: 0,
      slUptimeRatio: 0,
      gbUptimeRatio: 0,
    }, true)
    expect(timed).toBeGreaterThan(COIN_GUIDE_MULTIPLIER_EXAMPLE.combinedMultiplier * 0.15)
  })

  it('BH coin lab reaches x11 at level 20', () => {
    const mults = buildResourceDropsCoinMultipliers(baseCoinInput({
      bhCoinLabLevel: 20,
      uptime: null,
    }))
    expect(mults.bhCoinMult).toBeCloseTo(11, 1)
  })

  it('higher CPK workshop increases total coins monotonically at fixed wave', () => {
    const low = simulateResourceDropsCoins(baseCoinInput({ coinsKillWorkshopLevel: 0 }))
    const high = simulateResourceDropsCoins(baseCoinInput({ coinsKillWorkshopLevel: 100 }))
    expect(high.coins.totalCoins).toBeGreaterThan(low.coins.totalCoins)
  })

  it('wave skip increases total coin estimate', () => {
    const base = simulateResourceDropsCoins(baseCoinInput({ waveSkipCardLevel: 1, waveSkipMasteryLevel: 0 }))
    const skipped = simulateResourceDropsCoins(baseCoinInput({ waveSkipCardLevel: 7, waveSkipMasteryLevel: 9 }))
    expect(skipped.coins.totalCoins).toBeGreaterThan(base.coins.totalCoins)
  })

  it('high wave skip total coins exceed low wave skip at fixed wave', () => {
    const low = simulateResourceDropsCoins(baseCoinInput({
      tier: 20,
      targetWave: 100,
      waveSkipCardLevel: 1,
      waveSkipMasteryLevel: 0,
    }))
    const high = simulateResourceDropsCoins(baseCoinInput({
      tier: 20,
      targetWave: 100,
      waveSkipCardLevel: 7,
      waveSkipMasteryLevel: 9,
    }))
    expect(high.coins.totalCoins).toBeGreaterThan(low.coins.totalCoins)
    expect(high.coins.coinsFromWavePayoutWaveSkipBonus).toBeGreaterThan(0)
  })

  it('GT stone multiplier level increases golden tower coin mult', () => {
    expect(computeGoldenTowerCoinMult(0, 0)).toBeGreaterThanOrEqual(5)
    expect(computeGoldenTowerCoinMult(20, 0)).toBeGreaterThan(computeGoldenTowerCoinMult(0, 0))
  })

  it('accumulateResourceDropsKillYields matches per-wave brute force', () => {
    function bruteForce(input: {
      targetWave: number
      enemyBalanceMult: number
      waveAcceleratorMastery: number | null
      introSprintZeroCoinWaveCap: number
    }) {
      let totalKills = 0
      let rawKillCoins = 0
      for (let wave = 1; wave <= input.targetWave; wave += 1) {
        const cap = enemySpawnRateCapFromWaveAcceleratorChart({
          wave,
          waveAcceleratorMastery: input.waveAcceleratorMastery,
        })
        
        // several per tick. This brute force exists to check the segment-wise
        // sum against a per-wave loop, so it has to carry the same factor.
        const kills = cap * input.enemyBalanceMult * RESOURCE_DROPS_ENEMIES_PER_SPAWN_TICK
        totalKills += kills
        if (wave <= input.introSprintZeroCoinWaveCap) continue
        rawKillCoins += kills * wave * RESOURCE_DROPS_AVG_ENEMY_COIN_WEIGHT
      }
      return { totalKills, rawKillCoins }
    }

    for (const targetWave of [100, 4786, 50_000, 500_000]) {
      for (const mastery of [null, 0, 5, 9] as const) {
        const waMastery = findWaveAcceleratorMasteryForSpawnCap(mastery)
        const payload = {
          targetWave,
          enemyBalanceMult: 1.25,
          waveAcceleratorMastery: waMastery,
          introSprintZeroCoinWaveCap: mastery === 5 ? 120 : 0,
        }
        const fast = accumulateResourceDropsKillYields(payload)
        const slow = bruteForce(payload)
        expect(fast.totalKills).toBeCloseTo(slow.totalKills, 6)
        // Relative, not absolute: these totals reach 1e13, where an absolute
        // tolerance of 1e-3 is below the float64 spacing and fails on rounding
        // alone. The claim is that the segment sum and the loop agree, not that
        // they agree to a fixed number of decimal places at any magnitude.
        expect(Math.abs(fast.rawKillCoins - slow.rawKillCoins) / Math.max(1, slow.rawKillCoins))
          .toBeLessThan(1e-12)
      }
    }
  })
})

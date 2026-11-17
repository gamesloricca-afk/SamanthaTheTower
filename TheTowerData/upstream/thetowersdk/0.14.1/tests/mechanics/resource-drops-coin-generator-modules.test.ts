import { describe, expect, it } from 'vitest'

import {
  blackHoleDigestorCpkBonusPct,
  compressorRarityFromGeneratorUnique,
  computeGeneratorUniqueRarityBonus,
  expectedFreeUpgradesPerWave,
  generatorUniqueTemplateFromEffectId,
  goldenBotCoverageWithSingularityHarness,
  singularityHarnessRangeBonusMeters,
} from '../../src/mechanics/resource-drops/coin-generator-modules'
import { estimateFetchCoinsFromRunCpm } from '../../src/mechanics/resource-drops/coin-fetch'
import { introSprintZeroCoinFraction, introSprintZeroCoinWaveCap } from '../../src/mechanics/resource-drops/coin-intro-sprint'
import { coinTradeOffPerkMult } from '../../src/mechanics/resource-drops/coin-trade-off'
import { simulateResourceDropsCoins } from '../../src/mechanics/resource-drops/coin-simulation'
import { baseCoinInput } from './resource-drops-coin-simulation.test'

describe('resource-drops-coin-generator-modules', () => {
  it('maps save effect ids to generator unique templates', () => {
    expect(generatorUniqueTemplateFromEffectId(1409)).toBe('black-hole-digestor')
    expect(generatorUniqueTemplateFromEffectId(1411)).toBe('galaxy-compressor')
    expect(generatorUniqueTemplateFromEffectId(1412)).toBe('singularity-harness')
  })

  it('resolves BHD and SH rarity bonuses', () => {
    expect(computeGeneratorUniqueRarityBonus('black-hole-digestor', 'Ancestral')).toBe(10)
    expect(singularityHarnessRangeBonusMeters('Mythic')).toBe(11)
    expect(blackHoleDigestorCpkBonusPct(10, 2)).toBe(20)
  })

  it('maps GComp rarity to uptime compressor tier', () => {
    expect(compressorRarityFromGeneratorUnique('Mythic')).toBe('Mythic')
  })

  it('extends golden bot coverage when SH bonus is present', () => {
    const base = goldenBotCoverageWithSingularityHarness('20M', 60, 0)
    const withSh = goldenBotCoverageWithSingularityHarness('20M', 60, 15)
    expect(withSh).toBeGreaterThan(base)
  })
})

describe('resource-drops-coin trade-off and intro sprint', () => {
  it('scales coin trade-off perk with improve lab', () => {
    expect(coinTradeOffPerkMult(false, 10)).toBe(1)
    expect(coinTradeOffPerkMult(true, 0)).toBeCloseTo(1.8, 6)
    expect(coinTradeOffPerkMult(true, 10)).toBeCloseTo(1.98, 6)
  })

  it('computes intro sprint zero-coin fraction', () => {
    expect(introSprintZeroCoinWaveCap({ cardLevel: 7, cardMastery: 0, active: true })).toBe(180)
    expect(introSprintZeroCoinWaveCap({ cardLevel: 7, cardMastery: -1, active: true })).toBe(100)
    expect(introSprintZeroCoinFraction(50, 200)).toBeCloseTo(0.25, 6)
  })
})

describe('resource-drops-coin simulation extensions', () => {
  it('adds fetch coins from run CPM', () => {
    const fetchCoins = estimateFetchCoinsFromRunCpm({
      enemyDrops: baseCoinInput(),
      runCoinTotalBeforeFetch: 1_000_000,
      runDurationMinutes: 50,
    })
    expect(fetchCoins).toBeGreaterThan(0)
  })

  it('BHD increases kill coins when equipped', () => {
    const base = simulateResourceDropsCoins(baseCoinInput({ bhdCpkBonusPct: 0 }))
    const withBhd = simulateResourceDropsCoins(baseCoinInput({ bhdCpkBonusPct: 30 }))
    expect(withBhd.coins.coinsFromKills).toBeGreaterThan(base.coins.coinsFromKills)
  })

  it('intro sprint reduces early-wave coin income', () => {
    const full = simulateResourceDropsCoins(baseCoinInput({ introSprintZeroCoinWaveCap: 0, targetWave: 500 }))
    const sprint = simulateResourceDropsCoins(baseCoinInput({ introSprintZeroCoinWaveCap: 100, targetWave: 500 }))
    expect(sprint.coins.coinsFromKills).toBeLessThan(full.coins.coinsFromKills)
  })

  it('free upgrades increase BHD contribution via context fields', () => {
    expect(expectedFreeUpgradesPerWave({ freeUpgradesEnhancementLevel: 20, freeUpgradePerkQty: 3 }))
      .toBeGreaterThan(expectedFreeUpgradesPerWave({ freeUpgradesEnhancementLevel: 0, freeUpgradePerkQty: 0 }))
  })
})

import { describe, expect, it } from 'vitest'
import { criticalCoinExpectedBasePerBasicKill, cellsPerEliteAfterCard,
  ordinaryCoinWeightFromSpawnChances, computeWaveDropYield, simulateWaveEconRows, accumulateWaveEcon,
  buildResourceDropsCoinMultipliers, simulateResourceDropsCoins } from '../../src/mechanics'
import { baseCoinInput } from './resource-drops-coin-simulation.test'

describe('per-kill resource cards before Wave Skip folding', () => {
  it('requires Coins mastery ownership independently of L7 and applies L0 or L9 exactly once', () => {
    const base = baseCoinInput({ coinsCardLevel: 7, coinsCardMastery: -1, fetchActive: true })
    expect(buildResourceDropsCoinMultipliers(base).coinsCardMult).toBe(1.45)
    expect(buildResourceDropsCoinMultipliers({ ...base, coinsCardMastery: 0 }).coinsCardMult).toBeCloseTo(1.4935, 12)
    expect(buildResourceDropsCoinMultipliers({ ...base, coinsCardMastery: 9 }).coinsCardMult).toBeCloseTo(1.885, 12)
    expect(buildResourceDropsCoinMultipliers({ ...base, coinsCardMastery: 9, coinsCardActive: false }).coinsCardMult).toBe(1)
    const plain = simulateResourceDropsCoins(base)
    const mastered = simulateResourceDropsCoins({ ...base, coinsCardMastery: 9 })
    for (const key of ['coinsFromKills', 'coinsFromWavePayout', 'coinsFromFetch', 'totalCoins'] as const)
      expect(mastered.coins[key]).toBeCloseTo(plain.coins[key] * 1.3, 7)
    const drops = accumulateWaveEcon(base)
    const masteredDrops = accumulateWaveEcon({ ...base, coinsCardMastery: 9 })
    for (const key of ['cells', 'skipCells', 'moduleShards', 'moduleShardsOneType', 'rerollShards'] as const)
      expect(masteredDrops[key]).toBe(drops[key])
    for (const level of [-2, .5, 10, NaN, Infinity])
      expect(() => buildResourceDropsCoinMultipliers({ ...base, coinsCardMastery: level })).toThrow('Coins mastery level')
  })
  it('uses absolute elite chart slots: base Enemy Balance cannot multiply .04 or the two-slot cap', () => {
    // T20/W100: 4% single slot. Saturated W4786: two guaranteed slots.
    // L9 EB mastery duplicates each slot with 60% probability; the base card
    // does not turn either absolute count into an ordinary-spawn proportion.
    for (const ordinaryMultiplier of [1, 1.3, 1.8]) {
      const noMastery = baseCoinInput({ tier: 20, enemyBalanceMasteryLevel: -1 })
      const mastery = { ...noMastery, enemyBalanceMasteryLevel: 9 }
      expect(computeWaveDropYield(noMastery, 100, ordinaryMultiplier, 1).expectedEliteKills).toBeCloseTo(.04, 12)
      expect(computeWaveDropYield(mastery, 100, ordinaryMultiplier, 1).expectedEliteKills).toBeCloseTo(.064, 12)
      expect(computeWaveDropYield(noMastery, 4786, ordinaryMultiplier, 1).expectedEliteKills).toBe(2)
      expect(computeWaveDropYield(mastery, 4786, ordinaryMultiplier, 1).expectedEliteKills).toBe(3.2)
    }
  })
  it('leaves elite cells independent of base card level while mastery and skip rewards apply once', () => {
    const base = baseCoinInput({ tier: 20, enemyBalanceMasteryLevel: -1 })
    const normal = computeWaveDropYield(base, 100, 1, 1)
    const moreOrdinary = computeWaveDropYield({ ...base, enemyBalanceCardLevel: 7 }, 100, 1.8, 1)
    expect(moreOrdinary).toEqual(normal)
    const mastery = computeWaveDropYield({ ...base, enemyBalanceMasteryLevel: 9 }, 100, 1.8, 1)
    expect(mastery.cells).toBeCloseTo(normal.cells * 1.6, 12)
    const skipped = computeWaveDropYield(base, 100, 1.8, 3)
    expect(skipped.cells).toBeCloseTo(normal.cells * 3, 12)
    expect(skipped.expectedEliteKills).toBeCloseTo(.04, 12)
  })
  it('uses Basic zero without a card and .33 times2=.66 only for eligible Basic kills', () => {
    expect(criticalCoinExpectedBasePerBasicKill()).toBe(0)
    const card = { criticalCoinChance: .33, criticalCoinDoubleChance: 1, criticalEligibleKillFraction: 1 }
    expect(criticalCoinExpectedBasePerBasicKill(card)).toBe(.66)
    expect(criticalCoinExpectedBasePerBasicKill({ ...card, criticalEligibleKillFraction: .5 })).toBe(.33)
    expect(ordinaryCoinWeightFromSpawnChances({ Basic: 1, Fast: 0, Tank: 0, Ranged: 0 })).toBe(0)
    expect(ordinaryCoinWeightFromSpawnChances({ Basic: 1, Fast: 0, Tank: 0, Ranged: 0 }, card)).toBe(.66)
    expect(ordinaryCoinWeightFromSpawnChances({ Basic: 1, Fast: 0, Tank: 1, Ranged: 0 }, card)).toBe(2.33)
    expect(ordinaryCoinWeightFromSpawnChances({ Basic: 0, Fast: 0, Tank: 1, Ranged: 0 }, card)).toBe(4)
  })
  it('adds Cells14 last: 100 times1.32 plus14 is146, not150.48 or a per-wave grant', () => {
    expect(cellsPerEliteAfterCard(100)).toBe(100)
    expect(cellsPerEliteAfterCard(100, { cellsCardMasteryMultiplier: 1.32, cellsCardFlatBonus: 14 })).toBe(146)
    expect(cellsPerEliteAfterCard(0, { cellsCardFlatBonus: 14 })).toBe(14)
    const base = baseCoinInput({ tier: 21, targetWave: 100 })
    const plain = computeWaveDropYield(base, 100, 1, 1)
    const card = computeWaveDropYield({ ...base, cellsCardFlatBonus: 14, cellsCardMasteryMultiplier: 1.32 }, 100, 1, 1)
    expect(card.cells).toBeCloseTo(plain.cells * 1.32 + plain.expectedEliteKills * 14, 10)
    expect(card.rerollShards).toBe(plain.rerollShards)
  })
  it('applies card rewards before skip EV and preserves the same streamed/accumulated totals', () => {
    const base = baseCoinInput({ tier: 21, targetWave: 100, waveSkipCardLevel: 7, waveSkipMasteryLevel: 9 })
    const plain = simulateWaveEconRows(base)
    const cardInput = { ...base, cellsCardFlatBonus: 14, cellsCardMasteryMultiplier: 1.32 }
    const card = simulateWaveEconRows(cardInput)
    expect(card.at(-1)!.skipCells).toBeGreaterThan(plain.at(-1)!.skipCells)
    expect(accumulateWaveEcon(cardInput).cells).toBeCloseTo(card.reduce((sum, row) => sum + row.cells, 0), 8)
    expect(card.map(row => row.rawKillCoins)).toEqual(plain.map(row => row.rawKillCoins))
  })
  it('rejects nonfinite or invalid fractions rather than crediting unearned rewards', () => {
    for (const value of [-1, 1.01, NaN, Infinity]) expect(() => criticalCoinExpectedBasePerBasicKill({
      criticalCoinChance: value })).toThrow('FRACTION_INVALID')
    expect(() => cellsPerEliteAfterCard(100, { cellsCardMasteryMultiplier: .5 })).toThrow('INPUT_INVALID')
    expect(() => cellsPerEliteAfterCard(Number.MAX_VALUE, { cellsCardMasteryMultiplier: 2 })).toThrow('OVERFLOW')
  })
})

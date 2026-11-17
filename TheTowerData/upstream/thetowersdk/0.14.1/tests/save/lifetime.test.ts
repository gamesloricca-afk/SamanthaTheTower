import { describe, expect, it } from 'vitest'
import {
  readLifetimeFromSaveRoot,
  saveValueToNumericString,
} from '../../src/save/lifetime/read'

describe('lifetime-from-save', () => {
  it('maps lifetime fields from save root values', () => {
    const extract = readLifetimeFromSaveRoot({
      gameStartedDate: { __value: '2021-08-30T00:00:00' },
      totalCoinsEarned: { __type: 'BigInt', __value: '1500000000' },
      totalCashEarned: 250000,
      totalStonesEarned: 1200,
      totalKeysEarned: 45,
      totalCellsEarned: 300,
      moduleRerollCurrencyLifetime: 88,
      totalDamageDealt: { mantissa: 9.5, exponent: 15 },
      totalEnemiesDestroyed: 1234567,
      totalWavesCompleted: 89012,
      totalUpgradesBought: 4000,
      totalWorkshopUpgradesBought: 2100,
      totalCoinsSpentWorkshop: { __type: 'BigInt', __value: '900000000' },
      researchesComplete: 180,
      totalCoinsSpentOnResearch: 50000000,
      totalFreeAttackUpgrades: 10,
      totalFreeDefenseUpgrades: 5,
      totalFreeUtilityUpgrades: 3,
      totalCashEarnedFromInterest: 75000,
      totalEnemiesDestryoedByOrbs: 1200,
      totalEnemiesDestroyedByDeathRay: 800,
      totalDamageByThorn: 450000,
      totalWavesSkipped: 42,
    })

    expect(extract).not.toBeNull()
    expect(extract?.values.gameStarted).toBe('2021-08-30')
    expect(extract?.values.coinsEarned).toBe('1.5B')
    expect(extract?.values.cashEarned).toBe('250K')
    expect(extract?.values.freeUpgrades).toBe('18')
    expect(extract?.values.cellsEarned).toBe('300')
    expect(extract?.values.recentCoinsPerHour).toBe('0')
    expect(extract?.warnings.some(warning => warning.includes('Recent Coins Per Hour'))).toBe(false)
    expect(extract?.values.labCoinsSpent).toBe('50M')
  })

  it('prefers totalCellsEarned_v2 over the legacy int field', () => {
    const extract = readLifetimeFromSaveRoot({
      gameStartedDate: { __value: '2021-08-30T00:00:00' },
      totalCoinsEarned: 1,
      totalCellsEarned: 42,
      totalCellsEarned_v2: 1_690_000_000,
    })

    expect(extract?.values.cellsEarned).toBe('1.69B')
  })

  it('falls back to totalCellsEarned when the v2 field is absent', () => {
    const extract = readLifetimeFromSaveRoot({
      gameStartedDate: { __value: '2021-08-30T00:00:00' },
      totalCoinsEarned: 1,
      totalCellsEarned: 300,
    })

    expect(extract?.values.cellsEarned).toBe('300')
  })

  it('parses gameStartedDate from .NET DateTime tick values', () => {
    const ms = new Date(2021, 7, 30, 12).getTime()
    const ticks = (BigInt(ms) * 10000n) + 621355968000000000n
    const extract = readLifetimeFromSaveRoot({
      gameStartedDate: { __value: ticks.toString() },
      totalCoinsEarned: 1,
      totalCashEarned: 1,
      totalStonesEarned: 1,
    })
    expect(extract?.values.gameStarted).toBe('2021-08-30')
  })

  it('formats small numeric values without notation', () => {
    expect(saveValueToNumericString(42)).toBe('42')
    expect(saveValueToNumericString('1,250')).toBe('1.25K')
  })

  it('returns null when no lifetime fields are present', () => {
    expect(readLifetimeFromSaveRoot({ userName: 'tester' })).toBeNull()
  })

  it('infers recentCoinsPerHour from battle history instead of warning', () => {
    const extract = readLifetimeFromSaveRoot({
      gameStartedDate: { __value: '2021-08-30T00:00:00' },
      totalCoinsEarned: 1,
      battleHistory: {
        _items: [
          { tier: 1, coinsEarned: 100, realTime: 3600 },
          { tier: 1, coinsEarned: 900, realTime: 3600 },
          { tier: 1, coinsEarned: 400, realTime: 3600 },
          { tier: 1, coinsEarned: 500, realTime: 3600 },
        ],
      },
    })

    // Best three rates 900, 500, 400 → mean 600 (same as computeCoinsPerHourFromSaveRoot).
    expect(extract?.values.recentCoinsPerHour).toBe('600')
    expect(extract?.warnings.some(warning => warning.includes('Recent Coins Per Hour'))).toBe(false)
  })
})

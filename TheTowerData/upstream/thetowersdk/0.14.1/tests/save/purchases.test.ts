import { describe, expect, it } from 'vitest'
import { readPurchasesFromSaveRoot } from '../../src/save'

describe('explicit permanent purchase flags', () => {
  it('preserves true and false independently', () => {
    expect(readPurchasesFromSaveRoot({ starterPackUnlockedBool: true, epicPackUnlockedBool: false,
      disableAdsUnlockedBool: true })).toEqual({ hasStarterPack: true, hasEpicPack: false,
      hasDisableAds: true, unreadableKeys: [] })
  })
  it('does not infer purchases from numbers, strings, history or multipliers', () => {
    const result = readPurchasesFromSaveRoot({ starterPackUnlockedBool: 1, epicPackUnlockedBool: 'true',
      coinsEarned: 1e30, starterPackCoinMult: 2 })
    expect(result?.hasStarterPack).toBeNull()
    expect(result?.hasEpicPack).toBeNull()
    expect(result?.hasDisableAds).toBeNull()
    expect(result?.unreadableKeys).toHaveLength(3)
  })
  it('returns null for absent root', () => expect(readPurchasesFromSaveRoot(null)).toBeNull())
})

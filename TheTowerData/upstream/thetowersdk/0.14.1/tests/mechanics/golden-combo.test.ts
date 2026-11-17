import { describe, expect, it } from 'vitest'

import {
  GOLDEN_COMBO_BENEFIT_INDEX,
  GOLDEN_COMBO_MIN_BENEFIT_LENGTH,
  goldenComboBenefitBase,
  goldenComboFromCoins,
  goldenComboMaxTier,
  goldenComboMultiplier,
  goldenComboPayout,
} from '../../src/mechanics/combat/golden-combo'

/**
 * The point of these tests is to fail if the formula reverts to the linear
 * reading the oracle carried until 2026-08-18. Each planted fault below was run
 * against the suite before being written down, and each one turns a test red:
 *
 *  - `base * combo - 1` instead of `pow(base, combo) - 1` → the divergence and
 *    round-trip tests fail (the low-combo cases still pass, which is the whole
 *    reason the wrong reading survived).
 *  - dropping the `- 1` → the combo-zero test fails.
 *  - dropping `Math.fround` → the float32 test fails.
 */
describe('goldenComboMultiplier', () => {
  it('pays nothing at combo zero', () => {
    // Not a rounding detail: without the `- 1` a window with no kills would pay
    // the full bonus.
    expect(goldenComboMultiplier(1.05, 0)).toBe(0)
  })

  it('is a power of the combo, not a product', () => {
    // Chosen because linear and exponential disagree by more than 4x here. A
    // linear model gives 2.5; the game gives about 10.5.
    const multiplier = goldenComboMultiplier(1.05, 50)
    expect(multiplier).toBeGreaterThan(9)
    expect(multiplier).toBeLessThan(12)
    expect(multiplier).toBeGreaterThan(4 * (0.05 * 50))
  })

  it('agrees with a linear reading closely at low combos', () => {
    // Documents WHY the wrong reading survived, so nobody re-derives it from a
    // spot check at combo 3 and concludes the correction was wrong.
    const exponential = goldenComboMultiplier(1.05, 3)
    const linear = 0.05 * 3
    expect(Math.abs(exponential - linear)).toBeLessThan(0.01)
  })

  it('computes in float32, as the game does', () => {
    // The game converts down, calls powf, and converts back up. If this ever
    // equals the float64 result exactly, the fround pair has been dropped.
    const single = goldenComboMultiplier(1.0123, 97)
    const double = Math.pow(1.0123, 97) - 1
    expect(single).not.toBe(double)
    expect(single).toBeCloseTo(double, 4)
  })

  it('reads index 5, the index the length guard protects', () => {
    expect(GOLDEN_COMBO_MIN_BENEFIT_LENGTH).toBe(GOLDEN_COMBO_BENEFIT_INDEX + 1)
  })
})

describe('goldenComboPayout', () => {
  it('scales cash and coins by the same multiplier but not the same bonus', () => {
    const payout = goldenComboPayout({
      benefitBase: 1.05,
      combo: 20,
      cashBonus: 1000,
      coinsBonus: 7,
    })
    expect(payout.cash / payout.coins).toBeCloseTo(1000 / 7, 9)
    expect(payout.cash).toBeCloseTo(1000 * payout.multiplier, 9)
  })

  it('pays nothing when the combo never started', () => {
    const payout = goldenComboPayout({ benefitBase: 1.05, combo: 0, cashBonus: 1000, coinsBonus: 7 })
    expect(payout).toEqual({ multiplier: 0, cash: 0, coins: 0 })
  })
})

describe('goldenComboFromCoins', () => {
  it('recovers the combo a payout came from', () => {
    // This is the save-validation path: a battle report carries the coins and
    // the combo separately, and this ties them together.
    const coinsBonus = 12.5
    const base = 1.05
    const payout = goldenComboPayout({ benefitBase: base, combo: 34, cashBonus: 0, coinsBonus })
    expect(goldenComboFromCoins(payout.coins, coinsBonus, base)).toBeCloseTo(34, 3)
  })

  it('refuses rather than guessing when it cannot invert', () => {
    expect(goldenComboFromCoins(10, 0, 1.05)).toBeNull()
    expect(goldenComboFromCoins(10, 1, 1)).toBeNull()
    expect(goldenComboFromCoins(0, 1, 1.05)).toBeNull()
  })
})

describe('goldenComboBenefitBase', () => {
  it('agrees with the independently-derived base in the coin simulation', () => {
    // Pin the base used by the coin simulation so chart changes cannot silently
    // change the modeled combo growth.
    for (let tier = 0; tier <= goldenComboMaxTier(); tier += 1) {
      expect(goldenComboBenefitBase(tier)).toBeCloseTo(1 + 0.0003 * (tier + 1), 10)
    }
  })

  it('produces a base small enough that combos must be large to matter', () => {
    // Guards against a units slip: reading "0.03%" as 0.03 gives a base of 1.03,
    // which at combo 400 is 1.3e5 instead of 0.13.
    const base = goldenComboBenefitBase(0)
    expect(base).toBeCloseTo(1.0003, 10)
    expect(goldenComboMultiplier(base ?? 0, 400)).toBeLessThan(1)
  })

  it('refuses an unknown tier rather than clamping to one that exists', () => {
    expect(goldenComboBenefitBase(goldenComboMaxTier() + 1)).toBeNull()
  })
})

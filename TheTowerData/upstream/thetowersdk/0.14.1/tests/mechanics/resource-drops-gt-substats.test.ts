import { describe, expect, it } from 'vitest'
import { computeGoldenTowerCoinMult } from '../../src/mechanics/resource-drops/coin-multipliers'

describe('Golden Tower coin module and perk ownership', () => {
  it('applies the perk to stone plus lab bonus before adding the module bonus', () => {
    // Recorded owner example: 17 base + 3 module displays 20 before the perk,
    // then 28.5 after it, rather than multiplying the entire displayed 20.
    expect(computeGoldenTowerCoinMult(15, 0, 3)).toBeCloseTo(20, 12)
    expect(computeGoldenTowerCoinMult(15, 0, 3, 1.5)).toBeCloseTo(28.5, 12)
  })

  it('preserves the previous call shape when optional module and perk inputs are absent', () => {
    expect(computeGoldenTowerCoinMult(0, 0)).toBe(5)
    expect(computeGoldenTowerCoinMult(0, 0, 0, 1)).toBe(5)
    expect(computeGoldenTowerCoinMult(0, 25)).toBeCloseTo(8.75, 12)
  })

  it('refuses invalid optional coefficients instead of silently granting or losing coins', () => {
    for (const moduleBonus of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => computeGoldenTowerCoinMult(0, 0, moduleBonus))
        .toThrow('GT_COIN_MODULE_AND_PERK_COEFFICIENT_INVALID')
    }
    for (const perk of [0, 0.99, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => computeGoldenTowerCoinMult(0, 0, 0, perk))
        .toThrow('GT_COIN_MODULE_AND_PERK_COEFFICIENT_INVALID')
    }
  })

  it('refuses overflow with individually finite optional coefficients', () => {
    expect(() => computeGoldenTowerCoinMult(0, 0, 0, Number.MAX_VALUE))
      .toThrow('GT_COIN_COEFFICIENT_OVERFLOW')
  })
})

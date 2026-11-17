import { describe, expect, it } from 'vitest'
import {
  VAMPIRE_DRAIN_MAX_TOWER_HEALTH_FRACTION_PER_SECOND,
  vampireGarlicMaxHealthDamageRate,
} from '../../src/mechanics/enemies/vampire-beam'

describe('qualified Vampire beam coefficients', () => {
  it('keeps tower drain distinct from the Garlic enemy-health channel', () => {
    expect(VAMPIRE_DRAIN_MAX_TOWER_HEALTH_FRACTION_PER_SECOND).toBe(0.02)
    // 103% thorns at maximum Garlic deals 5.15% of Vampire max HP per second.
    const garlicRate = vampireGarlicMaxHealthDamageRate(1.03, 5)
    expect(garlicRate).toBeCloseTo(0.0515, 14)
    expect(1000 * garlicRate * 2).toBeCloseTo(103, 12)
  })

  it('credits no Garlic damage when either required coefficient is zero', () => {
    expect(vampireGarlicMaxHealthDamageRate(0, 5)).toBe(0)
    expect(vampireGarlicMaxHealthDamageRate(1.03, 0)).toBe(0)
  })

  it('refuses invalid coefficients rather than silently producing combat damage', () => {
    for (const invalid of [-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(() => vampireGarlicMaxHealthDamageRate(invalid, 5)).toThrow('FINITE_NONNEGATIVE')
      expect(() => vampireGarlicMaxHealthDamageRate(1.03, invalid)).toThrow('FINITE_NONNEGATIVE')
    }
  })

  it('refuses numeric overflow even when both supplied coefficients are finite', () => {
    expect(() => vampireGarlicMaxHealthDamageRate(Number.MAX_VALUE, Number.MAX_VALUE))
      .toThrow('VAMPIRE_GARLIC_COEFFICIENT_OVERFLOW')
  })
})

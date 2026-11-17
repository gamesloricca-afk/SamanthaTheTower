/**
 * Expected values here were produced by running tower-idle-toolkit's own
 * implementations, so these lock our ports to the behaviour of the original.
 * The fixtures are committed rather than computed, so nothing depends on that
 * package at test time.
 */
import { describe, expect, it } from 'vitest'

import { formatDuration } from '../../src/formatting/duration/compute'
import { goldenComboBonus, mineChargeMultiplier } from '../../src/mechanics/combat/bonuses'
import { abilityDamage } from '../../src/mechanics/combat/damage'

describe('formatDuration matches the original formatTime', () => {
  const cases: ReadonlyArray<[number, string]> = [
    [0, '0s'],
    [1, '1s'],
    [59, '59s'],
    [60, '1m, 0s'],
    [90, '1m, 30s'],
    [3599, '59m, 59s'],
    [3600, '1h, 0m, 0s'],
    [3661, '1h, 1m, 1s'],
    // Note the gaps: hours are only shown when non-zero, and minutes only when
    // minutes or hours are non-zero. So a whole number of days collapses to
    // "1 days, 0s" rather than spelling out the zero units.
    [86400, '1 days, 0s'],
    [90061, '1 days, 1h, 1m, 1s'],
    [31536000, '1 years, 0 days, 0s'],
    [31626061, '1 years, 1 days, 1h, 1m, 1s'],
  ]

  for (const [seconds, expected] of cases) {
    it(`formats ${seconds}s`, () => {
      expect(formatDuration(seconds)).toBe(expected)
    })
  }
})

describe('goldenComboBonus matches the original', () => {
  it('returns 0 for a zero-kill combo', () => {
    expect(goldenComboBonus(5, 0)).toBe(0)
  })

  it('compounds per kill', () => {
    expect(goldenComboBonus(5, 1)).toBeCloseTo(0.050000000000000044, 15)
    expect(goldenComboBonus(5, 10)).toBeCloseTo(0.6288946267774422, 15)
    expect(goldenComboBonus(1, 100)).toBeCloseTo(1.7048138294215285, 15)
  })
})

describe('mineChargeMultiplier matches the original', () => {
  it('is 1 with no charge time', () => {
    expect(mineChargeMultiplier(0.5, 0)).toBe(1)
  })

  it('scales linearly with seconds', () => {
    expect(mineChargeMultiplier(0.5, 4)).toBe(3)
    expect(mineChargeMultiplier(2, 10)).toBe(21)
  })
})

describe('abilityDamage matches the original damageFormula', () => {
  it('applies crit and super crit', () => {
    expect(
      abilityDamage({
        damagePercent: 321,
        damage: 1000,
        critFactor: 5,
        critChance: 20,
        superCritMult: 3,
        superCritChance: 10,
      }),
    ).toBeCloseTo(6805.200000000001, 9)
  })

  it('reduces to damagePercent x damage with no crits', () => {
    expect(
      abilityDamage({
        damagePercent: 100,
        damage: 500,
        critFactor: 0,
        critChance: 0,
        superCritMult: 0,
        superCritChance: 0,
      }),
    ).toBe(500)
  })
})

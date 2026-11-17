import { describe, expect, it } from 'vitest'
import { inRunWorkshopStatValue } from '../../src/mechanics/effective-paths/workshop-values'
import {
  applyWorkshopOvercapMultiplier,
  workshopOvercapMultiplier,
} from '../../src/mechanics/workshop/overcap'

describe('29.1 in-run workshop overcap', () => {
  it.each([
    [6000, 1], [7000, 1.9552428084888693], [10000, 7.373254670082919],
  ])('applies the overcap ratio once to the health and regen bases at %i', (level, ratio) => {
    for (const stat of ['Health', 'Health Regen', 'Damage'] as const) {
      expect(inRunWorkshopStatValue(stat, level)! / inRunWorkshopStatValue(stat, 6000)!).toBeCloseTo(ratio, 11)
    }
  })

  it('does not turn unreachable or malformed levels into valid stat values', () => {
    for (const level of [-1, 6000.5, 10001, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(inRunWorkshopStatValue('Health', level)).toBeNull()
    }
  })
  // Frozen outputs of the game's Health overcap branch, with a base of one.
  // The reference values use double-precision power arithmetic.
  it.each([
    [6000, 1],
    [6001, 1.0007659344065025],
    [6100, 1.0784068739758916],
    [6500, 1.4293923215565647],
    [7000, 1.9552428084888693],
    [8000, 3.3147456765417203],
    [9000, 5.111387383653961],
    [10000, 7.373254670082919],
    [12000, 13.38911625114653],
    [16000, 31.950881846696017],
  ])('matches the overcap reference value at %i', (level, multiplier) => {
    expect(workshopOvercapMultiplier(level)).toBeCloseTo(multiplier, 11)
  })

  it('preserves a below-cap value and applies the ratio once above the cap', () => {
    expect(applyWorkshopOvercapMultiplier(123, 5000)).toBe(123)
    expect(applyWorkshopOvercapMultiplier(123, 7000)).toBeCloseTo(240.49486544413, 10)
  })

  it('rejects invalid inputs instead of returning plausible values', () => {
    expect(() => workshopOvercapMultiplier(Number.NaN)).toThrow(RangeError)
    expect(() => workshopOvercapMultiplier(Number.POSITIVE_INFINITY)).toThrow(RangeError)
    expect(() => applyWorkshopOvercapMultiplier(-1, 7000)).toThrow(RangeError)
  })
})

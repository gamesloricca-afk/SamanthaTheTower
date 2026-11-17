import { describe, expect, it } from 'vitest'
import {
  DISSONANCE_BOOST_FACTORS,
  dissonantBoost,
  dissonantBoostOfType,
} from '../../src/mechanics/effective-paths/ehp-model'
import fixtures from '../../fixtures/mechanics/effective-paths-dissonance.fixtures.json'

/**
 * The dissonance boost, against the live sheet.
 *
 * Twenty randomised states evaluated by the real `TTG_DISSONANT_*_BOOST`
 * functions. Three of the four types are the same number; utility is half it,
 * and that difference is the whole reason to check them separately — reusing
 * one for the economy path would be wrong by a factor that looks plausible.
 */
describe('dissonance boosts against the sheet', () => {
  it('has states worth checking', () => {
    expect(fixtures.cases.length).toBe(20)
    // Waves past 5000 have to appear, or the cap goes unchecked.
    expect(fixtures.cases.some(c => c.tiers.some(wave => wave > 5000))).toBe(true)
    expect(fixtures.cases.some(c => c.echo > 0)).toBe(true)
  })

  for (const [index, c] of fixtures.cases.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      const close = (ours: number, sheet: number) =>
        expect(Math.abs(ours / sheet - 1)).toBeLessThan(1e-12)

      close(dissonantBoostOfType('defense', c.current, c.tiers, c.echo), c.sheetDefense)
      close(dissonantBoostOfType('utility', c.current, c.tiers, c.echo), c.sheetUtility)
      close(dissonantBoostOfType('uw', c.current, c.tiers, c.echo), c.sheetUw)
      // Attack has no fixture column; the sheet's own function is identical to
      // Defense's, so it must agree with it exactly.
      expect(dissonantBoostOfType('attack', c.current, c.tiers, c.echo))
        .toBe(dissonantBoostOfType('defense', c.current, c.tiers, c.echo))
    })
  }

  it('gives utility half the bonus, not half the multiplier', () => {
    const args = [3000, [3000, 1000, 500], 4] as const
    const defense = dissonantBoostOfType('defense', ...args)
    const utility = dissonantBoostOfType('utility', ...args)
    // Both start at 1, so it is the part above 1 that halves.
    expect(utility - 1).toBeCloseTo((defense - 1) / 2, 12)
    expect(DISSONANCE_BOOST_FACTORS.utility).toBe(2)
  })

  it('caps a tier at 5000 waves', () => {
    expect(dissonantBoost(5000, [5000], 0)).toBe(dissonantBoost(99999, [99999], 0))
  })

  it('is what eHP reads for defence', () => {
    expect(dissonantBoost(2000, [2000, 100], 3))
      .toBe(dissonantBoostOfType('defense', 2000, [2000, 100], 3))
  })
})

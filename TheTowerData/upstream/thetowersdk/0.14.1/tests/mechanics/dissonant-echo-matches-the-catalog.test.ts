import { describe, expect, it } from 'vitest'
import { computeLabValueAtLevel, findToolLabBySlug, getLabMaxLevel } from '../../src/data'
import {
  computeDissonantEchoBenefitFraction,
  computeDissonantEchoBenefitPct,
  dissonantEchoLabMaxLevel,
} from '../../src/mechanics/labs/compute'
import { DISSONANT_ECHO_LAB_SLUGS } from '../../src/mechanics/labs/constants'

/**
 * The formula must reproduce the catalog, or the catalog is the answer and the formula goes.
 *
 * Rule 9 lets a formula stand in for a table only where it matches every row exactly. This is that
 * proof for the Dissonant Echo labs, and it is also what retired a branch: the old code read the
 * catalog first and fell back to the formula whenever the catalog answered 0 above level 0. The
 * fallback never fired — no level of any of the four labs answers 0 — so the package carried two
 * sources of truth for one number, and a reconciliation for a disagreement that does not happen.
 */
describe('Dissonant Echo benefit matches the catalog', () => {
  it('finds all four labs, so an empty sweep cannot pass', () => {
    const found = DISSONANT_ECHO_LAB_SLUGS.filter(slug => findToolLabBySlug(slug))
    expect(found).toEqual([...DISSONANT_ECHO_LAB_SLUGS])
  })

  it('matches every level of every Dissonant Echo lab', () => {
    const wrong: string[] = []
    let compared = 0

    for (const slug of DISSONANT_ECHO_LAB_SLUGS) {
      const lab = findToolLabBySlug(slug)
      if (!lab) continue
      for (let level = 0; level <= getLabMaxLevel(lab); level += 1) {
        compared += 1
        const fromCatalog = computeLabValueAtLevel(lab, level)
        const fromFormula = computeDissonantEchoBenefitFraction(level)
        /*
         * Exact equality, deliberately. The oracle warns that catalog floats carry visible drift
         * and should be compared with a tolerance — that warning is about values transcribed from
         * the game. These are computed by the same arithmetic on both sides, so if they ever stop
         * being identical the formula has stopped describing the table, which is the thing this
         * test exists to notice.
         */
        if (fromCatalog !== fromFormula) {
          wrong.push(`${slug} L${level}: catalog ${fromCatalog}, formula ${fromFormula}`)
        }
      }
    }

    expect(compared).toBeGreaterThan(50)
    expect(wrong).toEqual([])
  })

  it('reads its cap from the catalog rather than restating it', () => {
    const fromCatalog = Math.max(
      ...DISSONANT_ECHO_LAB_SLUGS
        .map(slug => findToolLabBySlug(slug))
        .filter(lab => lab)
        .map(lab => getLabMaxLevel(lab!)),
    )
    expect(dissonantEchoLabMaxLevel()).toBe(fromCatalog)
  })

  it('starts at one step, not at zero, and refuses a negative level', () => {
    expect(computeDissonantEchoBenefitFraction(0)).toBe(0.005)
    expect(computeDissonantEchoBenefitFraction(1)).toBe(0.01)
    expect(computeDissonantEchoBenefitFraction(-1)).toBe(0)
    expect(computeDissonantEchoBenefitPct(0)).toBeCloseTo(0.5, 10)
  })
})

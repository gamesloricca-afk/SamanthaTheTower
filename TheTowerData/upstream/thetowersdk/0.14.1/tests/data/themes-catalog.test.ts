import { describe, expect, it } from 'vitest'

import {
  computeThemePassiveCoinBonus,
  getThemeCategoryDefinition,
  THEME_CATEGORY_DEFINITIONS,
  THEME_PASSIVE_FORMULA,
  THEME_PASSIVE_FORMULA_TERMS,
} from '../../src/data/themes/catalog'

describe('theme passive coin bonus', () => {
  it('states the same coefficients the definitions hold', () => {
    /*
     * The formula string used to be hand-written with its own copy of every
     * coefficient. Pinning the exact sentence here means a change to any
     * category percentage shows up as a diff in a readable string rather than
     * as a number quietly disagreeing with prose.
     */
    expect(THEME_PASSIVE_FORMULA).toBe(
      'Coin Bonus = 1 + 0.004 x Tower Theme Quantity + 0.008 x Background Theme Quantity'
      + ' + 0.006 x Menu Theme Quantity + 0.006 x Guardian Theme Quantity',
    )
  })

  it('derives one term per category, in order', () => {
    expect(THEME_PASSIVE_FORMULA_TERMS).toHaveLength(THEME_CATEGORY_DEFINITIONS.length)
    for (const [index, term] of THEME_PASSIVE_FORMULA_TERMS.entries()) {
      const definition = THEME_CATEGORY_DEFINITIONS[index]
      expect(term.category).toBe(definition.key)
      expect(term.coefficient).toBeCloseTo(definition.passiveCoinBonusPerOwnedPercent / 100, 10)
    }
  })

  it('is 1 with nothing owned', () => {
    expect(computeThemePassiveCoinBonus({})).toBe(1)
  })

  it('adds categories together rather than multiplying them', () => {
    // 1 + (10 x 0.004) + (5 x 0.008) = 1.08
    expect(computeThemePassiveCoinBonus({ tower: 10, background: 5 })).toBeCloseTo(1.08, 10)
  })

  it('moves when any single category moves', () => {
    // Prove each term is actually read, not just present in the table. A
    // coefficient nothing consumes is the defect shape this repo keeps hitting.
    const baseline = computeThemePassiveCoinBonus({})
    for (const term of THEME_PASSIVE_FORMULA_TERMS) {
      const bumped = computeThemePassiveCoinBonus({ [term.category]: 1 })
      expect(bumped, `${term.category} did not affect the bonus`).toBeGreaterThan(baseline)
      expect(bumped - baseline).toBeCloseTo(term.coefficient, 10)
    }
  })

  it('resolves categories by key and rejects unknown ones', () => {
    expect(getThemeCategoryDefinition('background')?.passiveCoinBonusPerOwnedPercent).toBe(0.8)
    // @ts-expect-error — an unknown key must not silently resolve to a default.
    expect(getThemeCategoryDefinition('nonexistent')).toBeUndefined()
  })
})

import { describe, expect, it } from 'vitest'
import { computeEffectiveDamage } from '../../src/mechanics/effective-paths/edamage-compute'
import { CURRENT_DAMAGE_COLUMN_REFS, currentDamageConfig as configFromSheet, currentDamageLevels as levelsFromSheet, currentDamageOutputRef } from './helpers/effective-paths-current-damage-sheet'
import fixture from '../../fixtures/mechanics/effective-paths-edamage-v5.11.08.10.fixtures.json'

const captured = fixture.baseline.cells as Record<string, unknown>
const cell = (ref: string): number => {
  const current = currentDamageOutputRef(ref)
  const value = captured[current]
  if (typeof value !== 'number') throw new Error(`missing numeric current source ${current} for ${ref}`)
  return value
}

describe('effective damage, against the captured v5.11.08.10 grid', () => {
  const result = computeEffectiveDamage(configFromSheet(), levelsFromSheet())

  const factors: Array<[string, keyof typeof result, string]> = [
    ['DJ5', 'base', 'the base'],
    ['DO5', 'crit', 'the bullet crit'],
    ['DP5', 'ultimateWeaponCrit', 'the ultimate weapon crit'],
    ['EB5', 'bulletDamageMultiplier', 'the bullet multiplier'],
    ['EE5', 'spotlight', 'Spotlight'],
    ['EP5', 'ultimateWeapons', 'the ultimate weapons'],
    ['ES5', 'slow', 'the slow'],
    ['ET5', 'effectiveDamage', 'effective damage'],
  ]

  for (const [ref, key, what] of factors) {
    it(`matches ${what} — ${ref}`, () => {
      expect(result[key]).toBeCloseTo(cell(ref), 6)
    })
  }

  /*
   * EVERY intermediate column, not just the eight aggregates above.
   *
   * The eight are `base`, `crit`, `ultimateWeaponCrit`, `bulletDamageMultiplier`,
   * `spotlight`, `ultimateWeapons`, `slow` and `effectiveDamage` — the factors
   * of `ES5`. They are the LAST step of a dozen columns each, so an error in an
   * intermediate can hide behind them: cancel against a sibling, or move a
   * number too little to fail a 6-decimal comparison on the total while still
   * changing which upgrade a path picks.
   *
   * That is not hypothetical, it is the pattern of this whole port. Every stone
   * and coin defect found so far surfaced as a RANKING difference in a sweep,
   * never as a failing unit test, and each cost an afternoon of bisecting to
   * localise. The sweeps were doing the job this test should do.
   *
   * A pinned address manifest rejects an unreviewed diagnostic surface change.
   * Synthetic diagnostics are not spreadsheet addresses.
   */
  it('pins the complete captured A1 diagnostic surface', () => {
    expect(Object.keys(result.columns).filter(ref => /^[A-Z]+5$/.test(ref)).sort())
      .toEqual([...CURRENT_DAMAGE_COLUMN_REFS].sort())
  })
  for (const ref of CURRENT_DAMAGE_COLUMN_REFS) {
    it(`matches column ${ref}`, () => {
      const expected = cell(ref)
      expect(result.columns[ref]).toBeCloseTo(Number(expected), 6)
    })
  }

  it('composes the two halves by adding them', () => {
    // The shape the whole model turns on, checked against the sheet's own
    // numbers rather than restated: DJ × (DO × EB × EE + EP × DP) × ES.
    const expected = result.base
      * (result.crit * result.bulletDamageMultiplier * result.spotlight
        + result.ultimateWeapons * result.ultimateWeaponCrit)
      * result.slow
    expect(result.effectiveDamage).toBeCloseTo(expected, 9)
  })

  it('reads an account with no ultimate weapons, which bounds what this proves', () => {
    // If the fixture is ever refreshed from a developed account these should
    // start failing — at which point the end-to-end coverage got better, and
    // the docstring above needs rewriting rather than these expectations.
    expect(cell('EP5')).toBe(0)
    expect(cell('EE5')).toBe(1)
    expect(cell('ES5')).toBe(1)
  })
})

describe('an Attack Dissonance run', () => {
  it('keeps only the shockwave and Amp Strike in the base', () => {
    // The tower does not fire, so every bullet stat drops out — but the run
    // still has a number, which is the point of adding the halves.
    const config = configFromSheet()
    const levels = levelsFromSheet()
    const regular = computeEffectiveDamage({ ...config, runType: 'Regular' }, levels)
    const disso = computeEffectiveDamage({ ...config, runType: 'Attack Disso' }, levels)

    expect(disso.base).toBeLessThan(regular.base)
    expect(disso.crit).toBe(1)
    expect(disso.ultimateWeaponCrit).toBe(1)
  })
})

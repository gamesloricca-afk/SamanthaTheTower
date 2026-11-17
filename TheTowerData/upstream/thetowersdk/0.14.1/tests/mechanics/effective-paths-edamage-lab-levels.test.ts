import { describe, expect, it } from 'vitest'
import {
  LAB_BAND_HEADERS,
  effectiveDamageLabLevelsFromSheet,
} from '../../src/mechanics/effective-paths/edamage-lab-levels'

describe('effectiveDamageLabLevelsFromSheet', () => {
  it('maps live headers and drops Generator', () => {
    expect(LAB_BAND_HEADERS).toHaveLength(34)
    const source: Record<string, unknown> = {
      BO4: '',
      BP4: 'Damage',
      BP5: 60,
      BQ4: 'Damage Mastery',
      BQ5: 1,
      CE4: 'Range Mastery',
      CE5: 6,
      CF4: 'S.T. Bonus',
      CF5: 21,
      CG4: 'Super Tower Mastery',
      CG5: 3,
      CR4: 'AssM Substat - Generator',
      CR5: 0,
      CS4: 'AssM Bonus - Core',
      CS5: 2,
      CU4: 'Dissonant Echo - Attack',
      CU5: 14,
      CV4: 'Dissonant Echo - Ultimate Weapons',
      CV5: 8,
    }
    const result = effectiveDamageLabLevelsFromSheet(source)
    expect(result.binding).toBe('headers')
    expect(result.dropped).toEqual(['AssM Substat - Generator'])
    expect(result.unknown).toEqual([])
    expect(result.levels.damage).toBe(60)
    expect(result.levels.superTowerBonus).toBe(21)
    expect(result.levels.superTowerMastery).toBe(3)
    expect(result.levels.rangeMastery).toBe(6)
  })

  it('binds a left-shifted band the way unified fixtures capture it', () => {
    /*
     * Unified sweeps store Damage at BO and S.T. Bonus at CE. Fixed CF5 would
     * read Super Tower Mastery (4) as the ST bonus lab and collapse SL Angle.
     */
    const source: Record<string, unknown> = {
      BO4: 'Damage',
      BO5: 70,
      BP4: 'Damage Mastery',
      BP5: 3,
      CD4: 'Range Mastery',
      CD5: 4,
      CE4: 'S.T. Bonus',
      CE5: 17,
      CF4: 'Super Tower Mastery',
      CF5: 4,
      CG4: 'Rend Mult.',
      CG5: 23,
    }
    const result = effectiveDamageLabLevelsFromSheet(source)
    expect(result.binding).toBe('headers')
    expect(result.levels.damage).toBe(70)
    expect(result.levels.superTowerBonus).toBe(17)
    expect(result.levels.superTowerMastery).toBe(4)
    expect(result.levels.rangeMastery).toBe(4)
    expect(result.levels.maxRendArmorMultiplier).toBe(23)
  })

  it('falls back to fixed BP5:CV5 when row-4 headers are absent', () => {
    const source: Record<string, unknown> = {
      BP5: 10,
      CF5: 17,
      CG5: 4,
    }
    const result = effectiveDamageLabLevelsFromSheet(source)
    expect(result.binding).toBe('fixed')
    expect(result.levels.damage).toBe(10)
    expect(result.levels.superTowerBonus).toBe(17)
    expect(result.levels.superTowerMastery).toBe(4)
  })

  it('reads the current primary research headers without mistaking old computed columns for levels', () => {
    const current = effectiveDamageLabLevelsFromSheet({ BP4: 'Damage', BP5: 60,
      CZ4: 'Primary Module Bonus - Cannon', CZ5: 7, DA4: 'Primary Module Bonus - Core', DA5: 9 })
    expect(current.levels.primaryModuleBonusCannon).toBe(7)
    expect(current.levels.primaryModuleBonusCore).toBe(9)
    const historical = effectiveDamageLabLevelsFromSheet({ BP5: 60, CZ5: 1, DA5: 999 })
    expect(historical.levels.primaryModuleBonusCannon).toBe(0)
    expect(historical.levels.primaryModuleBonusCore).toBe(0)
    expect(historical.missing).toEqual(expect.arrayContaining(['primaryModuleBonusCannon', 'primaryModuleBonusCore']))
  })

  it('ignores Damage labels outside the BO:CV lab band', () => {
    const source: Record<string, unknown> = {
      AV4: 'Damage',
      AV5: 999,
      BP4: 'Damage',
      BP5: 60,
      CF4: 'S.T. Bonus',
      CF5: 21,
    }
    const result = effectiveDamageLabLevelsFromSheet(source)
    expect(result.levels.damage).toBe(60)
    expect(result.levels.superTowerBonus).toBe(21)
  })
})

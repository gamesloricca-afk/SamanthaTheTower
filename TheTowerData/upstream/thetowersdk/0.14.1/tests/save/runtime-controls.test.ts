import { describe, expect, it } from 'vitest'
import { decodeLifeSavingOrder, EXCLUDED_LEGACY_LIFE_SAVING_IDS, LIFE_SAVING_EFFECT_NAMES_BY_ID, readRuntimeControlsFromSaveRoot } from '../../src/save/runtime-controls'

describe('runtime controls save reader', () => {
  it('decodes fragment-proven IDs in saved order and preserves unknown IDs without a handler assumption', () => {
    const source = [0, 4, 2, 3, 1, 5, 42]
    expect(decodeLifeSavingOrder(source)).toEqual([
      { id: 0, name: 'DeathDefy' }, { id: 4, name: 'Nuke' }, { id: 2, name: 'SecondWind' },
      { id: 3, name: 'DemonMode' }, { id: 1, name: 'EnergyShield' }, { id: 5, name: null },
      { id: 42, name: null },
    ])
    expect(source).toEqual([0, 4, 2, 3, 1, 5, 42])
    expect(EXCLUDED_LEGACY_LIFE_SAVING_IDS).toEqual([5])
    expect(Object.isFrozen(EXCLUDED_LEGACY_LIFE_SAVING_IDS)).toBe(true)
    expect(Object.values(LIFE_SAVING_EFFECT_NAMES_BY_ID)).not.toContain('Bastion')
    expect(Object.isFrozen(LIFE_SAVING_EFFECT_NAMES_BY_ID)).toBe(true)
    expect(decodeLifeSavingOrder(null)).toBeNull()
    expect(decodeLifeSavingOrder([0, 0])).toBeNull()
    expect(decodeLifeSavingOrder([-1])).toBeNull()
  })
  it('preserves active zero, false and raw orb scalars without unit conversion', () => {
    const values = { rangeLevelSelected: 0, swampRangeLevelSelected: 0, poisonSwampStunOff: false,
      innerOrbDistance: 4.35000038, workshopOrbDistance: 5.655,
      savedWorkshopOrbDistance: 6, savedInnerOrbDistance: 4.35000038,
      lifeSavingOrder: [0, 4, 2, 3, 1, 5], energyShieldRestrictionToggle: false,
      targetPriority: 0, targetPriorityList: [7, 8, 9, 5, 0, 4, 2, 3, 1, 6] }
    expect(readRuntimeControlsFromSaveRoot(values)).toEqual({ ...values, unreadableKeys: [] })
  })
  it('retains independent current and saved selections', () => {
    const result = readRuntimeControlsFromSaveRoot({ rangeLevelSelected: 30, swampRangeLevelSelected: 5,
      poisonSwampStunOff: true, innerOrbDistance: 2, savedInnerOrbDistance: 4,
      workshopOrbDistance: 3, savedWorkshopOrbDistance: 6 })
    expect(result?.rangeLevelSelected).toBe(30)
    expect(result?.innerOrbDistance).toBe(2)
    expect(result?.savedInnerOrbDistance).toBe(4)
    expect(result?.poisonSwampStunOff).toBe(true)
  })
  it('does not coerce missing, string, nonfinite, negative or fractional level fields', () => {
    expect(readRuntimeControlsFromSaveRoot(null)).toBeNull()
    const result = readRuntimeControlsFromSaveRoot({ rangeLevelSelected: '0', swampRangeLevelSelected: .5,
      poisonSwampStunOff: 0, innerOrbDistance: Infinity, workshopOrbDistance: -1,
      savedWorkshopOrbDistance: NaN })!
    expect(result.unreadableKeys).toHaveLength(11)
    expect(result.rangeLevelSelected).toBeNull()
    expect(result.poisonSwampStunOff).toBeNull()
    expect(result.savedInnerOrbDistance).toBeNull()
  })
  it('retains raw targeting settings independently without assuming a permutation or handler', () => {
    const raw = [7, 8, 9, 0, 0]
    const result = readRuntimeControlsFromSaveRoot({ targetPriority: 0, targetPriorityList: raw })!
    expect(result.targetPriority).toBe(0)
    expect(result.targetPriorityList).toEqual(raw)
    result.targetPriorityList!.reverse()
    expect(raw).toEqual([7, 8, 9, 0, 0])
    expect(readRuntimeControlsFromSaveRoot({ targetPriorityList: [-1] })?.targetPriorityList).toBeNull()
  })
  it('copies raw life-saving IDs in order without assigning enum meanings or a guessed maximum ID', () => {
    const source = [0, 4, 2, 3, 1, 5, 99]
    const result = readRuntimeControlsFromSaveRoot({ lifeSavingOrder: source, energyShieldRestrictionToggle: true })!
    expect(result.lifeSavingOrder).toEqual(source)
    expect(result.energyShieldRestrictionToggle).toBe(true)
    result.lifeSavingOrder!.reverse()
    expect(source).toEqual([0, 4, 2, 3, 1, 5, 99])
  })
  it('rejects duplicate, oversized and malformed order arrays and non-boolean switches', () => {
    for (const value of [[0, 0], [-1], [Infinity], [NaN], [.5], ['0'], '0,1',
      Array.from({ length: 33 }, (_, index) => index)]) {
      const result = readRuntimeControlsFromSaveRoot({ lifeSavingOrder: value, energyShieldRestrictionToggle: 1 })!
      expect(result.lifeSavingOrder).toBeNull()
      expect(result.energyShieldRestrictionToggle).toBeNull()
      expect(result.unreadableKeys).toContain('lifeSavingOrder')
    }
  })
})

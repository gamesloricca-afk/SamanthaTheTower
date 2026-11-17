import { describe, expect, it } from 'vitest'
import {
  decodeModuleSaveEffect,
  decodeModuleSubstats,
  decodeSingleEffectId,
} from '../../src/save/modules/decode'

describe('module-save-effect-decode', () => {
  it('decodes Being Annihilator from its effect vector', () => {
    const effectIds = [67, 72, 71, 18, 6, 30, 39, 42] as const
    const expected = [
      { label: 'Super Crit Chance', tier: 'Ancestral' },
      { label: 'Rend Armor Chance', tier: 'Legendary' },
      { label: 'Super Crit Multi', tier: 'Ancestral' },
      { label: 'Critical Factor', tier: 'Ancestral' },
      { label: 'Attack Speed', tier: 'Ancestral' },
      { label: 'Damage / Meter', tier: 'Ancestral' },
      { label: 'Multishot Targets', tier: 'Ancestral' },
      { label: 'Rapid Fire Chance', tier: 'Legendary' },
    ] as const

    const slots = decodeModuleSubstats(effectIds, 'Cannon')
    expect(slots.filter(Boolean)).toHaveLength(8)
    expect(slots.every(slot => !slot?.error)).toBe(true)

    effectIds.forEach((id, index) => {
      const decoded = decodeModuleSaveEffect(id, 'Cannon')
      expect(decoded?.label).toBe(expected[index]?.label)
      expect(decoded?.rarity).toBe(expected[index]?.tier)
    })
  })

  it('decodes Shrink Ray without duplicate substats (SR vector)', () => {
    const effectIds = [58, 35, 75, 63, 22, 54, 78, 47] as const
    const expected = [
      'Bounce Shot Targets',
      'Multishot Chance',
      'Rend Armor Multi',
      'Bounce Shot Range',
      'Attack Range',
      'Bounce Shot Chance',
      'Max Rend Armor Multi',
      'Rapid Fire Duration',
    ] as const

    const slots = decodeModuleSubstats(effectIds, 'Cannon')
    const labels = slots.filter(Boolean).map(slot => slot!.label)
    expect(new Set(labels).size).toBe(labels.length)
    expect(labels).toEqual([...expected])

    const multishotChanceCount = labels.filter(label => label === 'Multishot Chance').length
    expect(multishotChanceCount).toBe(1)
  })

  it('decodes Wormhole Redirector slot 7 as Land Mine Damage Mythic (WR vector)', () => {
    const decoded = decodeSingleEffectId(137, 'Armor')
    expect(decoded?.label).toBe('Land Mine Damage')
    expect(decoded?.tier).toBe('Mythic')

    const slots = decodeModuleSubstats([129, 122, 96, 101, 110, 113, 137, 104], 'Armor')
    expect(slots[6]?.label).toBe('Land Mine Damage')
    expect(slots[6]?.tier).toBe('Mythic')
    expect(slots.every(slot => !slot?.error)).toBe(true)
  })

  it('decodes Chain Lightning - Damage as Ancestral on Om Chip and Magnetic Hook (effect 222)', () => {
    expect(decodeSingleEffectId(222, 'Core')?.label).toBe('Chain Lightning - Damage')
    expect(decodeSingleEffectId(222, 'Core')?.tier).toBe('Ancestral')

    const om = decodeModuleSubstats([222, 322, 316, 232, 226, 313, 326, 0], 'Core')
    expect(om[0]).toMatchObject({ label: 'Chain Lightning - Damage', tier: 'Ancestral' })

    const mh = decodeModuleSubstats([280, 222, 226, 232, 276, 322, 326, 305], 'Core')
    expect(mh[1]).toMatchObject({ label: 'Chain Lightning - Damage', tier: 'Ancestral' })
  })

  it('resolves effect IDs via live module effects table + cluster enum', () => {
    expect(decodeSingleEffectId(72, 'Cannon')).toMatchObject({
      label: 'Rend Armor Chance',
      tier: 'Legendary',
      displayValue: '+2%',
    })
    expect(decodeSingleEffectId(47, 'Cannon')).toMatchObject({
      label: 'Rapid Fire Duration',
      tier: 'Legendary',
      displayValue: '+1.4s',
    })
  })

  it('flags duplicate substat labels on a module', () => {
    const slots = decodeModuleSubstats([133, 146, 0, 0, 0, 0, 0, 0], 'Armor')
    expect(slots[0]?.label).toBe('Land Mine Chance')
    expect(slots[1]?.label).toBe('Death Defy')
    expect(slots.every(slot => !slot?.error)).toBe(true)

    const duplicates = decodeModuleSubstats([133, 133, 0, 0, 0, 0, 0, 0], 'Armor')
    expect(duplicates[1]?.error).toMatch(/Duplicate substat/)
  })
})

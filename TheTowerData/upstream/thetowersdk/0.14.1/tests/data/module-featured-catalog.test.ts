import { describe, expect, it } from 'vitest'

import { findModuleInfoIdentity } from '../../src/data/modules/info-catalog'
import { MODULE_INFO_CATALOG } from '../../src/data/modules/info.data'
import { getModuleTemplate } from '../../src/data/modules/templates'

// Pinned identity and rarity values for the released module catalog.
const FACTS = [
  { id: 'sentry-protocol', name: 'Sentry Protocol', index: 50, type: 'Armor', values: [1, 2, 3, 4] },
  { id: 'gilded-sniper', name: 'Gilded Sniper', index: 51, type: 'Cannon', values: [0.1, 0.2, 0.3, 0.4] },
  { id: 'tactical-barrage', name: 'Tactical Barrage', index: 52, type: 'Core', values: [14, 10, 6, 2] },
  { id: 'infinity-threshold', name: 'Infinity Threshold', index: 53, type: 'Generator', values: [1000, 2000, 3000, 4000] },
] as const

describe('v29 and v29.1 curated unique module catalogs', () => {
  it.each(FACTS)('$name has the released identity and rarity values', ({ id, name, index, type, values }) => {
    const template = getModuleTemplate(id)
    expect(template).toMatchObject({ id, name, type, unique: true, minRarity: 'Epic', maxRarity: 'Ancestral 5' })
    expect(template?.rarityBonuses).toEqual([
      { rarity: 'Epic', value: values[0] },
      { rarity: 'Legendary', value: values[1] },
      { rarity: 'Mythic', value: values[2] },
      { rarity: 'Ancestral', value: values[3] },
    ])
    expect(MODULE_INFO_CATALOG.filter(row => row.infoIndex === index)).toHaveLength(1)
    expect(MODULE_INFO_CATALOG.find(row => row.infoIndex === index)).toMatchObject({
      index, infoIndex: index, name, category: type, unique: true, slug: id,
    })
    expect(findModuleInfoIdentity(index)).toMatchObject({ name, category: type })
  })

  it.each([0.1, 0.2, 0.3, 0.4])('displays Gilded Sniper probability %s as a percentage', (chance) => {
    const description = getModuleTemplate('gilded-sniper')!.description(chance)
    expect(description).toContain(`${chance * 100}%`)
    expect(description).toContain('On enemy death')
    expect(description).toContain('all active coin bonuses')
    expect(description).toContain('even outside their range')
  })

  it('describes the supplied effects without pending placeholders', () => {
    expect(getModuleTemplate('sentry-protocol')!.description(2)).toContain('2 mini orbs')
    expect(getModuleTemplate('tactical-barrage')!.description(14)).toContain('every 14s')
    expect(getModuleTemplate('tactical-barrage')!.baseEffect).toBe("Doubles Smart Missile's Radius and Amplifier lab bonuses.")
    expect(getModuleTemplate('infinity-threshold')!.description(2000)).toBe('Free upgrades can grant 2000 extra levels to Damage, Health, and Health Regen.')
    for (const { id } of FACTS) expect(getModuleTemplate(id)!.description()).not.toContain('pending')
  })

})

import { describe, expect, it } from 'vitest'
import { PERKS_APPLIED_TO_ENEMY_BASE } from '../../src/knowledge/compartments/perks'
import { PERK_IMPORT_CATALOG, PERK_UW_INDICES } from '../../src/save/catalogs/perks'

const name = (index: number) =>
  PERK_IMPORT_CATALOG.find(row => row.index === index)?.name ?? ''

describe('perk catalog identities', () => {
  it.each([
    [24, 'golden tower'], [25, 'chain lightning'], [26, 'chrono field'],
    [27, 'black hole'], [28, 'spotlight'], [22, 'death wave'],
    [20, 'smart missiles'], [12, 'game speed'],
  ] as const)('perk %i names %s', (index, expected) => {
    expect(name(index).toLowerCase()).toContain(expected)
  })

  it('keeps enemy-base trade-offs distinct from ultimate weapon perks', () => {
    expect(PERKS_APPLIED_TO_ENEMY_BASE.length).toBeGreaterThan(0)
    for (const index of PERKS_APPLIED_TO_ENEMY_BASE) {
      expect(name(index).toLowerCase(), `perk ${index}`).toMatch(/enem|boss/)
    }
    const ultimateWeaponPerks = new Set<number>(PERK_UW_INDICES)
    expect(PERKS_APPLIED_TO_ENEMY_BASE.filter(index => ultimateWeaponPerks.has(index)))
      .toEqual([])
  })
})

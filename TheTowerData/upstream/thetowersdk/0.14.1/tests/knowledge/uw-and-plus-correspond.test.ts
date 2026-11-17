import { describe, expect, it } from 'vitest'
import { GAME_KNOWLEDGE } from '../../src/knowledge'
import { ULTIMATE_WEAPON_STATS, ULTIMATE_WEAPON_STONE_COST, ULTIMATE_WEAPON_TOTAL_STONE_COST, ULTIMATE_WEAPONS_WITHOUT_COOLDOWN, UW_STONE_TOTAL_RANGE } from '../../src/knowledge/compartments/ultimate-weapons'
import { UW_PLUS_ABILITIES, UW_PLUS_MAX_TIER, UW_PLUS_SHORTHAND, UW_PLUS_UNLOCK_STONE_COST, UW_PLUS_UNLOCK_TOTAL_STONES } from '../../src/knowledge/compartments/uw-plus'

/**
 * The weapons and their enhancements are two compartments describing one
 * system, and they are joined by weapon NAME — the weakest possible key.
 *
 * Both directions are checked. A one-way check passes while one compartment
 * knows a weapon the other has never heard of, which is exactly how `GT+`
 * ended up correctly wired while the other eight resolved to unrelated
 * entities: one right entry hid eight wrong ones, because the resolver always
 * returns its best guess and never admits it is guessing.
 */

const uw = GAME_KNOWLEDGE.compartments.find(c => c.id === 'ultimate-weapons')!
const plus = GAME_KNOWLEDGE.compartments.find(c => c.id === 'uw-plus')!

describe('the two ultimate-weapon compartments correspond', () => {
  it('every UW+ ability names a weapon the weapon catalog has', () => {
    const weapons = new Set(Object.keys(ULTIMATE_WEAPON_STATS))
    const orphans = Object.keys(UW_PLUS_ABILITIES).filter(name => !weapons.has(name))
    expect(orphans, `UW+ abilities whose weapon is unknown:\n  ${orphans.join('\n  ')}`).toEqual([])
  })

  it('every weapon has exactly one UW+ ability — the other direction', () => {
    const withAbility = new Set(Object.keys(UW_PLUS_ABILITIES))
    const missing = Object.keys(ULTIMATE_WEAPON_STATS).filter(name => !withAbility.has(name))
    expect(missing, `weapons with no UW+ ability:\n  ${missing.join('\n  ')}`).toEqual([])
    expect(withAbility.size).toBe(Object.keys(ULTIMATE_WEAPON_STATS).length)
  })

  it('the join is asserted on every ability node, not only tested here', () => {
    const failed = plus.nodes
      .flatMap(n => n.assertions ?? [])
      .filter(a => a.predicate === 'weaponIsInTheUltimateWeaponCatalog' && a.value !== true)
    expect(failed.map(a => a.subject)).toEqual([])
    const asserted = plus.nodes.filter(n => (n.assertions ?? [])
      .some(a => a.predicate === 'weaponIsInTheUltimateWeaponCatalog'))
    expect(asserted).toHaveLength(Object.keys(UW_PLUS_ABILITIES).length)
  })

  it('shorthand is one-to-one, so CL+ cannot mean two things', () => {
    const codes = Object.keys(UW_PLUS_SHORTHAND)
    const weapons = Object.values(UW_PLUS_SHORTHAND)
    expect(new Set(codes).size).toBe(codes.length)
    expect(new Set(weapons).size).toBe(weapons.length)
  })
})

describe('ultimate weapon stone claims hold together', () => {
  it('the unlock ladder has one rung per weapon', () => {
    expect(ULTIMATE_WEAPON_STONE_COST).toHaveLength(Object.keys(ULTIMATE_WEAPON_STATS).length)
    expect(UW_PLUS_UNLOCK_STONE_COST).toHaveLength(Object.keys(UW_PLUS_ABILITIES).length)
  })

  it('the stated unlock totals are the sums of their own ladders', () => {
    expect(ULTIMATE_WEAPON_STONE_COST.reduce((sum, n) => sum + n, 0))
      .toBe(ULTIMATE_WEAPON_TOTAL_STONE_COST)
    expect(UW_PLUS_UNLOCK_STONE_COST.reduce((sum, n) => sum + n, 0))
      .toBe(UW_PLUS_UNLOCK_TOTAL_STONES)
  })

  it('maxing costs are not uniform, which is why the range is recorded', () => {
    expect(UW_STONE_TOTAL_RANGE.max).toBeGreaterThan(UW_STONE_TOTAL_RANGE.min * 2)
  })

  it('every weapon node carries its own numbers', () => {
    const perWeapon = uw.nodes.filter(n => n.id.startsWith('ultimateWeapon.')
      && Object.keys(ULTIMATE_WEAPON_STATS).some(w => n.label === w))
    expect(perWeapon).toHaveLength(Object.keys(ULTIMATE_WEAPON_STATS).length)
    for (const node of perWeapon) {
      expect(node.assertions?.some(a => a.predicate === 'stonesToMaxAllStats'), node.id).toBe(true)
    }
  })

  it('records the two weapons without a cooldown stat', () => {
    expect([...ULTIMATE_WEAPONS_WITHOUT_COOLDOWN].sort()).toEqual(['Chain Lightning', 'Spotlight'])
    for (const name of ULTIMATE_WEAPONS_WITHOUT_COOLDOWN) {
      expect(ULTIMATE_WEAPON_STATS[name]).not.toContain('Cooldown')
    }
  })

  it('agrees on the UW+ tier ceiling', () => {
    // Ability nodes only. The parent `ultimateWeaponPlus` asserts maxTier for
    // the system as a whole, on its own subject, and counting it here made this
    // expect 9 and find 10 — the test being wrong, not the graph.
    const abilityNodes = plus.nodes.filter(n => n.id.startsWith('ultimateWeaponPlus.'))
    const tiers = abilityNodes.flatMap(n => n.assertions ?? []).filter(a => a.predicate === 'maxTier')
    expect(tiers).toHaveLength(Object.keys(UW_PLUS_ABILITIES).length)
    expect(tiers.every(a => a.value === UW_PLUS_MAX_TIER)).toBe(true)
  })
})

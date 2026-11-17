import { describe, expect, it } from 'vitest'
import {
  BUILD_TARGET_GRAMMAR,
  BUILD_TARGET_PERMA_AND_QUANTITY_ARE_DISJOINT,
  BUILD_TARGET_PERMA_WEAPONS,
  BUILD_TARGET_QUANTITY_WEAPONS,
} from '../../src/knowledge/compartments/build-targets'
import {
  ULTIMATE_WEAPON_STATS,
  ULTIMATE_WEAPONS_WITHOUT_COOLDOWN,
} from '../../src/knowledge/compartments/ultimate-weapons'

const WEAPONS = Object.keys(ULTIMATE_WEAPON_STATS)
const has = (weapon: string, stat: string): boolean =>
  ULTIMATE_WEAPON_STATS[weapon]!.includes(stat)

describe('build target shorthand resolves against the real weapons', () => {
  it('gives every initial a weapon that exists, and every weapon an initial', () => {
    const initials = Object.values(BUILD_TARGET_GRAMMAR.weaponInitials)
    for (const weapon of initials) expect(WEAPONS, weapon).toContain(weapon)
    for (const weapon of WEAPONS) expect(initials, weapon).toContain(weapon)
    expect(new Set(initials).size).toBe(WEAPONS.length)
  })
})

describe('perma needs duration as well as cooldown', () => {
  it('is defined for exactly the weapons carrying both stats', () => {
    const both = WEAPONS.filter(w => has(w, 'Duration') && has(w, 'Cooldown'))
    expect([...BUILD_TARGET_PERMA_WEAPONS].sort()).toEqual(both.sort())
    expect(BUILD_TARGET_PERMA_WEAPONS).toHaveLength(4)
  })

  it('has a cooldown clause that no weapon currently exercises', () => {
    // Dropping `&& has(w, 'Cooldown')` from the derivation changes nothing on
    // this catalog: every weapon with a Duration also has a Cooldown. The clause
    // is therefore correct but unproven, and planting its removal fails no test.
    // Stated here so the weakness is visible rather than implied — and so that a
    // weapon gaining Duration without Cooldown fails this and forces a real check.
    const durationWithoutCooldown = WEAPONS.filter(w => has(w, 'Duration') && !has(w, 'Cooldown'))
    expect(durationWithoutCooldown, 'the cooldown clause is now load-bearing — verify it').toEqual([])
  })

  it('excludes more weapons than the missing-cooldown list alone', () => {
    const excluded = WEAPONS.filter(w => !BUILD_TARGET_PERMA_WEAPONS.includes(w))
    expect(excluded.length).toBeGreaterThan(ULTIMATE_WEAPONS_WITHOUT_COOLDOWN.length)
    // The extra exclusions are the ones missing Duration while having Cooldown.
    const durationOnly = excluded.filter(w => has(w, 'Cooldown') && !has(w, 'Duration'))
    expect(durationOnly.length).toBeGreaterThan(0)
    expect(durationOnly).not.toContain('Chain Lightning')
  })
})

describe('perma and quantity never apply to the same weapon', () => {
  it('derives the quantity set from the stat tables', () => {
    expect([...BUILD_TARGET_QUANTITY_WEAPONS].sort())
      .toEqual(WEAPONS.filter(w => has(w, 'Quantity')).sort())
  })

  it('partitions all nine weapons between the two sets', () => {
    expect(BUILD_TARGET_PERMA_AND_QUANTITY_ARE_DISJOINT).toBe(true)
    const overlap = BUILD_TARGET_PERMA_WEAPONS
      .filter(w => BUILD_TARGET_QUANTITY_WEAPONS.includes(w))
    expect(overlap).toEqual([])
    expect(BUILD_TARGET_PERMA_WEAPONS.length + BUILD_TARGET_QUANTITY_WEAPONS.length)
      .toBe(WEAPONS.length)
  })

  it('makes a compound like PDW3 unsatisfiable, which is the point', () => {
    expect(BUILD_TARGET_QUANTITY_WEAPONS).toContain('Death Wave')
    expect(BUILD_TARGET_PERMA_WEAPONS).not.toContain('Death Wave')
    // And the reverse: the classic PBHGT target is well formed.
    expect(BUILD_TARGET_PERMA_WEAPONS).toContain('Black Hole')
    expect(BUILD_TARGET_PERMA_WEAPONS).toContain('Golden Tower')
  })
})

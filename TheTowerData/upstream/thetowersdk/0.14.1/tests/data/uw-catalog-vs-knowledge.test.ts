import { describe, expect, it } from 'vitest'
import { ULTIMATE_WEAPON_STATS } from '../../src/knowledge/compartments/ultimate-weapons'
import { UW_PLUS_ABILITIES } from '../../src/knowledge/compartments/uw-plus'
import { uwStoneChartData } from '../../src/data/ultimate-weapons/stones.data'

/**
 * The stone catalog and the knowledge compartments describe the same nine weapons from two
 * different sources — the catalog from game data, the compartments from the wiki. Nothing
 * joined them, and a scratch script (`probe-uw.ts`) was the only thing that had ever
 * compared them. That is how the catalog once named the wrong upgrade for eight of the nine
 * weapons: every weapon still had four plausible stat names, so it read as correct.
 *
 * The two disagree on base-stat wording on purpose — the wiki says "Bonus" and "Speed
 * Reduction" where the catalog says "Multiplier" and "Speed" — so this does NOT assert the
 * base names match. It asserts the part that is unambiguous: the catalog carries the three
 * base stats plus exactly one more, and that extra one is the weapon's UW+ ability.
 */

const catalogStatsByWeapon = new Map(
  (Object.values(uwStoneChartData) as Array<{ name: string, stats?: Array<{ name: string }> }>)
    .map(weapon => [weapon.name, (weapon.stats ?? []).map(stat => stat.name)]),
)

describe('the UW stone catalog corresponds to the UW knowledge', () => {
  const weapons = Object.keys(ULTIMATE_WEAPON_STATS)

  it('covers all nine weapons in both sources', () => {
    expect(weapons.length).toBe(9)
    const missing = weapons.filter(name => !catalogStatsByWeapon.has(name))
    expect(missing, `weapons absent from the stone catalog:\n  ${missing.join('\n  ')}`).toEqual([])
  })

  it('gives each weapon its base stats plus exactly one extra', () => {
    for (const weapon of weapons) {
      const base = ULTIMATE_WEAPON_STATS[weapon]!
      const catalog = catalogStatsByWeapon.get(weapon)!
      expect(catalog.length, `${weapon} stat count`).toBe(base.length + 1)
    }
  })

  it('makes that extra stat the weapon own UW+ ability, not a neighbour of it', () => {
    const wrong: string[] = []
    for (const weapon of weapons) {
      const catalog = catalogStatsByWeapon.get(weapon)!
      const expected = (UW_PLUS_ABILITIES as Record<string, { name: string }>)[weapon]?.name
      const actual = catalog[catalog.length - 1]
      if (expected !== actual) wrong.push(`${weapon}: expected ${expected}, catalog has ${actual}`)
    }
    expect(wrong, `UW+ upgrade mismatches:\n  ${wrong.join('\n  ')}`).toEqual([])
  })

  it('never gives two weapons the same UW+ upgrade', () => {
    const extras = weapons.map(weapon => {
      const catalog = catalogStatsByWeapon.get(weapon)!
      return catalog[catalog.length - 1]
    })
    expect(new Set(extras).size, `duplicated upgrades: ${extras.join(', ')}`).toBe(extras.length)
  })
})

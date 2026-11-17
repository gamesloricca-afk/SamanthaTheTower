import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { computeModuleStat } from '../../src/data/modules/bonus'
import { MODULE_RARITIES } from '../../src/data/modules/levels'

/**
 * Checks our module stat curve against the Effective Paths reference.
 *
 * The sheet's "base stat" is the LEVEL 1 value, not a level 0 base. That is
 * worth stating plainly because the two tables look like they disagree by a
 * flat 0.002 on every Cannon rarity -- 0.01 against 0.012 -- until you notice
 * the tab's own "Increase / lvl" section gives level 1 exactly that 0.002.
 * They agree; they are quoting different levels.
 */

interface ModuleReference {
  rarities: Array<{ rarity: string; levelOneStats: Record<string, number> }>
}

const reference = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'fixtures', 'data', 'effective-paths-module-base-stats.json'), 'utf8'),
) as ModuleReference

/** The sheet writes "Rare+" and "Ancestral 1*" where our labels are "Rare +" and "Ancestral 1". */
const toOurRarity = (name: string): string => name
  .replace(/\s*\*$/, '')
  .replace(/\+$/, ' +')
  .replace(/\s+/g, ' ')
  .trim()

const COLUMN_TO_TYPE = {
  'Cannon Damage': 'cannon',
  'Armor Hp': 'armor',
  'Generator Coin': 'generator',
  'Core UW': 'core',
} as const

describe('module stats against the Effective Paths reference', () => {
  it('names the same fifteen rarities', () => {
    const theirs = reference.rarities.map(entry => toOurRarity(entry.rarity))
    expect(theirs).toEqual([...MODULE_RARITIES])
  })

  it('agrees on the level 1 stat for every rarity and module type', () => {
    const mismatches: string[] = []
    let compared = 0

    for (const entry of reference.rarities) {
      const rarityLabel = toOurRarity(entry.rarity)
      for (const [column, type] of Object.entries(COLUMN_TO_TYPE)) {
        const theirs = entry.levelOneStats[column]
        if (!Number.isFinite(theirs)) continue
        compared += 1
        // computeModuleStat returns a multiplier, so 1 + the stat.
        const ours = computeModuleStat({ type, rarityLabel, level: 1 }) - 1
        // The sheet quotes three decimals.
        if (Math.abs(ours - theirs) >= 5e-4) {
          mismatches.push(`${entry.rarity} ${column}: ours=${ours.toFixed(4)} reference=${theirs.toFixed(4)}`)
        }
      }
    }

    expect(mismatches).toEqual([])
    // 15 rarities x 4 module types.
    expect(compared).toBe(60)
  })

  it('applies the ancestral star bonus the way the reference does', () => {
    // Ancestral 1* reads 0.314 against Ancestral's 0.302, which is 0.302 x 1.04
    // -- our multiplicative 4%-per-star, not a flat additive step.
    const base = computeModuleStat({ type: 'cannon', rarityLabel: 'Ancestral', level: 1 }) - 1
    const oneStar = computeModuleStat({ type: 'cannon', rarityLabel: 'Ancestral 1', level: 1 }) - 1
    expect(oneStar).toBeCloseTo(base * 1.04, 3)
  })
})

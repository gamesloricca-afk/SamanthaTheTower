/**
 * A sheet whose rows are named after `Object.prototype` members.
 *
 * Every alias table in these readers is a plain object indexed by a name the
 * SHEET supplied. `TABLE[name]` walks the prototype chain, so a row called
 * `toString`, `constructor` or `valueOf` resolves to a native function — which
 * is truthy and is neither null nor undefined, so `if (alias)` and `?? name`
 * both wave it through. It is then handed to `normalizeName`, and the import
 * dies on `name.trim is not a function`.
 *
 * That is not a corrupted value: one odd row in one block failed the player's
 * ENTIRE import. Six lookups shared the flaw, across labs, workshop,
 * enhancements, perks, bots and module substats.
 *
 * These readers are public package surface, so this is pinned here rather than
 * only in the site's suite.
 */
import { describe, expect, it } from 'vitest'
import { aliasFor } from '../../src/save/ids/grid'
import {
  readIdsPerks,
} from '../../src/save/ids/import-collections'
import {
  readIdsCards,
  readIdsWorkshop,
} from '../../src/save/ids/import-domains'
import {
  readIdsEnhancements,
  readIdsGuardians,
} from '../../src/save/ids/import-progression'
import { readIdsLabs, resolveIdsLabSaveIndex } from '../../src/save/ids/import'
import { readIdsModules } from '../../src/save/ids/import-modules'

const POISON = ['toString', 'constructor', 'valueOf', 'hasOwnProperty', '__proto__', 'isPrototypeOf']

/** A block whose name column is nothing but prototype members. */
function poisonBlock(heading: string): unknown[][] {
  const grid: unknown[][] = [[heading], ['Preset 1']]
  for (const name of POISON) grid.push([name, 5, 5, 5, 5])
  return grid
}

describe('aliasFor', () => {
  it('refuses an inherited member', () => {
    for (const name of POISON) {
      expect(aliasFor({}, name), `${name} resolved through the prototype`).toBeNull()
    }
  })

  it('still returns a name the table really declares', () => {
    // The guard must not cost the aliases that exist, or every table is dead.
    expect(aliasFor({ 'Damage R.': 'Damage Reduction' }, 'Damage R.')).toBe('Damage Reduction')
  })

  it('returns null rather than a value from further up the chain', () => {
    const table = Object.create({ toString: 'inherited' }) as Record<string, string>
    table.Real = 'own'
    expect(aliasFor(table, 'toString')).toBeNull()
    expect(aliasFor(table, 'Real')).toBe('own')
  })
})

describe('every reader survives a sheet named after the prototype', () => {
  const READERS: Array<[name: string, run: (grid: unknown[][]) => unknown]> = [
    ['labs', grid => readIdsLabs(grid)],
    ['workshop', grid => readIdsWorkshop(grid)],
    ['enhancements', grid => readIdsEnhancements(grid)],
    ['cards', grid => readIdsCards(grid)],
    ['guardians', grid => readIdsGuardians(grid)],
    ['perks', grid => readIdsPerks(grid)],
    ['modules', grid => readIdsModules(grid)],
  ]
  const HEADINGS = ['Labs', 'WS', 'WS+', 'Cards', 'Guardians', 'Perks Preset', 'Modules']

  for (const [name, run] of READERS) {
    it(`${name} does not throw`, () => {
      for (const heading of HEADINGS) {
        expect(() => run(poisonBlock(heading)), `${name} threw on a "${heading}" block`)
          .not.toThrow()
      }
    })
  }

  it('resolves an inherited lab name to nothing rather than crashing', () => {
    for (const name of POISON) {
      expect(() => resolveIdsLabSaveIndex(name)).not.toThrow()
      expect(resolveIdsLabSaveIndex(name), `${name} matched a real lab`).toBeNull()
    }
  })

  it('reads a real row on a sheet that also holds poisoned ones', () => {
    // A reader that refused the whole block would pass every assertion above
    // and be useless.
    const grid: unknown[][] = [['Labs'], ['Preset 1'], ...POISON.map(n => [n, 5]), ['Health', 7]]
    const labs = readIdsLabs(grid)
    expect(labs.rows.find(row => row.name === 'Health')?.level).toBe(7)
  })
})

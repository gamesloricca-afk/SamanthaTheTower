import { describe, expect, it } from 'vitest'

import * as data from '../../src/data'
import * as save from '../../src/save'
import { DATA_TABLE_SCHEMAS } from '../../src/data/reference/validate'

/**
 * How much of the data surface has a declared schema, said out loud.
 *
 * `DATA_TABLE_SCHEMAS` described itself as "every public data export", and its test as validating
 * "every public data table". Both hold eleven entries. There are 138 exported tables.
 *
 * The count is not the problem — writing a schema means reading a table and stating its real
 * shape, and a guessed one is worse than none because it passes. The problem was the word "every",
 * which stops a reader asking whether their table is covered. Someone adding a catalog reads that
 * sentence and concludes the validation already includes them.
 *
 * So this measures instead of claiming. Two directions, both able to fail:
 *
 * - The floor moves one way. If coverage drops, a schema was deleted and something is now
 *   unvalidated that used to be checked.
 * - Every declared schema must name a table that exists, or the registry is describing exports
 *   that are gone — the same drift, in the other direction.
 *
 * There is deliberately no upper bound. Filling the gap in is welcome and must never fail a build.
 */

const publicApi: Record<string, unknown> = { ...data, ...save }

/**
 * An exported value shaped like a table: rows of objects, or a record of them.
 *
 * Deliberately conservative. A scalar, a function or an array of strings is not what a row schema
 * describes, and counting them would inflate the gap into something nobody would ever work down.
 */
function looksLikeATable(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0 && typeof value[0] === 'object' && value[0] !== null
  }
  if (!value || typeof value !== 'object') return false

  const values = Object.values(value as Record<string, unknown>)
  return values.length > 0 && values.every(entry => entry !== null && typeof entry === 'object')
}

const tables = Object.entries(publicApi)
  .filter(([name]) => !name.startsWith('_'))
  .filter(([, value]) => looksLikeATable(value))
  .map(([name]) => name)

/** The coverage that existed when this was written. It may rise; it must not fall. */
const FLOOR = 11

describe('the schema registry says what it actually covers', () => {
  it('found the data surface', () => {
    expect(tables.length).toBeGreaterThan(100)
  })

  it('never covers less than it did', () => {
    const covered = Object.keys(DATA_TABLE_SCHEMAS).filter(name => tables.includes(name))

    expect(
      covered.length,
      `schema coverage fell below ${FLOOR} — a table that was validated no longer is`,
    ).toBeGreaterThanOrEqual(FLOOR)
  })

  it('declares no schema for a table that does not exist', () => {
    /*
     * The other drift. A schema naming a deleted export validates nothing and reads as coverage,
     * which is worse than an honest gap because it inflates the number above.
     */
    const orphaned = Object.keys(DATA_TABLE_SCHEMAS).filter(name => publicApi[name] === undefined)

    expect(orphaned, 'declared schemas for exports that are gone').toEqual([])
  })

  /*
   * There was a fourth case here, asserting that no docblock in this directory describes the
   * registry as "every public data export" — guarding the WORD, since the count above would have
   * stayed green through the entire time the claim was false.
   *
   * It was removed because it failed immediately, on the docblock explaining the fix: a regex over
   * prose cannot tell an assertion from a quotation of the assertion being retracted. Any future
   * writing about this bug would trip it, and a guard that fires on a correct explanation of a
   * fixed defect is one the next person deletes rather than understands.
   *
   * The measurement is the guard. It is weaker against a misleading sentence and it is honest
   * about what it checks, which is the better trade.
   */
})

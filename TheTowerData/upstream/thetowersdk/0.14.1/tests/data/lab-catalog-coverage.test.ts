import { describe, expect, it } from 'vitest'
import { labLevelTableLookupNames } from '../../src/data/labs/categories'
import { LAB_CATALOG } from '../../src/data/labs/catalog.data'
import { LAB_RESEARCH_BY_INDEX } from '../../src/data/labs/research'

/**
 * Every lab in the research catalog needs a level table somewhere, or the
 * tracker renders it with a real level and cap but 0 for every time, gem and
 * coin column -- which reads as "this lab is free".
 *
 * The catalog is keyed inconsistently by history: some labs are filed under a
 * slug (occasionally the site's older name), others under a display name with
 * punctuation. This checks coverage across all of them so a lab cannot silently
 * lose its costs again.
 */

/** Ignores case, separators and punctuation: `a_b_c` and "A B - C" are the same lab. */
const matchKey = (value: string): string => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '')

const catalogSlugs = [...new Set(
  LAB_RESEARCH_BY_INDEX.map(record => record.slug).filter((slug): slug is string => Boolean(slug)),
)]

const tableKeys = new Set(
  LAB_CATALOG.filter(lab => lab.levels?.length).flatMap(lab => [
    matchKey(lab.slug),
    matchKey(lab.name),
  ]),
)

/**
 * Asks the same way the tracker does, via labLevelTableLookupNames, rather than
 * re-deriving the alias list. A test that builds its own lookup can pass while
 * the real one misses.
 */
function hasLevelTable(slug: string): boolean {
  return labLevelTableLookupNames(slug).some(name => tableKeys.has(matchKey(name)))
}

/**
 * Labs with no level tables in the SDK catalog or Effective Paths reference.
 * Their costs and times remain unavailable until verified tables are supplied.
 * Shrinking this list is the goal; growing it silently is the regression.
 *
 * Was twelve. Six were closed by checking the catalog against the Effective
 * Paths reference, and they split evenly between the two failure modes:
 *
 * - Mispointed, data already present. berserker_mastery and
 *   recovery_package_mastery are filed as "Berzerker Mastery" and "Recovery
 *   Package Chance Mastery"; both now have aliases.
 * - Genuinely missing, now acquired. The three enemy Health labs share the
 *   Attack cost/time table exactly, and wave_skip_mastery shares the card
 *   mastery table (its effect value is still unknown -- see labs-catalog).
 *
 * The six that remain are absent from the Effective Paths reference too.
 * Resolving their names alone cannot supply the missing cost and time tables.
 */
const KNOWN_MISSING_LEVEL_TABLES = [
  'armor_stats',
  'black_hole_ignore_protector',
  'cannon_stats',
  'core_stats',
  'first_trade_off_choice',
  'generator_stats',
]

describe('lab catalog coverage', () => {
  it('finds a level table for every lab except the known missing tables', () => {
    const missing = catalogSlugs.filter(slug => !hasLevelTable(slug)).sort()
    expect(missing).toEqual([...KNOWN_MISSING_LEVEL_TABLES].sort())
  })

  it('matches punctuation-insensitively, which is what the static tables need', () => {
    // "Assist Module Bonus - Armor" against assist_module_bonus_armor. The dash
    // is why 61 labs looked like they had no cost data.
    expect(matchKey('Assist Module Bonus - Armor')).toBe(matchKey('assist_module_bonus_armor'))
    expect(hasLevelTable('assist_module_bonus_armor')).toBe(true)
    expect(hasLevelTable('enhancement_attack_coin_discount')).toBe(true)
    expect(hasLevelTable('dissonant_echo_defense')).toBe(true)
  })

  it('resolves labs whose generated table uses the older site name', () => {
    // coins_wave's 99 levels are stored as coins_per_wave.
    expect(hasLevelTable('coins_wave')).toBe(true)
    expect(hasLevelTable('basic_enemy_health')).toBe(true)
    expect(hasLevelTable('super_crit_mult')).toBe(true)
  })

  it('keeps the missing list honest about its size', () => {
    // A guard against quietly adding entries instead of adding data. It only
    // ever ratchets down.
    expect(KNOWN_MISSING_LEVEL_TABLES.length).toBeLessThanOrEqual(6)
  })
})

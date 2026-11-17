import { describe, expect, it } from 'vitest'
import {
  ECONOMY_DISCOUNT_LEVEL_KEYS,
  ECONOMY_STONE_LEVEL_REFS,
  ECONOMY_STONE_SHARED_KEYS,
  ECONOMY_TIME_LEVEL_KEYS,
  ZERO_EFFECTIVE_ECONOMY_LEVELS,
} from '../../src/mechanics/effective-paths/eecon-levels'
import { EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH } from '../../src/mechanics/effective-paths/eecon-candidates'

/**
 * The pairing between each candidate matrix and the level it moves.
 *
 * This is the check that earned its place on the damage side: the lists are
 * paired by position, and a single missed entry shifts everything after it so
 * the planner optimises the wrong level while looking entirely healthy.
 */

describe('every candidate has a level, and every level a candidate', () => {
  it('pairs the time path', () => {
    expect(ECONOMY_TIME_LEVEL_KEYS).toHaveLength(EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH.time.length)
    for (const key of ECONOMY_TIME_LEVEL_KEYS)
      expect(ZERO_EFFECTIVE_ECONOMY_LEVELS.time, key).toHaveProperty(key)
  })

  it('pairs the stone path', () => {
    expect(ECONOMY_STONE_LEVEL_REFS).toHaveLength(EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH.stone.length)
    for (const ref of ECONOMY_STONE_LEVEL_REFS)
      expect(ZERO_EFFECTIVE_ECONOMY_LEVELS[ref.band], `${ref.band}.${ref.key}`)
        .toHaveProperty(ref.key)
  })

  it('pairs the discount path', () => {
    expect(ECONOMY_DISCOUNT_LEVEL_KEYS)
      .toHaveLength(EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH.discount.length)
    for (const key of ECONOMY_DISCOUNT_LEVEL_KEYS)
      expect(ZERO_EFFECTIVE_ECONOMY_LEVELS.discount, key).toHaveProperty(key)
  })

  it('leaves no level without a candidate to move it', () => {
    // The other direction: a key nothing can buy is either dead or a candidate
    // that was missed when the matrix was transcribed.
    const claimed = new Set([
      ...ECONOMY_TIME_LEVEL_KEYS.map(key => `time.${key}`),
      ...ECONOMY_STONE_LEVEL_REFS.map(ref => `${ref.band}.${ref.key}`),
      ...ECONOMY_DISCOUNT_LEVEL_KEYS.map(key => `discount.${key}`),
    ])

    for (const band of ['time', 'stone', 'discount'] as const)
      for (const key of Object.keys(ZERO_EFFECTIVE_ECONOMY_LEVELS[band]))
        expect(claimed, `${band}.${key}`).toContain(`${band}.${key}`)
  })
})

describe('the eight shared between the two earning tabs', () => {
  it('points the stone path at the time path’s masteries', () => {
    /**
     * A card mastery is one lab level whatever ranks it. The stone tab ranks
     * these five with a stone price from the AX ROI cells — giving them stone
     * levels of their own would let a plan buy the same level twice.
     */
    const shared = ECONOMY_STONE_LEVEL_REFS.filter(ref => ref.band === 'time')
    expect(shared.map(ref => ref.key)).toEqual([...ECONOMY_STONE_SHARED_KEYS])
  })

  it('keeps the three assist capacities as stone levels of their own', () => {
    // These are not shared: the stone-bought slot efficiency is a different
    // quantity from the lab of the same name, and the two add.
    for (const key of [
      'assistBonusGeneratorStone',
      'assistSubstatGeneratorStone',
      'assistSubstatCoreStone',
    ]) {
      expect(ECONOMY_STONE_LEVEL_REFS.some(ref => ref.band === 'stone' && ref.key === key), key)
        .toBe(true)
    }
  })

  it('names the stone-only levels apart from the time ones', () => {
    // A shared name across bands is how the damage port nearly double-counted
    // an assist capacity; the `Stone` suffix makes it impossible to confuse.
    const timeKeys = new Set<string>(ECONOMY_TIME_LEVEL_KEYS)
    for (const key of Object.keys(ZERO_EFFECTIVE_ECONOMY_LEVELS.stone))
      expect(timeKeys.has(key), key).toBe(false)
  })
})

describe('the matrix order is the tie-break order', () => {
  it('starts each path where the sheet starts it', () => {
    // The planner breaks a tie by taking the earliest, which is the sheet
    // taking the leftmost column — so first place is load-bearing.
    expect(EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH.time[0].sheetName).toBe('Coins / Kill Bonus')
    expect(ECONOMY_TIME_LEVEL_KEYS[0]).toBe('coinsPerKillBonus')

    expect(EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH.stone[0].sheetName).toBe('GT Bonus')
    expect(ECONOMY_STONE_LEVEL_REFS[0].key).toBe('goldenTowerBonusStone')

    expect(EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH.discount[0].sheetName).toBe('Workshop Utility Discount')
    expect(ECONOMY_DISCOUNT_LEVEL_KEYS[0]).toBe('workshopUtilityDiscount')
  })
})

import { describe, expect, it } from 'vitest'
import { LAB_CATALOG } from '../../src/data/labs/catalog.data'
import {
  labCoinCostToReachLevel,
  labDurationDaysToReachLevel,
  labMaxCatalogLevel,
} from '../../src/mechanics/effective-paths/lab-costs'

/**
 * Levels are read from the catalog's own `level` field, never from position.
 *
 * The two are not the same. Most labs list level 1 first, but every Card
 * Mastery and the Dissonant Echo pair — thirty-five in all — list a **level 0**
 * row, free and instant, before it.
 *
 * Reading by position therefore did three things at once, none of which
 * failed loudly: it reported one level more than exists, it charged every
 * level the price of the one below, and it made the first level of every
 * mastery look free. A player with Super Tower Mastery maxed at 9 kept being
 * told to buy level 10.
 */

const catalogOf = (name: string) =>
  (LAB_CATALOG as unknown as Array<{ name: string, levels: Array<{ level: number }> }>)
    .find(entry => entry.name === name)

describe('labs whose table starts at level 0', () => {
  it('there are some, so this is worth guarding', () => {
    const zeroBased = (LAB_CATALOG as unknown as Array<{ levels: Array<{ level: number }> }>)
      .filter(entry => entry.levels?.[0]?.level === 0)

    expect(zeroBased.length).toBeGreaterThan(30)
  })

  it('reports the highest level, not the number of rows', () => {
    // Ten rows, nine levels. The row count was the old answer.
    const catalog = catalogOf('Super Tower Mastery')
    expect(catalog?.levels).toHaveLength(10)
    expect(labMaxCatalogLevel('Super Tower Mastery')).toBe(9)
  })

  it('never offers a level past the maximum', () => {
    expect(labCoinCostToReachLevel('Super Tower Mastery', 10)).toBeNull()
    expect(labDurationDaysToReachLevel('Super Tower Mastery', 10)).toBeNull()
  })

  it('does not price the first level as free', () => {
    // `levels[0]` is the level 0 row — cost 0, duration 0s. Read as level 1 it
    // made every mastery's first level look instant and free.
    const cost = labCoinCostToReachLevel('Super Tower Mastery', 1)
    expect(cost).toBeGreaterThan(0)
    expect(labDurationDaysToReachLevel('Super Tower Mastery', 1)).toBeGreaterThan(0)
  })

  it('charges each level its own price, not the one below', () => {
    const catalog = LAB_CATALOG.find(entry => entry.name === 'Super Tower Mastery')
    const rowFor = (level: number) => catalog?.levels.find(row => row.level === level)

    for (const level of [1, 5, 9]) {
      expect(labCoinCostToReachLevel('Super Tower Mastery', level))
        .toBeCloseTo(rowFor(level)?.cost ?? -1, 6)
    }
  })
})

describe('labs whose table starts at level 1', () => {
  it('is unaffected', () => {
    // The great majority. If this moved, the fix broke the common case.
    expect(labMaxCatalogLevel('Damage')).toBe(100)
    expect(labMaxCatalogLevel('Range')).toBe(80)
    expect(labCoinCostToReachLevel('Damage', 1)).toBeGreaterThan(0)
  })
})

describe('every lab in the catalog', () => {
  it('reports a maximum its own table actually contains', () => {
    for (const entry of LAB_CATALOG as unknown as Array<{ name: string, levels: Array<{ level: number }> }>) {
      if (!entry.levels?.length) continue
      const max = labMaxCatalogLevel(entry.name)
      expect(entry.levels.some(row => row.level === max), entry.name).toBe(true)
      expect(entry.levels.some(row => row.level === max + 1), entry.name).toBe(false)
    }
  })
})

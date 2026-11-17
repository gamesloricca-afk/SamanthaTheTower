import { describe, expect, it } from 'vitest'
import fixtures from '../../fixtures/mechanics/effective-paths-workshop-values.fixtures.json'
import {
  EFFECTIVE_HEALTH_WORKSHOP_STATS,
  WORKSHOP_STAT_MAPPINGS,
  WORKSHOP_STATS_ABSENT_FROM_SHEET,
  WORKSHOP_STATS_DIVERGING_FROM_SHEET,
  workshopStatMaxLevel,
  workshopStatsWithSheetMapping,
  workshopStatValue,
} from '../../src/mechanics/effective-paths/workshop-values'

/**
 * Workshop values against the sheet.
 *
 * Every sample was read from the live spreadsheet's `DVT_WS_VALUE`, so this
 * checks both halves of the conversion at once: that a stat is looked up under
 * the name the sheet knows it by, and that its value comes back in the sheet's
 * units rather than this package's.
 */
describe('workshop values against the sheet', () => {
  it('converts every sampled value into the sheet\'s units', () => {
    const mismatches: string[] = []
    let checked = 0

    for (const sample of fixtures.samples) {
      const mapping = (WORKSHOP_STAT_MAPPINGS as Record<string, { sheetName: string }>)[sample.sdkKey]
      // Samples cover every spelling probed, including ones that turned out to
      // be wrong; only compare the mapping we settled on.
      if (!mapping || mapping.sheetName !== sample.sheetName) continue

      const looked = workshopStatValue(sample.sdkKey, sample.level)
      if (!looked) {
        mismatches.push(`${sample.sdkKey} L${sample.level}: no value`)
        continue
      }
      checked++

      const scale = Math.max(Math.abs(sample.sheetValue), 1e-12)
      // Stored as float32, so the agreement is to about seven digits, not full
      // double precision.
      if (Math.abs(looked.value - sample.sheetValue) / scale > 1e-6) {
        mismatches.push(
          `${sample.sdkKey} L${sample.level}: sheet=${sample.sheetValue} sdk=${looked.value}`,
        )
      }
    }

    expect(mismatches).toEqual([])
    expect(checked).toBeGreaterThan(100)
  })

  it('covers the five stats the eHP model needs', () => {
    for (const stat of Object.values(EFFECTIVE_HEALTH_WORKSHOP_STATS)) {
      expect(WORKSHOP_STAT_MAPPINGS[stat], stat).toBeDefined()
      expect(workshopStatValue(stat, 0), stat).not.toBeNull()
    }
  })

  it('gets the workshop values the eHP fixtures were built on', () => {
    // The path fixture's fresh account opens with a workshop health of 5, and
    // defense absolute of 0 — the sheet's level-0 values.
    expect(workshopStatValue('Health', 0)?.value).toBe(5)
    expect(workshopStatValue('Defense Absolute', 0)?.value).toBe(0)
    expect(workshopStatValue('Max Recovery', 0)?.value).toBe(1.5)
    // Percentages come back as fractions, not as numbers out of 100.
    expect(workshopStatValue('Wall Health', 0)?.value).toBeCloseTo(0.2, 12)
    expect(workshopStatValue('Defense Percent', 10)?.value).toBeCloseTo(0.05, 9)
  })

  it('carries the coin and cash price of each level', () => {
    const health = workshopStatValue('Health', 1)
    expect(health?.coinCost).toBe(55)
    expect(health?.cashCost).toBe(12)
  })
})

describe('what it refuses to convert', () => {
  it('returns null where the sheet and the game disagree', () => {
    // Cash Bonus grows 1% a level in the game data and 0.01% in the sheet.
    // There is no scale that reconciles those, so neither is served as if it
    // were the other.
    for (const stat of WORKSHOP_STATS_DIVERGING_FROM_SHEET) {
      expect(workshopStatValue(stat, 5), stat).toBeNull()
    }
    expect(WORKSHOP_STATS_DIVERGING_FROM_SHEET).toHaveLength(7)
  })

  it('keeps the diverging stats out of the mapping entirely', () => {
    for (const stat of WORKSHOP_STATS_DIVERGING_FROM_SHEET) {
      expect(WORKSHOP_STAT_MAPPINGS[stat], stat).toBeUndefined()
    }
    for (const stat of WORKSHOP_STATS_ABSENT_FROM_SHEET) {
      expect(WORKSHOP_STAT_MAPPINGS[stat], stat).toBeUndefined()
    }
  })

  it('does not let a diverging stat reach the eHP model', () => {
    const needed = new Set<string>(Object.values(EFFECTIVE_HEALTH_WORKSHOP_STATS))
    for (const stat of WORKSHOP_STATS_DIVERGING_FROM_SHEET) {
      expect(needed.has(stat), `${stat} feeds eHP and diverges`).toBe(false)
    }
  })

  it('returns null for an unknown stat or an impossible level', () => {
    expect(workshopStatValue('Nonsense', 1)).toBeNull()
    expect(workshopStatValue('Health', -1)).toBeNull()
    expect(workshopStatValue('Health', 1.5)).toBeNull()
    expect(workshopStatValue('Health', 999999)).toBeNull()
  })
})

describe('level coverage', () => {
  it('reports where each stat\'s table stops', () => {
    // The stats cap at different levels, which is why this is read rather than
    // assumed to be the same everywhere.
    expect(workshopStatMaxLevel('Health')).toBe(6000)
    expect(workshopStatMaxLevel('Defense Absolute')).toBe(5000)
    expect(workshopStatMaxLevel('Wall Health')).toBe(1800)
    expect(workshopStatMaxLevel('Max Recovery')).toBe(500)
    expect(workshopStatMaxLevel('Nonsense')).toBeNull()
  })

  it('serves the last level and refuses the one past it', () => {
    const max = workshopStatMaxLevel('Max Recovery') as number
    expect(workshopStatValue('Max Recovery', max)).not.toBeNull()
    expect(workshopStatValue('Max Recovery', max + 1)).toBeNull()
  })

  it('maps forty stats, and says which it cannot', () => {
    expect(workshopStatsWithSheetMapping()).toHaveLength(40)
    expect(WORKSHOP_STATS_DIVERGING_FROM_SHEET.length + WORKSHOP_STATS_ABSENT_FROM_SHEET.length)
      .toBe(8)
  })
})

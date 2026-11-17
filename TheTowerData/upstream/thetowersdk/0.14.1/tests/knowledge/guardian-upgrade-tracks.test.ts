import { describe, expect, it } from 'vitest'
import { guardianUpgrades } from '../../src/data/guardians/upgrades.data'
import {
  GUARDIAN_CHEAPEST_CHIP_TO_MAX,
  GUARDIAN_CHIP_TOTAL_COST,
  GUARDIAN_IRREGULAR_COST_COLUMNS,
  GUARDIAN_UPGRADE_TRACKS,
  guardianCostColumn,
} from '../../src/knowledge/compartments/guardian'

const TABLES = guardianUpgrades as unknown as Record<string, Record<string, unknown>[]>

describe('guardian upgrade tracks', () => {
  it('gives every chip exactly three tracks', () => {
    const chips = Object.keys(TABLES)
    expect(chips).toHaveLength(6)
    for (const chip of chips) {
      expect(GUARDIAN_UPGRADE_TRACKS.filter(t => t.chip === chip), chip).toHaveLength(3)
    }
  })

  it('has a max level BELOW the row count on two tracks of every chip', () => {
    for (const [chip, rows] of Object.entries(TABLES)) {
      const tracks = GUARDIAN_UPGRADE_TRACKS.filter(t => t.chip === chip)
      const shorter = tracks.filter(t => t.maxLevel < rows.length)
      expect(shorter, `${chip} should have two tracks shorter than its ${rows.length} rows`)
        .toHaveLength(2)
      // And one that is exactly the row count — that is why the length misleads.
      expect(tracks.some(t => t.maxLevel === rows.length), chip).toBe(true)
    }
  })

  it('stops each track at its last non-null value', () => {
    for (const { chip, track, maxLevel } of GUARDIAN_UPGRADE_TRACKS) {
      const rows = TABLES[chip]!
      expect(rows[maxLevel - 1]?.[track], `${chip}.${track} at max`).not.toBeNull()
      if (maxLevel < rows.length) {
        expect(rows[maxLevel]?.[track], `${chip}.${track} past max`).toBeNull()
      }
    }
  })

  it('names the cost column correctly, including the two that break convention', () => {
    for (const { chip, track } of GUARDIAN_UPGRADE_TRACKS) {
      const column = guardianCostColumn(track)
      expect(TABLES[chip]![0], `${chip}.${track} -> ${column}`).toHaveProperty(column)
    }
    // The convention alone is not enough: these two would miss.
    for (const track of Object.keys(GUARDIAN_IRREGULAR_COST_COLUMNS)) {
      const chip = GUARDIAN_UPGRADE_TRACKS.find(t => t.track === track)!.chip
      expect(TABLES[chip]![0]).not.toHaveProperty(`${track}Cost`)
      expect(guardianCostColumn(track)).not.toBe(`${track}Cost`)
    }
  })

  it('charges nothing for level 1 and something for every level after', () => {
    for (const { chip, track, maxLevel } of GUARDIAN_UPGRADE_TRACKS) {
      const column = guardianCostColumn(track)
      expect(TABLES[chip]![0]![column], `${chip}.${track} level 1`).toBe(0)
      if (maxLevel > 1) {
        expect(Number(TABLES[chip]![maxLevel - 1]![column]), `${chip}.${track} at max`)
          .toBeGreaterThan(0)
      }
    }
  })

  it('makes the cheapest chip cheap by a wide margin, not by a rounding error', () => {
    const cheapest = GUARDIAN_CHIP_TOTAL_COST[GUARDIAN_CHEAPEST_CHIP_TO_MAX]!
    const others = Object.entries(GUARDIAN_CHIP_TOTAL_COST)
      .filter(([chip]) => chip !== GUARDIAN_CHEAPEST_CHIP_TO_MAX)
      .map(([, cost]) => cost)
    expect(Math.min(...others) / cheapest).toBeGreaterThan(1.8)
  })

  it('totals each chip from its own tracks and nothing else', () => {
    for (const [chip, total] of Object.entries(GUARDIAN_CHIP_TOTAL_COST)) {
      const summed = GUARDIAN_UPGRADE_TRACKS
        .filter(t => t.chip === chip)
        .reduce((sum, t) => sum + t.totalCost, 0)
      expect(total, chip).toBe(summed)
      expect(total, chip).toBeGreaterThan(0)
    }
  })
})

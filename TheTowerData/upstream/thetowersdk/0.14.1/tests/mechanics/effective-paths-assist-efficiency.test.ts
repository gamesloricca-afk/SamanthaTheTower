import { describe, expect, it } from 'vitest'
import {
  ASSIST_LAB_MAX_LEVEL,
  ASSIST_MULTIPLIER_MAX_EFFICIENCY,
  ASSIST_MULTIPLIER_MAX_STONE_LEVEL,
  ASSIST_SUBSTAT_MAX_EFFICIENCY,
  ASSIST_SUBSTAT_MAX_STONE_LEVEL,
  assistEfficiency,
  assistEfficiencyStoneCost,
  cumulativeAssistEfficiencyStoneCost,
  maxStoneLevel,
} from '../../src/mechanics/effective-paths/assist-efficiency'
import { assistSubstatCap } from '../../src/mechanics/effective-paths/generics'
import {
  ASSIST_BONUS_MAX_LEVEL,
  ASSIST_SUBSTAT_MAX_LEVEL,
  assistUpgradeStoneCost,
} from '../../src/mechanics/effective-paths/stone-costs'
import fixtures from '../../fixtures/mechanics/effective-paths-assist-efficiency.fixtures.json'

/**
 * Assist module efficiency, against `Data_Val_Tables!EO:ET` — the sheet's own
 * ladder, every rung of it.
 *
 * This corner has hidden three separate porting errors, so the table is
 * checked row by row rather than by spot-checking the formula.
 */

describe('the stone ladder, row by row', () => {
  it('has a hundred levels', () => {
    expect(fixtures.rows).toHaveLength(100)
    expect(fixtures.rows[0].level).toBe(0)
    expect(fixtures.rows.at(-1)?.level).toBe(99)
  })

  for (const row of fixtures.rows) {
    it(`matches level ${row.level}`, () => {
      // The efficiency is (level + 1)%, which is where the leading 1 in every
      // `(1 + stone + lab)` comes from.
      expect(assistEfficiency({ hasAssist: true, stoneLevel: row.level, labLevel: 0 }))
        .toBeCloseTo(row.efficiencyPct, 12)

      if (row.level >= 1) {
        expect(assistEfficiencyStoneCost('multiplier', row.level)).toBe(row.multiplierCost)
        // The substat ladder simply stops: no price past 69.
        expect(assistEfficiencyStoneCost('substat', row.level)).toBe(row.substatCost)
      }
    })
  }
})

describe('the two caps', () => {
  it('stops the substat ladder at 69 and the multiplier at 99', () => {
    expect(maxStoneLevel('substat')).toBe(ASSIST_SUBSTAT_MAX_STONE_LEVEL)
    expect(maxStoneLevel('multiplier')).toBe(ASSIST_MULTIPLIER_MAX_STONE_LEVEL)
    expect(assistEfficiencyStoneCost('substat', 70)).toBeNull()
    expect(assistEfficiencyStoneCost('multiplier', 100)).toBeNull()
    // The sheet's table agrees: no substat price past 69.
    expect(fixtures.rows.filter(row => row.substatCost !== null).at(-1)?.level).toBe(69)
  })

  it('lands a maxed multiplier at 130% and a maxed substat at 100%', () => {
    // The multiplier can exceed a primary module; the substats cannot.
    expect(assistEfficiency({
      hasAssist: true,
      stoneLevel: ASSIST_MULTIPLIER_MAX_STONE_LEVEL,
      labLevel: ASSIST_LAB_MAX_LEVEL,
    })).toBeCloseTo(ASSIST_MULTIPLIER_MAX_EFFICIENCY, 12)

    expect(assistEfficiency({
      hasAssist: true,
      stoneLevel: ASSIST_SUBSTAT_MAX_STONE_LEVEL,
      labLevel: ASSIST_LAB_MAX_LEVEL,
    })).toBeCloseTo(ASSIST_SUBSTAT_MAX_EFFICIENCY, 12)
  })
})

describe('what the rest of the port already does', () => {
  it('agrees with EPG_ASSIST_SUB_CAP everywhere', () => {
    // Same quantity, two names — the generic the damage columns call and the
    // one this module documents. They must not drift.
    for (const stone of [0, 1, 17, 69, 99]) {
      for (const lab of [0, 7, 30]) {
        expect(assistEfficiency({ hasAssist: true, stoneLevel: stone, labLevel: lab }))
          .toBeCloseTo(assistSubstatCap(true, stone, lab), 12)
      }
    }
    expect(assistEfficiency({ hasAssist: false, stoneLevel: 99, labLevel: 30 }))
      .toBe(assistSubstatCap(false, 99, 30))
  })

  it('is zero without a module, not the bare one percent', () => {
    expect(assistEfficiency({ hasAssist: false, stoneLevel: 0, labLevel: 0 })).toBe(0)
    expect(assistEfficiency({ hasAssist: true, stoneLevel: 0, labLevel: 0 })).toBeCloseTo(0.01, 12)
  })
})

describe('cumulative cost', () => {
  it('sums the ladder', () => {
    expect(cumulativeAssistEfficiencyStoneCost('multiplier', 0, 3)).toBe(15 + 18 + 21)
    expect(cumulativeAssistEfficiencyStoneCost('multiplier', 2, 3)).toBe(21)
    expect(cumulativeAssistEfficiencyStoneCost('multiplier', 3, 3)).toBe(0)
  })

  it('refuses a target past the kind’s own cap', () => {
    expect(cumulativeAssistEfficiencyStoneCost('substat', 0, 70)).toBeNull()
    expect(cumulativeAssistEfficiencyStoneCost('multiplier', 0, 70)).not.toBeNull()
  })
})

describe('one source of truth for the caps', () => {
  it('agrees with the eHP stone-cost module, which predates this one', () => {
    // Two modules describing the same ladder is a drift risk; this is the
    // assertion that catches it.
    expect(ASSIST_SUBSTAT_MAX_STONE_LEVEL).toBe(ASSIST_SUBSTAT_MAX_LEVEL)
    expect(ASSIST_MULTIPLIER_MAX_STONE_LEVEL).toBe(ASSIST_BONUS_MAX_LEVEL)

    for (const level of [1, 2, 25, 69, 99]) {
      expect(assistUpgradeStoneCost(level), `level ${level}`)
        .toBe(assistEfficiencyStoneCost('multiplier', level))
    }
  })
})

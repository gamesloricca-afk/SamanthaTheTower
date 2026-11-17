import { describe, expect, it } from 'vitest'
import { ELITE_SPAWN_CHANCE_ROWS } from '../../src/data/charts/data'
import { MAX_CAMPAIGN_TIER } from '../../src/data/tiers/campaign'
import { eliteSpawnChanceAtWave } from '../../src/mechanics/enemies/elite-spawn-chance'
import {
  ELITE_SPAWN_CHANCE_MISSING_CELLS,
  ELITE_SPAWN_CHANCE_TIER_BLOCKS,
  ELITE_SPAWN_CHANCE_TIER_RATIO,
  eliteSpawnDoublePercentAtRow,
  eliteSpawnSinglePercentAtRow,
} from '../../src/knowledge/compartments/enemies'

const cell = (row: number, tier: number): number =>
  Number.parseInt(String(ELITE_SPAWN_CHANCE_ROWS[row]?.[2 + tier - 1] ?? ''), 10)

const pct = (row: number, col: 0 | 1): number =>
  Number.parseInt(String(ELITE_SPAWN_CHANCE_ROWS[row]?.[col] ?? '').replace('%', ''), 10)

describe('elite spawn chance — the laws behind the table', () => {
  it('reproduces both percent columns from the square series', () => {
    for (let row = 0; row < ELITE_SPAWN_CHANCE_ROWS.length; row += 1) {
      expect(pct(row, 1), `single at row ${row}`).toBe(eliteSpawnSinglePercentAtRow(row))
      expect(pct(row, 0), `double at row ${row}`).toBe(eliteSpawnDoublePercentAtRow(row))
    }
  })

  it('is quadratic, not linear — the claim the trap rests on', () => {
    // If the series were linear these two gaps would be equal. They are 1 and 19.
    const lowGap = eliteSpawnSinglePercentAtRow(2) - eliteSpawnSinglePercentAtRow(1)
    const highGap = eliteSpawnSinglePercentAtRow(10) - eliteSpawnSinglePercentAtRow(9)
    expect(lowGap).toBe(3)
    expect(highGap).toBe(19)
  })

  it('reproduces every threshold inside each tier block from its base and the ratio', () => {
    for (const block of ELITE_SPAWN_CHANCE_TIER_BLOCKS) {
      for (let row = 1; row < ELITE_SPAWN_CHANCE_ROWS.length; row += 1) {
        const base = cell(row, block.from)
        for (let tier = block.from; tier <= block.to; tier += 1) {
          const got = cell(row, tier)
          if (!Number.isFinite(got)) {
            // Only the recorded holes are allowed to be absent.
            expect(
              ELITE_SPAWN_CHANCE_MISSING_CELLS.some(c => c.row === row && c.tier === tier),
              `unrecorded missing cell at row ${row}, tier ${tier}`,
            ).toBe(true)
            continue
          }
          const want = Math.round(base * ELITE_SPAWN_CHANCE_TIER_RATIO ** (tier - block.from))
          expect(Math.abs(got - want), `row ${row} tier ${tier}: ${got} vs ${want}`)
            .toBeLessThanOrEqual(1)
        }
      }
    }
  })

  it('does NOT hold across the seam — one series over all tiers would be wrong', () => {
    const [first, second] = ELITE_SPAWN_CHANCE_TIER_BLOCKS
    const seamRatios = [2, 3, 6, 12].map(row => cell(row, second.from) / cell(row, first.to))
    // Inside a block every one of these would be exactly the ratio. Across the seam
    // they are neither the ratio nor equal to each other.
    for (const r of seamRatios) expect(Math.abs(r - ELITE_SPAWN_CHANCE_TIER_RATIO)).toBeGreaterThan(0.04)
    expect(Math.max(...seamRatios) - Math.min(...seamRatios)).toBeGreaterThan(0.2)
  })
})

describe('elite spawn chance — the recorded holes', () => {
  it('records exactly the cells that are actually absent', () => {
    const found: { row: number, tier: number }[] = []
    for (let row = 0; row < ELITE_SPAWN_CHANCE_ROWS.length; row += 1) {
      for (let tier = 1; tier <= MAX_CAMPAIGN_TIER; tier += 1) {
        if (!Number.isFinite(cell(row, tier))) found.push({ row, tier })
      }
    }
    expect(found).toEqual([...ELITE_SPAWN_CHANCE_MISSING_CELLS])
  })

  it('shows the hole as a higher tier reporting LESS elite chance than a lower one', () => {
    const wave = 30
    const lower = eliteSpawnChanceAtWave(21, wave).singleSpawnPct
    expect(lower).toBeGreaterThan(0)
    for (const { tier } of ELITE_SPAWN_CHANCE_MISSING_CELLS) {
      expect(eliteSpawnChanceAtWave(tier, wave).singleSpawnPct, `tier ${tier}`).toBe(0)
    }
    // The monotonicity that SHOULD hold, stated so that filling the cells fails
    // this test and forces the oracle note to be updated with it.
    const stillBroken = ELITE_SPAWN_CHANCE_MISSING_CELLS
      .every(({ tier }) => eliteSpawnChanceAtWave(tier, wave).singleSpawnPct < lower)
    expect(stillBroken, 'holes filled — update ELITE_SPAWN_CHANCE_MISSING_CELLS and the trap')
      .toBe(true)
  })

  it('leaves every tier without a hole monotone at that wave', () => {
    const holed = new Set(ELITE_SPAWN_CHANCE_MISSING_CELLS.map(c => c.tier))
    let previous = 0
    for (let tier = 1; tier <= MAX_CAMPAIGN_TIER; tier += 1) {
      if (holed.has(tier)) continue
      const got = eliteSpawnChanceAtWave(tier, 30).singleSpawnPct
      expect(got, `tier ${tier} below tier ${tier - 1}`).toBeGreaterThanOrEqual(previous)
      previous = got
    }
  })
})

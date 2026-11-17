import { describe, expect, it } from 'vitest'
import {
  buildLabProgressRows,
  buildModuleCostRows,
  buildWorkshopLevelCostRows,
  getSharedToolLabs,
  getWorkshopCostLevelsByKey,
  MODULE_COIN_COSTS,
  MODULE_SHARD_COSTS,
  moduleCostMaxLevel,
  workshopCostMaxLevel,
  WSP_WORKSHOP_COST_LEVELS,
} from '../../src/data'

/**
 * Every cost ladder in this package takes a target level from a caller, and the caller is
 * usually an input box. Two things go wrong when that number is not bounded by the table,
 * and both were live here:
 *
 *   - a level past the end reads as `undefined`, and `|| 0` / `?? 0` prices it at **free**,
 *     so a plan running past the cap comes back too cheap and looks entirely normal;
 *   - the loop runs once per requested level, so a big number in a level box allocates
 *     until the process dies.
 *
 * These are asserted together and generically. A new ladder that repeats either mistake
 * fails here rather than shipping.
 */
describe('cost ladders are bounded by what their table prices', () => {
  const NO_MODIFIERS = { labRelic: 0, labSpeed: 0, labDiscount: 0 }
  const ABSURD = 5_000_000

  /** Each ladder, its cap, and how to ask it for rows. */
  const LADDERS = [
    ...Object.keys(WSP_WORKSHOP_COST_LEVELS).map(key => ({
      name: `workshop ${key}`,
      max: workshopCostMaxLevel(getWorkshopCostLevelsByKey(key)!),
      rows: (from: number, to: number) =>
        buildWorkshopLevelCostRows(getWorkshopCostLevelsByKey(key)!, from, to, 0)
          .map(r => ({ level: r.level, baseCost: r.baseCost })),
    })),
    ...[['coins', MODULE_COIN_COSTS], ['shards', MODULE_SHARD_COSTS]].map(([label, costs]) => ({
      name: `module ${label as string}`,
      max: moduleCostMaxLevel(costs as readonly number[]),
      rows: (from: number, to: number) =>
        buildModuleCostRows(costs as readonly number[], from, to, 0)
          .map(r => ({ level: r.level, baseCost: r.baseCost })),
    })),
    ...getSharedToolLabs().slice(0, 25).map(lab => ({
      name: `lab ${lab.name}`,
      max: Math.max(0, ...lab.levels.map(l => Number(l.level)).filter(Number.isFinite)),
      rows: (from: number, to: number) =>
        buildLabProgressRows(lab, from, to, NO_MODIFIERS)
          .map(r => ({ level: r.level, baseCost: r.coinCost })),
    })),
  ]

  it.each(LADDERS.map(l => [l.name, l] as const))('%s never prices a level past its cap', (_n, ladder) => {
    const rows = ladder.rows(0, ladder.max + 40)
    const past = rows.filter(r => r.level > ladder.max)
    expect(past.slice(0, 3), `${past.length} row(s) past level ${ladder.max}`).toEqual([])
  })

  it.each(LADDERS.map(l => [l.name, l] as const))('%s answers an absurd target promptly', (_n, ladder) => {
    const started = Date.now()
    const rows = ladder.rows(0, ABSURD)
    const elapsed = Date.now() - started
    expect(elapsed, `${elapsed}ms for target ${ABSURD}`).toBeLessThan(500)
    expect(rows.length, 'produced more rows than the table has levels').toBeLessThanOrEqual(ladder.max + 1)
  })

  it('the cap is a real ceiling, not a table that happens to be long', () => {
    // Guards the tests above from passing vacuously on an empty or trivial ladder.
    const workshop = LADDERS.find(l => l.name === 'workshop WSP_ATTACK_SPEED')!
    expect(workshop.max).toBe(75)
    expect(workshop.rows(0, 75).length).toBe(75)
    expect(workshop.rows(0, 200).length).toBe(75)
  })
})

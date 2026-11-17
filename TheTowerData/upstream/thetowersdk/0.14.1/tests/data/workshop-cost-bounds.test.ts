import { describe, expect, it } from 'vitest'
import {
  buildWorkshopLevelCostRows,
  computeWorkshopCostTotal,
  getWorkshopCostLevelsByKey,
  workshopCostMaxLevel,
  WSP_WORKSHOP_COST_LEVELS,
} from '../../src/data'

const KEYS = Object.keys(WSP_WORKSHOP_COST_LEVELS)
const curveFor = (key: string) => getWorkshopCostLevelsByKey(key)!

describe('workshop cost curves are bounded by what they price', () => {
  it('the curves are not all the same length, which is why a shared cap would be wrong', () => {
    const lengths = new Set(KEYS.map(key => workshopCostMaxLevel(curveFor(key))))
    expect(lengths.size).toBeGreaterThan(1)
    // The two short ones this was found through.
    expect(workshopCostMaxLevel(curveFor('WSP_ATTACK_SPEED'))).toBe(75)
    expect(workshopCostMaxLevel(curveFor('WSP_ENEMY_LEVEL_SKIP'))).toBe(60)
  })

  it('never prices a level the curve does not cover', () => {
    /*
     * The regression: `costs[index]` past the end read as `undefined` and was charged at 0,
     * so a plan running past the table came back too cheap and looked entirely normal.
     * Free levels are the failure mode to watch for, so they are what is asserted.
     */
    const free: string[] = []
    for (const key of KEYS) {
      const curve = curveFor(key)
      const max = workshopCostMaxLevel(curve)
      const rows = buildWorkshopLevelCostRows(curve, 0, max + 25, 0)
      for (const row of rows) {
        if (row.level > max) free.push(`${key} level ${row.level}`)
        if (row.baseCost <= 0) free.push(`${key} level ${row.level} costs ${row.baseCost}`)
      }
    }
    expect(free.slice(0, 6), `${free.length} unpriced level(s): ${free.slice(0, 6).join(', ')}`).toEqual([])
  })

  it('stops at the last priced level instead of running to the requested one', () => {
    const curve = curveFor('WSP_ATTACK_SPEED')
    const rows = buildWorkshopLevelCostRows(curve, 0, 100, 0)
    expect(rows.at(-1)?.level).toBe(75)
  })

  it('keeps the total identical, because the dropped rows were the free ones', () => {
    // The clamp must not change any answer that was already right.
    const curve = curveFor('WSP_ATTACK_SPEED')
    const toMax = computeWorkshopCostTotal(curve, 0, 75, 0)
    const past = computeWorkshopCostTotal(curve, 0, 400, 0)
    expect(past).toBe(toMax)
    expect(toMax).toBeGreaterThan(0)
  })

  it('an absurd target returns promptly rather than allocating a row per level', () => {
    /*
     * `Number.MAX_SAFE_INTEGER` in a level box used to run the loop until the heap gave
     * out. A time bound is the honest assertion — the failure was never a wrong value.
     */
    const started = Date.now()
    const rows = buildWorkshopLevelCostRows(curveFor('WSP_DAMAGE'), 0, Number.MAX_SAFE_INTEGER, 0)
    expect(Date.now() - started).toBeLessThan(1000)
    expect(rows.length).toBeLessThanOrEqual(400)
  })

  it('a start past the end buys nothing rather than a run of free levels', () => {
    expect(buildWorkshopLevelCostRows(curveFor('WSP_ATTACK_SPEED'), 90, 120, 0)).toEqual([])
  })
})

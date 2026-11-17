import { describe, expect, it } from 'vitest'
import {
  buildWorkshopLevelCostRows,
  getWorkshopCostByKeyAndLevel,
  getWorkshopCostLevelsByKey,
  workshopCostMaxLevel,
  WSP_WORKSHOP_COST_LEVELS,
} from '../../src/data'

/**
 * Two functions in this package index the same cost table differently, and both are right.
 * tower-oracle `workshop.upgradeTable`: "The costs on a row buy the NEXT level... Reading a
 * row's cost as 'what this level cost' is off by one; it is what the next one costs."
 *
 * So the two answer different questions, and the only way that stays true is if the
 * relationship between them is asserted rather than remembered.
 */
describe('the two workshop cost conventions agree, because they are the same table', () => {
  const KEYS = Object.keys(WSP_WORKSHOP_COST_LEVELS)

  it('buying level L costs what is charged at level L-1', () => {
    const mismatches: string[] = []
    for (const key of KEYS) {
      const curve = getWorkshopCostLevelsByKey(key)!
      const max = workshopCostMaxLevel(curve)
      for (const level of [1, 2, 5, Math.floor(max / 2), max]) {
        if (level < 1 || level > max) continue
        const rows = buildWorkshopLevelCostRows(curve, level - 1, level, 0)
        const buyingLevel = rows.at(-1)?.baseCost
        const chargedAtPrevious = getWorkshopCostByKeyAndLevel(key, level - 1)
        if (buyingLevel !== chargedAtPrevious) {
          mismatches.push(`${key} level ${level}: buy=${buyingLevel} chargedAt(${level - 1})=${chargedAtPrevious}`)
        }
      }
    }
    expect(mismatches.slice(0, 5), mismatches.slice(0, 5).join('; ')).toEqual([])
  })

  it('summing what is charged from a to b-1 equals the cost of going from a to b', () => {
    /*
     * This is the workshop tracker's "coins spent" sum. If the two conventions ever drift,
     * the tracker's total and the calculator's total stop agreeing, and neither surface
     * would report it — they would simply show different numbers on different pages.
     */
    const mismatches: string[] = []
    for (const key of KEYS) {
      const curve = getWorkshopCostLevelsByKey(key)!
      const max = workshopCostMaxLevel(curve)
      const from = 3
      const to = Math.min(max, 40)
      if (to <= from) continue

      let summed = 0
      for (let level = from; level < to; level += 1) summed += Number(getWorkshopCostByKeyAndLevel(key, level) || 0)
      const viaRows = buildWorkshopLevelCostRows(curve, from, to, 0).at(-1)?.cumulativeCost ?? 0

      if (summed !== viaRows) mismatches.push(`${key}: summed=${summed} rows=${viaRows}`)
    }
    expect(mismatches.slice(0, 5), mismatches.slice(0, 5).join('; ')).toEqual([])
  })

  it('the off-by-one the oracle warns about is a real difference, not a distinction on paper', () => {
    // If these happened to be equal the two tests above would pass while proving nothing.
    const key = 'WSP_ATTACK_SPEED'
    expect(getWorkshopCostByKeyAndLevel(key, 1)).not.toBe(getWorkshopCostByKeyAndLevel(key, 0))
  })
})

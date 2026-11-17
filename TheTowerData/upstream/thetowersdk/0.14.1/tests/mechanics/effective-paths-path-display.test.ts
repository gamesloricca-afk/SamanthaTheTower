import { describe, expect, it } from 'vitest'
import {
  describePathDisplay,
  labCostCurveName,
  pathDisplayMultiplier,
  pathStepCostCoins,
  pathStepDurationDays,
} from '../../src/mechanics/effective-paths/path-display'

/**
 * Ground truth read straight off `eDamage!D6:L13` with the oracle, values mode.
 *
 * The account loaded on the working copy at the time had the Range lab at 17
 * and the path opening on it, so eight consecutive levels of one lab are the
 * cleanest thing to hold the display layer to: the cost curve, the duration
 * curve and the running sum all advance together, and an off-by-one in any of
 * them shows up on row 1 rather than on row 40.
 */
const SHEET_ROWS = [
  { level: 18, durationDays: 0.7861111111111111, costText: '34.36 K', runningText: '0d 18h 52m' },
  { level: 19, durationDays: 0.8965277777777778, costText: '40.16 K', runningText: '1d 16h 23m' },
  { level: 20, durationDays: 1.0152777777777777, costText: '46.54 K', runningText: '2d 16h 45m' },
  { level: 21, durationDays: 1.1430555555555555, costText: '53.53 K', runningText: '3d 20h 11m' },
  { level: 22, durationDays: 1.2805555555555554, costText: '61.16 K', runningText: '5d  2h 55m' },
  { level: 23, durationDays: 1.426388888888889, costText: '69.46 K', runningText: '6d 13h  9m' },
  { level: 24, durationDays: 1.5819444444444444, costText: '78.43 K', runningText: '8d  3h  7m' },
  { level: 25, durationDays: 1.7472222222222222, costText: '88.12 K', runningText: '9d 21h  3m' },
] as const

/** `LABCOST_SINGLE_ADJUSTED("Range", 17)` etc, evaluated on the sheet. */
const SHEET_COSTS = [34360, 40160] as const

const daysToDHM = (days: number) => {
  const total = Math.round(days * 24 * 60)
  return { d: Math.floor(total / 1440), h: Math.floor((total % 1440) / 60), m: total % 60 }
}

describe('the path display layer', () => {
  it('reproduces the duration column, which indexes by the displayed level', () => {
    const mismatches: string[] = []
    for (const row of SHEET_ROWS) {
      const ours = pathStepDurationDays('Range', row.level)
      if (ours === null || Math.abs(ours - row.durationDays) > 1e-12) {
        mismatches.push(`level ${row.level}: got ${ours}, sheet ${row.durationDays}`)
      }
    }
    // Named, never counted — the level IS the diagnosis.
    expect(mismatches).toEqual([])
  })

  it('reproduces the cost column, which indexes by the level BELOW it', () => {
    /*
     * The whole point of the pair of tests. `LABCOST_SINGLE_ADJUSTED("Range", 17)`
     * is 34,360 and `(…, 18)` is 40,160, so a port that indexed cost the way it
     * indexes duration would show every row the NEXT step's price and still look
     * like a plausible table.
     */
    expect(pathStepCostCoins('Range', 18)).toBe(SHEET_COSTS[0])
    expect(pathStepCostCoins('Range', 19)).toBe(SHEET_COSTS[1])
    // And the whole column, not two rows of it.
    const rows = describePathDisplay(SHEET_ROWS.map(r => ({ name: 'Range', level: r.level })))
    expect(rows.map(r => r.costCoins))
      .toEqual([34360, 40160, 46540, 53530, 61160, 69460, 78430, 88120])
  })

  it('is not the same index — proved by planting the off-by-one', () => {
    // If these ever coincide the two tests above stop discriminating, and the
    // guard is worth nothing.
    expect(pathStepCostCoins('Range', 18)).not.toBe(pathStepCostCoins('Range', 19))
    expect(pathStepDurationDays('Range', 18)).not.toBe(pathStepDurationDays('Range', 17))
  })

  it('accumulates running time the way the sheet prints it', () => {
    const rows = describePathDisplay(SHEET_ROWS.map(r => ({ name: 'Range', level: r.level })))
    const mismatches: string[] = []
    for (let i = 0; i < rows.length; i += 1) {
      const { d, h, m } = daysToDHM(rows[i].runningTimeDays as number)
      const printed = `${d}d ${String(h).padStart(2, ' ')}h ${String(m).padStart(2, ' ')}m`
      if (printed !== SHEET_ROWS[i].runningText) {
        mismatches.push(`row ${i + 1}: got "${printed}", sheet "${SHEET_ROWS[i].runningText}"`)
      }
    }
    expect(mismatches).toEqual([])
  })

  it('folds any Mastery onto the Card Mastery curve', () => {
    // `IF(ISNUMBER(SEARCH("Mastery", name)), "Card Mastery", name)` — SEARCH is
    // case-insensitive, and every one of these appears as a real upgrade name.
    expect(labCostCurveName('Damage Mastery')).toBe('Card Mastery')
    expect(labCostCurveName('Critical Chance Mastery')).toBe('Card Mastery')
    expect(labCostCurveName('Ultimate Crit Mastery')).toBe('Card Mastery')
    expect(labCostCurveName('Range')).toBe('Range')
    expect(labCostCurveName('Damage / Meter')).toBe('Damage / Meter')
  })

  it('reads the speed toggle as the string the cell holds', () => {
    // `eDamage!L5` is the text "x1"; `D5` is `RIGHT($L$5, LEN($L$5)-1)`.
    expect(pathDisplayMultiplier('x1')).toBe(1)
    expect(pathDisplayMultiplier('x24')).toBe(24)
    expect(pathDisplayMultiplier(1)).toBe(1)
    // A toggle nobody set must not divide the column to nothing.
    expect(pathDisplayMultiplier('x0')).toBe(1)
    expect(pathDisplayMultiplier('')).toBe(1)
  })

  it('scales the displayed ROI by the same toggle', () => {
    const [row] = describePathDisplay([{ name: 'Range', level: 18, roi: 0.0338 }],
      { speedToggle: 'x24' })
    expect(row.roi).toBeCloseTo(0.0338 * 24, 12)
  })

  it('returns null, never zero, for an upgrade with no lab curve', () => {
    /*
     * A stone or a module has no lab cost. Returning 0 would make it the
     * cheapest thing on the board and put it at the top of every path -- the
     * shape of defect this repo keeps finding, where a missing number reads as
     * a small one.
     */
    const [row] = describePathDisplay([{ name: 'SL Angle', level: 3 }])
    expect(row.costCoins).toBeNull()
    expect(row.durationDays).toBeNull()
    expect(row.cumulativeCost).toBeNull()
    expect(row.runningTimeDays).toBeNull()
  })

  it('prices coin-per-time off the level below, as EPP_LAB_CPX does', () => {
    const [perDay] = describePathDisplay([{ name: 'Range', level: 18 }], { costMode: 'Coin/Day' })
    const [perHour] = describePathDisplay([{ name: 'Range', level: 18 }], { costMode: 'Coin/H' })
    /*
     * Evaluated on the sheet, both branches:
     *
     *   ROUND(LABCOST("Range",17) / (LABDURATION("Range",17)/1) / 1,  2) = 50231.88
     *   ROUND(LABCOST("Range",17) / (LABDURATION("Range",17)/1) / 24, 2) =  2092.99
     *
     * Asserted exactly, and NOT as `hourly === daily / 24`: `ROUND` is applied
     * inside each branch, so the two are rounded independently and the identity
     * is false by 0.005. The first version of this test asserted the identity
     * and failed on the rounding rather than on the port -- a test checking a
     * claim derived from itself instead of the source it is porting.
     */
    expect(perDay.coinPerTime).toBe(50231.88)
    expect(perHour.coinPerTime).toBe(2092.99)
    // In `Cost` mode the column is the cost, and CPX is not computed at all.
    const [cost] = describePathDisplay([{ name: 'Range', level: 18 }], { costMode: 'Cost' })
    expect(cost.coinPerTime).toBeNull()
  })
})

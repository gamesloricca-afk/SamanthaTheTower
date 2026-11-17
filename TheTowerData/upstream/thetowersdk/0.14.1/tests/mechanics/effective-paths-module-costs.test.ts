import { describe, expect, it } from 'vitest'
import { moduleUpgradeCoinCost, moduleUpgradeMaxFromLevel } from '../../src/mechanics/effective-paths/coin-costs'

/**
 * The module cost table, held to the sheet — including where the sheet is wrong.
 *
 * `Data_Val_Tables!EV` has 299 entries and so does ours. The spot values below
 * were read back from the live sheet with `INDEX(Data_Val_Tables!EV4:EV, level)`
 * — the sheet's own lookup — rather than by counting rows in a range read,
 * because counting rows got the answer wrong first and made a faithful table
 * look shifted.
 *
 * ## Why anyone comes here
 *
 * These numbers look broken from the UI. A late account with every economy lab
 * at its cap has one candidate left with headroom, a generator module around
 * level 250, and the sheet prices that level at 4.65e19 coins — which at a
 * trillion coins an hour is over a million days per level. That is the sheet's
 * own answer, not a porting error, and this file is the evidence.
 */
describe('module upgrade coins, against the sheet', () => {
  const SHEET: ReadonlyArray<readonly [number, number]> = [
    [192, 1.61e15],
    [200, 2.5e15],
    [220, 2.65e17],
    [240, 1e18],
    [253, 4.65e19],
    [280, 4.11e20],
    [299, 8.86e20],
  ]

  it('prices the levels the sheet prices', () => {
    expect(moduleUpgradeMaxFromLevel()).toBe(299)
    for (const [level, cost] of SHEET) {
      expect(moduleUpgradeCoinCost(level), `level ${level}`).toBe(cost)
    }
  })

  it('keeps the sheet’s transposed value at level 281', () => {
    /*
     * A real error in the source, reproduced deliberately.
     *
     * The run either side is smooth — 371.5, 391, 411, ?, 452.5, 474 (×1e18),
     * with differences 19.5, 20, 20.5, 21, 21.5 — which puts level 281 at
     * 431.5e18. The sheet holds 413.5e18: the same digits, transposed. It makes
     * level 281 about 4% cheap and the step after it correspondingly steep.
     *
     * Not corrected here. Parity with the sheet is the contract, and a port
     * that quietly disagrees with its source is worse than one that reproduces
     * a typo and says where it is. When the sheet is fixed this test fails,
     * which is the point of writing it down rather than leaving a comment.
     */
    expect(moduleUpgradeCoinCost(281)).toBe(4.135e20)
    // What the surrounding run says it should have been.
    expect(moduleUpgradeCoinCost(281)).not.toBe(4.315e20)
  })
})

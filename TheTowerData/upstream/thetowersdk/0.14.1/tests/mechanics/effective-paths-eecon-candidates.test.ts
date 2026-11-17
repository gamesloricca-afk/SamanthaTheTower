import { describe, expect, it } from 'vitest'
import {
  EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH,
  EFFECTIVE_ECONOMY_DISCOUNT_CANDIDATES,
  EFFECTIVE_ECONOMY_OUTPUT_CELL_BY_PATH,
  EFFECTIVE_ECONOMY_STONE_CANDIDATES,
  EFFECTIVE_ECONOMY_TIME_CANDIDATES,
} from '../../src/mechanics/effective-paths/eecon-candidates'

/**
 * The econ candidate lists, checked for the ways a transcription goes wrong.
 *
 * A list is only useful if it is complete and in the sheet's order — the
 * planner breaks ties by taking the earliest, which is the sheet taking the
 * leftmost column. A silently dropped or reordered entry changes the path
 * without changing anything that looks broken.
 */

const ALL = [
  ['time', EFFECTIVE_ECONOMY_TIME_CANDIDATES, 24] as const,
  ['stone', EFFECTIVE_ECONOMY_STONE_CANDIDATES, 19] as const,
  ['discount', EFFECTIVE_ECONOMY_DISCOUNT_CANDIDATES, 6] as const,
]

describe('the three matrices', () => {
  for (const [variant, list, count] of ALL) {
    it(`has the ${variant} path's ${count}`, () => {
      expect(list).toHaveLength(count)
      expect(EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH[variant]).toBe(list)
    })

    it(`keeps the ${variant} path's columns contiguous and in order`, () => {
      // The matrix is one spilled `EPP_MATRIX` call over a contiguous range, so
      // a gap or a jump means a column was missed or transcribed twice.
      const toNumber = (column: string) =>
        [...column].reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0)

      const columns = list.map(entry => toNumber(entry.column))
      for (const [index, column] of columns.entries()) {
        if (index === 0) continue
        expect(column, `${list[index].sheetName} after ${list[index - 1].sheetName}`)
          .toBe(columns[index - 1] + 1)
      }
    })

    it(`names every ${variant} candidate exactly once`, () => {
      const names = list.map(entry => entry.sheetName)
      expect(new Set(names).size, names.join(', ')).toBe(names.length)
      for (const name of names) expect(name.trim()).toBe(name)
    })
  }
})

describe('what the three paths actually optimise', () => {
  it('does not pretend the discount path is comparable to the other two', () => {
    // eEcon and eEcon Stones both maximise coins per kill. The discount path
    // maximises coins *saved*, so ranking one against the others is a category
    // error rather than a close call.
    expect(EFFECTIVE_ECONOMY_OUTPUT_CELL_BY_PATH.time.metric)
      .toBe(EFFECTIVE_ECONOMY_OUTPUT_CELL_BY_PATH.stone.metric)
    expect(EFFECTIVE_ECONOMY_OUTPUT_CELL_BY_PATH.discount.metric).toBe('coins saved')
  })

  it('records where each tab writes its answer', () => {
    for (const [variant] of ALL) {
      const output = EFFECTIVE_ECONOMY_OUTPUT_CELL_BY_PATH[variant]
      expect(output.tab).toBeTruthy()
      expect(output.cell).toMatch(/^[A-Z]+\d+$/)
    }
  })
})

describe('the overlaps the port will have to handle', () => {
  it('shares eight candidates between the time and stone paths', () => {
    /**
     * Three assist capacities and five card masteries appear on both tabs.
     *
     * They are one level scored two ways, not two levels: the stone tab ranks
     * the masteries off a single user-supplied cell rather than computing an
     * ROI, so a player can weigh a mastery against a stone purchase. A plan
     * that treated them as separate would let the same level be bought twice.
     */
    const time = new Set(EFFECTIVE_ECONOMY_TIME_CANDIDATES.map(entry => entry.sheetName))
    const shared = EFFECTIVE_ECONOMY_STONE_CANDIDATES
      .filter(entry => time.has(entry.sheetName))
      .map(entry => entry.sheetName)

    expect(shared).toEqual([
      'Assist Module Bonus - Generator',
      'Assist Module Substats - Generator',
      'Assist Module Substats - Core',
      'Coins Mastery',
      'Extra Orb Mastery',
      'Wave Skip Mastery',
      'Intro Sprint Mastery',
      'Wave Accelerator Mastery',
    ])
  })

  it('shares nothing with the discount path', () => {
    const earning = new Set([
      ...EFFECTIVE_ECONOMY_TIME_CANDIDATES,
      ...EFFECTIVE_ECONOMY_STONE_CANDIDATES,
    ].map(entry => entry.sheetName))

    for (const entry of EFFECTIVE_ECONOMY_DISCOUNT_CANDIDATES)
      expect(earning.has(entry.sheetName), entry.sheetName).toBe(false)
  })
})

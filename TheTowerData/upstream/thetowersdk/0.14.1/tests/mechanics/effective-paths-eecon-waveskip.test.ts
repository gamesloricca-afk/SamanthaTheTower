import { describe, expect, it } from 'vitest'
import {
  waveSkipChance,
  waveSkipFreeUpgrades,
  waveSkipTimeSaved,
} from '../../src/mechanics/effective-paths/eecon-stats'
import fixtures from '../../fixtures/mechanics/effective-paths-eecon-waveskip.fixtures.json'

/**
 * The Wave Skip lookup, against the sheet's own `EP_HELPER` table.
 *
 * Two of these three differ only in which row of the table they read — one sums
 * `k × chance(k)` and the other `k × chance(k - 1)` — so they are checked apart
 * rather than assumed to share an answer.
 */

interface Case {
  skip?: number
  skips?: number
  has: boolean
  lvl: number
  hasM: boolean
  mLvl: number
  wam?: number
  isd?: number
  sheet: number
}

const data = fixtures as unknown as {
  table: Record<string, number[]>
  cardWs: Case[]
  wsFup: Case[]
  wsm: Case[]
}

describe('the embedded table', () => {
  it('has a row per skip count and a column per card state', () => {
    // Locked, seven card levels, ten mastery levels.
    expect(Object.keys(data.table)).toHaveLength(14)
    for (const row of Object.values(data.table)) expect(row).toHaveLength(18)
  })

  it('is a probability distribution down each column', () => {
    /**
     * Every column sums to 1 across the skip counts — that is what makes it a
     * distribution rather than a table of independent chances.
     *
     * To five places rather than more: the sheet stores these already rounded,
     * and the worst column is out by 6e-7. That is a property of the source
     * data, not of the port, and tightening this would only assert that the
     * spreadsheet carries more precision than it does.
     */
    for (let column = 0; column < 18; column++) {
      const total = Object.values(data.table)
        .reduce((sum, row) => sum + row[column], 0)
      expect(total, `column ${column}`).toBeCloseTo(1, 5)
    }
  })
})

describe('EPC_CARD_WS', () => {
  for (const [index, c] of data.cardWs.entries()) {
    it(`matches case ${index}`, () => {
      expect(waveSkipChance(c.skip as number, c.has, c.lvl, c.hasM, c.mLvl))
        .toBeCloseTo(c.sheet, 10)
    })
  }

  it('never skips without the card', () => {
    // The Locked column, which reads 100% at zero skips rather than zero
    // everywhere — a player without the card always skips nothing.
    expect(waveSkipChance(0, false, 7, true, 9)).toBeCloseTo(1, 10)
    expect(waveSkipChance(3, false, 7, true, 9)).toBeCloseTo(0, 10)
  })

  it('reads the mastery columns rather than the card ones once unlocked', () => {
    // Mastery 0 is a different column from card level 7, and the table says so.
    expect(waveSkipChance(1, true, 7, true, 0))
      .not.toBeCloseTo(waveSkipChance(1, true, 7, false, 0), 6)
  })

  it('is zero past the end of the table', () => {
    expect(waveSkipChance(14, true, 7, true, 9)).toBe(0)
  })
})

describe('EPC_WS_FUP', () => {
  for (const [index, c] of data.wsFup.entries()) {
    it(`matches case ${index}`, () => {
      expect(waveSkipFreeUpgrades(c.skips as number, c.has, c.lvl, c.hasM, c.mLvl))
        .toBeCloseTo(c.sheet, 9)
    })
  }
})

describe('EPC_WSM', () => {
  for (const [index, c] of data.wsm.entries()) {
    it(`matches case ${index}`, () => {
      expect(waveSkipTimeSaved(
        c.skips as number, c.has, c.lvl, c.hasM, c.mLvl, c.wam as number, c.isd as number,
      )).toBeCloseTo(c.sheet, 6)
    })
  }

  it('saves nothing without the card', () => {
    expect(waveSkipTimeSaved(13, false, 7, true, 9, 6500, 100)).toBe(0)
  })
})

describe('the two sums are a row apart', () => {
  it('does not give the same answer for the same inputs', () => {
    // `EPC_WSM` weights `chance(k)` and `EPC_WS_FUP` weights `chance(k - 1)`.
    // Treating them as one function would be wrong by a whole row of the table.
    const args = [6, true, 5, false, 0] as const
    expect(waveSkipFreeUpgrades(...args))
      .not.toBeCloseTo(waveSkipTimeSaved(...args, 1, 0), 6)
  })
})

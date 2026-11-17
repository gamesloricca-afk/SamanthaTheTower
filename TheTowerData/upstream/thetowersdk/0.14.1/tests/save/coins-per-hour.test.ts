import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  COINS_PER_HOUR_RUN_SAMPLE,
  computeCoinsPerHourFromSaveRoot,
} from '../../src/save/battle/history'
import { decodePlayerInfoSaveBytes } from '../../src/node/decode-save'

/**
 * Coins per hour, against the derivation the game documents.
 *
 * `player_save_format.json` states it exactly: mean of the three best runs in
 * battle history, each run contributing `coinsEarned / (realTime / 3600)`,
 * runs missing either field dropped, sorted descending, top three averaged.
 *
 * The arithmetic is asserted against hand-computed numbers rather than by
 * re-running the implementation, so a changed constant fails instead of being
 * reproduced on both sides.
 */

/** A run whose rate is exactly `coinsPerHour`, via realTime in seconds. */
const runAt = (coinsPerHour: number, seconds = 3600) => ({
  tier: 1,
  coinsEarned: coinsPerHour * (seconds / 3600),
  realTime: seconds,
})

const rootWith = (runs: unknown[]) => ({ battleHistory: { _items: runs } })

describe('coins per hour', () => {
  it('averages the three best runs', () => {
    // Best three are 900, 500, 400 → 1800 / 3 = 600. The 100 is ignored.
    const root = rootWith([runAt(100), runAt(900), runAt(400), runAt(500)])
    expect(computeCoinsPerHourFromSaveRoot(root)).toBe(600)
  })

  it('averages fewer than three when that is all there is', () => {
    expect(computeCoinsPerHourFromSaveRoot(rootWith([runAt(300), runAt(100)]))).toBe(200)
    expect(computeCoinsPerHourFromSaveRoot(rootWith([runAt(250)]))).toBe(250)
  })

  it('converts from seconds, not minutes or hours', () => {
    // 1000 coins in 360 s is 10,000/hour. A wrong divisor changes this.
    const root = rootWith([{ tier: 1, coinsEarned: 1000, realTime: 360 }])
    expect(computeCoinsPerHourFromSaveRoot(root)).toBe(10_000)
  })

  it('drops runs missing either field rather than counting them as zero', () => {
    /*
     * The distinction that matters: a dropped run does not participate, while
     * a run counted as zero would drag the mean down and quietly understate
     * the rate.
     */
    const root = rootWith([
      runAt(600),
      { tier: 1, coinsEarned: 5000 }, // no realTime
      { tier: 1, realTime: 3600 }, // no coinsEarned
      { tier: 1, coinsEarned: 0, realTime: 3600 }, // zero coins
    ])
    expect(computeCoinsPerHourFromSaveRoot(root)).toBe(600)
  })

  it('returns null when nothing qualifies', () => {
    expect(computeCoinsPerHourFromSaveRoot(rootWith([]))).toBeNull()
    expect(computeCoinsPerHourFromSaveRoot(rootWith([{ tier: 1 }]))).toBeNull()
    expect(computeCoinsPerHourFromSaveRoot({})).toBeNull()
    expect(computeCoinsPerHourFromSaveRoot(null)).toBeNull()
  })

  it('reads ThisRound economy keys via listImportableBattleRuns normalize', () => {
    const root = rootWith([{
      tier: 1,
      coinsEarnedThisRound: 600,
      realTimeThisRound: 3600,
    }])
    expect(computeCoinsPerHourFromSaveRoot(root)).toBe(600)
  })

  it('samples three, as the game does', () => {
    expect(COINS_PER_HOUR_RUN_SAMPLE).toBe(3)
  })
})

const savePath = process.env.TOWER_TEST_SAVE
const describeSave = savePath && existsSync(savePath) ? describe : describe.skip

describeSave('against a real save', () => {
  it('produces a usable rate', () => {
    const { parsedRoot } = decodePlayerInfoSaveBytes(readFileSync(savePath as string))
    const rate = computeCoinsPerHourFromSaveRoot(parsedRoot)

    expect(rate).not.toBeNull()
    expect(Number.isFinite(rate as number)).toBe(true)
    expect(rate as number).toBeGreaterThan(0)
  })
})

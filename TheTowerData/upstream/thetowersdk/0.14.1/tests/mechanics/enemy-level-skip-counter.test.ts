import { describe, expect, it } from 'vitest'
import { ENEMY_LEVEL_SKIP_COUNTER_THRESHOLD } from '../../src/knowledge/compartments/enemies'
import { simulateEnemyLevelSkips } from '../../src/mechanics/enemies/level-skip'

/**
 * The accumulator, checked against the loop that runs it.
 *
 * Once per wave, for each of the two stats:
 *
 *   counter += chance
 *   if the matching utility upgrade is enabled and counter > 1:
 *       counter -= 1; skips++
 *
 * The threshold is EXCEEDED rather than reached, so
 * the test is strictly greater-than. That last detail is the whole reason this
 * file exists — `>` and `>=` agree everywhere except at exactly 1.0, which is
 * precisely where a maxed build sits.
 */

describe('a skip is a counter crossing 1, not a roll', () => {
  it('turns 50% into every other wave, with no variance', () => {
    const { totalSkips } = simulateEnemyLevelSkips(101, 0.5)
    // 100 waves of accrual at 0.5 -> 50 crossings.
    expect(totalSkips).toBe(50)

    // Deterministic means REPEATABLE, not merely average-correct.
    for (let repeat = 0; repeat < 3; repeat += 1) {
      expect(simulateEnemyLevelSkips(101, 0.5).totalSkips).toBe(totalSkips)
    }
  })

  it('carries the remainder between waves instead of rounding each one', () => {
    /*
     * At 0.3 a per-wave rounding model gives zero skips forever. The counter
     * gives one every fourth wave and keeps the change.
     */
    const { totalSkips, counterRemainder } = simulateEnemyLevelSkips(11, 0.3)
    expect(totalSkips).toBe(3)
    expect(counterRemainder).toBeGreaterThan(0)
    expect(counterRemainder).toBeLessThan(ENEMY_LEVEL_SKIP_COUNTER_THRESHOLD)
  })

  it('uses > and not >=, and this case actually tells them apart', () => {
    /*
     * Getting a discriminating case here took two attempts, and the first one
     * did not discriminate at all — it passed with `>=` planted, which makes it
     * a restatement rather than a test.
     *
     * The two rules only diverge when the counter lands on EXACTLY 1.0, and
     * whether that divergence survives to the total depends on the wave count's
     * parity. At 0.5:
     *
     *   `>`   skips on waves 3, 5, 7 ...  -> floor((w - 1) / 2)
     *   `>=`  skips on waves 2, 4, 6 ...  -> floor(w / 2)
     *
     * Those agree at w = 101 (50 each) and differ at w = 100. So the wave count
     * below is load-bearing; do not round it to a nicer number.
     */
    expect(simulateEnemyLevelSkips(100, 0.5).totalSkips).toBe(49)

    // A chance of exactly 1 takes the `skip >= 1` shortcut, which returns
    // w - 1 — the same answer the strict `>` loop gives, not a special case.
    expect(simulateEnemyLevelSkips(3, 1).totalSkips).toBe(2)
  })

  it('has no chance produce no skips, at any wave count', () => {
    expect(simulateEnemyLevelSkips(5000, 0).totalSkips).toBe(0)
    expect(simulateEnemyLevelSkips(5000, 0).counterRemainder).toBe(0)
  })

  it('scales linearly in the wave count, which a roll would not guarantee', () => {
    const short = simulateEnemyLevelSkips(101, 0.25).totalSkips
    const long = simulateEnemyLevelSkips(201, 0.25).totalSkips
    expect(long - short).toBe(short)
  })
})

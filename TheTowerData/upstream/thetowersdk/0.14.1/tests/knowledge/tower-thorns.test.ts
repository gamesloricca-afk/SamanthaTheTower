import { describe, expect, it } from 'vitest'
import {
  THORNS_BOSS_BREAKPOINT,
  THORNS_BOSS_MULTIPLIER,
  THORNS_KILL_BREAKPOINTS,
  THORNS_PERCENT_TO_FRACTION,
  THORNS_PROTECTOR_LAB_MAX_LEVEL,
  THORNS_PROTECTOR_LAB_PER_LEVEL,
  THORNS_RESISTANCE_CONDITION_INDEX,
  thornsHitsToKill,
  thornsProtectorMultiplier,
} from '../../src/knowledge'
import { V283_HEAT_BC_INDEX } from '../../src/data/generated'

/**
 * The thorns breakpoints, checked as arithmetic rather than trusted as a list.
 *
 * Thorns deals a share of an enemy's MAX health, so damage per hit is constant
 * and hits-to-kill is a pure function of the percentage. That makes the guide's
 * list falsifiable without another source: each entry should be the SMALLEST
 * percentage that kills in one fewer hit than the one before it.
 *
 * ## The rule the list revealed
 *
 * Checking it exposed which comparison the game uses. Under `ceil(100 / p)` the
 * minimal thresholds would be 10, 12, 13, 15, 17, 20, 25, 34, 50 — and the guide
 * says 11, 12, 13, 15, 17, 21, 26, 34, 51. The two differ at exactly the four
 * points where 100 / p divides evenly, and nowhere else.
 *
 * That is the signature of a STRICT comparison: the enemy dies when cumulative
 * thorns damage EXCEEDS its max health, not when it reaches it. At 50% two hits
 * deal exactly 100% and the enemy lives; at 51% two hits deal 102% and it does
 * not. So `hitsToKill = floor(100 / p) + 1`, and under that rule all nine of the
 * guide's entries are minimal.
 *
 * The same `>` versus `>=` distinction decides the enemy-level-skip counter, and
 * in both places it is worth exactly one step at the boundary.
 */

/*
 * The SHIPPED function, not a local copy of the formula.
 *
 * The first version of this file defined its own `hitsToKill` and checked the
 * breakpoint list against it. Every case passed — and passed just as happily
 * with `thornsHitsToKill` planted as `ceil(100 / p)`, because nothing here ever
 * called it. A test that reimplements the thing it is testing verifies the list
 * and nothing else.
 */
const hitsToKill = (percent: number) => thornsHitsToKill(percent)!

describe('every breakpoint earns its place', () => {
  it('strictly reduces hits-to-kill at each step', () => {
    const hits = THORNS_KILL_BREAKPOINTS.map(hitsToKill)
    for (const [index, count] of hits.entries()) {
      if (index === 0) continue
      expect(count, `${THORNS_KILL_BREAKPOINTS[index]}% must kill faster than ${THORNS_KILL_BREAKPOINTS[index - 1]}%`)
        .toBeLessThan(hits[index - 1])
    }
  })

  it('is minimal — one point lower never reaches the same hit count', () => {
    /*
     * This is the half that catches a typo. A breakpoint that is not minimal is
     * wasted investment being recommended, which is exactly the error the list
     * exists to prevent.
     */
    for (const percent of THORNS_KILL_BREAKPOINTS) {
      expect(hitsToKill(percent - 1), `${percent}% is not the smallest value at ${hitsToKill(percent)} hits`)
        .toBeGreaterThan(hitsToKill(percent))
    }
  })

  it('shows why the gaps between breakpoints are dead investment', () => {
    // 13% and 14% both kill in eight hits, so a point of thorns there changes
    // nothing. This is the claim the traps make; here it is as a number.
    expect(hitsToKill(13)).toBe(hitsToKill(14))
    expect(hitsToKill(15)).toBeLessThan(hitsToKill(14))
  })

  it('needs roughly double against bosses, because thorns is halved', () => {
    /*
     * A boss takes `ceil(100 / (percent * 0.5))` hits. The boss breakpoint
     * should therefore behave like its halved value on the normal table.
     */
    const effective = THORNS_BOSS_BREAKPOINT * THORNS_BOSS_MULTIPLIER
    expect(effective).toBeCloseTo(33.5, 6)
    expect(hitsToKill(effective)).toBe(3)
    // ...and through the boss flag, which is how a caller would ask.
    expect(thornsHitsToKill(THORNS_BOSS_BREAKPOINT, true)).toBe(3)
    expect(thornsHitsToKill(THORNS_BOSS_BREAKPOINT - 1, true)).toBe(4)
    // And 67 is MINIMAL for three hits at half rate: 66 gives 200/66 = 3.03,
    // which floors to 3 and kills in four. One point of thorns, one whole hit.

  })

  it('refuses a nonsense percentage instead of returning a plausible number', () => {
    expect(thornsHitsToKill(0)).toBeNull()
    expect(thornsHitsToKill(-5)).toBeNull()
  })

  it('keeps the boss breakpoint out of the normal list', () => {
    // It is a different table — halved damage — and folding it in would
    // recommend 67% to someone fighting normal enemies, where 51% already
    // kills in two.
    expect(THORNS_KILL_BREAKPOINTS).not.toContain(THORNS_BOSS_BREAKPOINT)
    expect(hitsToKill(51)).toBe(2)
    // 50 is the case that proves the strict rule: exactly 100% is not enough.
    expect(hitsToKill(50)).toBe(3)
  })
})

describe('the constants match the ones in the function', () => {
  it('converts percent to a fraction with 0.01, not 1/100 of something else', () => {
    // The percent-to-fraction step is 0.01, applied to thorn damage before the
    // multiply by the enemy's maximum health.
    expect(THORNS_PERCENT_TO_FRACTION).toBe(0.01)
    // The whole model in one line: 51% of a 1000-max-health enemy is 510.
    expect(51 * THORNS_PERCENT_TO_FRACTION * 1000).toBeCloseTo(510, 6)
    // Two hits exceed 1000 and kill; at 50% they reach exactly 1000 and do not.
    expect(2 * 51 * THORNS_PERCENT_TO_FRACTION * 1000).toBeGreaterThan(1000)
    expect(2 * 50 * THORNS_PERCENT_TO_FRACTION * 1000).toBe(1000)
  })

  it('uses the thorns resistance index the corrected heat map gives', () => {
    /* The thorns model and versioned battle-condition catalog must use the same resistance index. */
    expect(THORNS_RESISTANCE_CONDITION_INDEX).toBe(2)
    expect(V283_HEAT_BC_INDEX.thornsResistance).toBe(THORNS_RESISTANCE_CONDITION_INDEX)
  })
})

describe('the protector penalty is thirty percent, not sixty', () => {
  it('starts at 0.70 and the lab never removes it', () => {
    /*
     * `(labBenefit - 30 + 100) / 100`. The wiki says enemies in a Protector take
     * 60% less; that is the Protector's GENERAL damage reduction. Thorns has its
     * own path, its own constant and its own lab, and the two numbers are not
     * interchangeable.
     */
    expect(thornsProtectorMultiplier(0)).toBeCloseTo(0.7, 10)

    const maxLab = THORNS_PROTECTOR_LAB_PER_LEVEL * THORNS_PROTECTOR_LAB_MAX_LEVEL
    expect(maxLab).toBeCloseTo(6, 10)
    expect(thornsProtectorMultiplier(maxLab)).toBeCloseTo(0.76, 10)

    // Never reaches 1: maxing the lab is not "protectors solved".
    expect(thornsProtectorMultiplier(maxLab)).toBeLessThan(1)
  })

  it('moves the breakpoints, which is the practical consequence', () => {
    /*
     * At 51% thorns a normal enemy dies in two hits. Inside a Protector the
     * effective rate is 51 * 0.7 = 35.7%, which needs three. The breakpoint
     * table is for unprotected enemies and silently does not apply.
     */
    expect(thornsHitsToKill(51)).toBe(2)
    expect(thornsHitsToKill(51 * thornsProtectorMultiplier(0))).toBe(3)
  })
})

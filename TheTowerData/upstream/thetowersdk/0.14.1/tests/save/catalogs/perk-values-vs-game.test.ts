import { describe, expect, it } from 'vitest'
import {
  V283_PERK_BENEFIT_DOWN,
  V283_PERK_BENEFIT_UP_INCREASE,
  V283_PERK_MAX_LEVEL,
} from '../../../src/data/generated'
import { findPerkCatalogRow, PERK_IMPORT_CATALOG } from '../../../src/save/catalogs/perks'

/**
 * The numbers inside the perk names, checked against the numbers in the game.
 *
 * A perk name is not just a label here — "x1.15 Damage" and "Bounce Shot +2"
 * each contain the value the perk actually applies, so the name is a claim that
 * can be falsified. `Perks.Initialize` writes every one of those values as a
 * compile-time literal, so both halves are available and comparable.
 *
 * This is the check that closes the perk work. The names were corrected by
 * tracing WHERE each index is applied; this verifies them by WHAT each index is
 * worth, which is an independent axis. Two derivations agreeing on all 34 is
 * what makes the renaming trustworthy rather than merely plausible.
 */

/**
 * The value a perk's own name claims, or null if the name states no number.
 *
 * A trade-off name carries TWO numbers — "x1.80 Coins, but Tower Max Health
 * -70%" — and only the first belongs to the benefit. Splitting on ", but" is
 * not cosmetic: without it the parser compares the penalty against the benefit
 * and reports a mismatch that is entirely its own fault.
 */
function claimedValue(fullName: string): number | null {
  const name = fullName.split(/,\s*but\s/i)[0]
  // "x1.15 Damage", "Interest x1.50", "Swamp Radius x1.5" -> the multiplier minus 1,
  // because the game stores the INCREASE over 1.
  const multiplier = /x(\d+(?:\.\d+)?)/i.exec(name)
  // "Bounce Shot +2", "+1 Wave on Death Wave", "Chrono Field Duration +5s"
  const plus = /\+(\d+(?:\.\d+)?)/.exec(name)
  // "Perk Wave Requirement -20.00%", "Defense Percent +4.00"
  const percent = /([-+]?\d+(?:\.\d+)?)%/.exec(name)

  if (percent) return Math.abs(Number(percent[1])) / 100
  if (multiplier) return Number(multiplier[1])
  if (plus) return Number(plus[1])
  return null
}

describe('a perk name states its own value, and the game agrees', () => {
  it('matches the per-level benefit for every perk whose name carries a number', () => {
    const mismatches: string[] = []
    let checked = 0

    for (const row of PERK_IMPORT_CATALOG) {
      const claimed = claimedValue(row.name)
      if (claimed === null) continue
      const actual = (V283_PERK_BENEFIT_UP_INCREASE as Record<string, number>)[String(row.index)]
      if (actual === undefined) continue

      checked += 1
      /*
       * Two shapes are both correct and have to be allowed:
       *
       *   "x1.15 Damage"      -> stored as 0.15, the increase over 1
       *   "Land Mine Damage x3.50" -> stored as 3.5, a bare multiplier
       *
       * The distinguishing field is `perkBenefitUpBase` (1 vs 0), so accepting
       * either is not a loosened test — it is the encodings the game uses.
       *
       * A THIRD encoding exists and is worth naming, because it is inconsistent
       * within the game itself: percentages are stored as FRACTIONS for perk 9
       * ("Defense Percent +4.00" -> 0.04) and as POINTS for perk 8 ("Free
       * Upgrade Chance for All +5.0%" -> 5). Two adjacent additive perks, two
       * different units, and "Defense Percent +4.00" does not even carry a %
       * sign. Four encodings are therefore accepted here.
       *
       * That tolerance is deliberate and bounded: this case checks the VALUE,
       * and the units are pinned separately in the test below. A wrong number
       * — 0.15 where the game says 0.2 — still fails, which is the thing worth
       * catching. Planted one to be sure.
       */
      /*
       * Tolerance is 1e-6, not exact. Some of these were stored as float32 and
       * widened: perk 48's 0.7 comes back as 0.699999988079071. That is the same
       * drift the damage node documents for Critical Factor's 16.20000076, and
       * comparing to a rounded constant with `===` would fail on a number that
       * is correct.
       */
      const near = (a: number, b: number) => Math.abs(a - b) < 1e-6
      const ok = near(actual, claimed)
        || near(actual, claimed - 1)
        || near(actual, claimed * 100)
        || near(actual, claimed / 100)
      if (!ok) mismatches.push(`${row.index} "${row.name}": name says ${claimed}, game says ${actual}`)
    }

    expect(checked, 'nothing was compared — the name parser has stopped working')
      .toBeGreaterThanOrEqual(25)
    expect(mismatches, mismatches.join('\n')).toEqual([])
  })

  it('settles the wave-requirement rate at 20%, from the game', () => {
    /*
     * The wiki's table says -25.00% and the worked example on the same page
     * computes with 0.20. The oracle carried 25 until 2026-08-17, when the
     * example was used to argue for 20. This is the primary source ending the
     * argument.
     */
    expect((V283_PERK_BENEFIT_UP_INCREASE as Record<string, number>)['10']).toBeCloseTo(0.2, 10)
    expect(findPerkCatalogRow(10)?.name).toContain('-20.00%')
  })

  it('matches every maxLevel, which was previously wiki-validated only', () => {
    for (const row of PERK_IMPORT_CATALOG) {
      const actual = (V283_PERK_MAX_LEVEL as Record<string, number>)[String(row.index)]
      expect(actual, `no game maxLevel for perk ${row.index}`).toBeDefined()
      expect(row.maxLevel, `${row.index} "${row.name}"`).toBe(actual)
    }
  })

  it('matches the penalty side of the trade-offs', () => {
    // Each is the number in the second half of the name. 8x boss health, keep
    // 30% of max health, keep 10% regen, half damage, x3 ranged, x2.5 damage.
    const expected: Readonly<Record<number, number>> = {
      40: 8, 41: 0.3, 42: 0.1, 43: 0.5, 44: 3, 45: 2.5, 47: 0.4, 48: 0.5,
    }
    for (const [index, value] of Object.entries(expected)) {
      expect((V283_PERK_BENEFIT_DOWN as Record<string, number>)[index], `perk ${index}`)
        .toBeCloseTo(value, 6)
    }
  })

  it('names the perk whose percentage is stored in points, not as a fraction', () => {
    /*
     * The game is not internally consistent here, so a converter that assumes
     * one unit is wrong for the other. Perk 8 is the exception; perks 9 and 10
     * are the rule.
     */
    expect((V283_PERK_BENEFIT_UP_INCREASE as Record<string, number>)['8']).toBe(5)
    expect(findPerkCatalogRow(8)?.name).toContain('+5.0%')

    expect((V283_PERK_BENEFIT_UP_INCREASE as Record<string, number>)['9']).toBeCloseTo(0.04, 10)
    expect(findPerkCatalogRow(9)?.name).toContain('+4.00')

    expect((V283_PERK_BENEFIT_UP_INCREASE as Record<string, number>)['10']).toBeCloseTo(0.2, 10)
  })

  it('records the two penalties the game stores as zero', () => {
    /*
     * 46 "Enemy Kills Don't Give Cash" is genuinely zero — the penalty IS the
     * zero. 49 "Knockback Force -70%" is zero too, and that one is not a value:
     * the effect-site trace found 49's penalty is never applied through
     * `PerkBenefitDown`, so the slot is unused rather than meaning "no penalty".
     * Two zeroes, two different reasons, and only one of them is data.
     */
    expect((V283_PERK_BENEFIT_DOWN as Record<string, number>)['46']).toBe(0)
    expect((V283_PERK_BENEFIT_DOWN as Record<string, number>)['49']).toBe(0)
    expect(findPerkCatalogRow(49)?.name).toContain('Knockback Force -70%')
  })
})

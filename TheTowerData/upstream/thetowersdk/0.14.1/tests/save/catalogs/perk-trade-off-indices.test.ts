import { describe, expect, it } from 'vitest'
import { ALL_PERKS } from '../../../src/data/perks/data'
import { findPerkCatalogRow, PERK_ADDITIVE_MISSING_FROM_WIKI, PERK_APPLIED_AS, PERK_BENEFIT_UP_FORMULA, PERK_WITHOUT_IDENTITY_TERM, PERK_INTEGER_BENEFIT_INDICES, PERK_IMPORT_CATALOG, PERK_INDICES_CORRECTED_FROM_GAME, PERK_STANDARD_INDICES, PERK_TRADE_OFF_INDICES, PERK_UW_INDICES } from '../../../src/save/catalogs/perks'

/**
 * Perk index -> name, pinned to what the game does with each index.
 *
 * Thirteen of the thirty-four names in `PERK_IMPORT_CATALOG` were wrong. The
 * ultimate-weapon block was entirely correct, the trade-off block had two
 * transposed pairs, and the standard block had eleven of fifteen misplaced. The
 * names had been written in display order rather than index order, so runs of
 * them were shifted.
 *
 * Nothing caught it, and one test actively encoded it: `perks.test.ts` asserted
 * that the save's `firstPerkIndex` of 10 was "Free Upgrade Chance for All",
 * which is what the catalog said and not what the game does with index 10.
 *
 * ## What identifies a perk
 *
 * Not its name — that is the thing that drifted. `PerkBenefitUp(i)` and
 * `PerkBenefitDown(i)` are called from a specific function and their result is
 * written to a specific field, and THAT is the fingerprint:
 *
 * Two indices call neither function: 11 unlocks a weapon and 23 adds a set of
 * mines. Neither has a scalar benefit, which is itself identifying.
 */

describe('perk indices match what the game does with them', () => {
  it('pins the standard block, where eleven of fifteen were wrong', () => {
    const expected: Readonly<Record<number, string>> = {
      0: 'x1.20 Max Health',
      1: 'x1.15 Damage',
      2: 'x1.75 Health Regen',
      3: 'x1.15 All Coin Bonuses',
      4: 'Bounce Shot +2',
      5: 'Interest x1.50',
      6: 'Land Mine Damage x3.50',
      7: 'Orbs +1',
      8: 'Free Upgrade Chance for All +5.0%',
      9: 'Defense Percent +4.00',
      10: 'Perk Wave Requirement -20.00%',
      11: 'Unlock a Random Ultimate Weapon',
      12: 'Increase Max Game Speed by +1.00',
      13: 'x1.15 Cash Bonus',
      14: 'x1.15 Defense Absolute',
    }
    for (const index of PERK_STANDARD_INDICES) {
      expect(findPerkCatalogRow(index)?.name, `standard perk ${index}`).toBe(expected[index])
    }
  })

  it('pins the two trade-off pairs that were transposed', () => {
    // 40 raises tower damage; 48 lowers boss health. 41 raises coins; 49 raises
    // lifesteal. Each pair was the wrong way round.
    expect(findPerkCatalogRow(40)?.name).toBe('x1.50 Tower Damage, but Bosses Have 8x Health')
    expect(findPerkCatalogRow(48)?.name).toBe('Boss Health -70%, but Boss Speed +50%')
    expect(findPerkCatalogRow(41)?.name).toBe('x1.80 Coins, but Tower Max Health -70%')
    expect(findPerkCatalogRow(49)?.name).toBe('Lifesteal x2.50, but Knockback Force -70%')
  })

  it('leaves the ultimate-weapon block alone, because it was already right', () => {
    /*
     * Worth asserting precisely BECAUSE it was correct: a sweeping "fix" that
     * renumbered everything would have broken these, and the fact that one of
     * three blocks was fine is what shows the defect was transcription rather
     * than a systematic offset.
     */
    expect(findPerkCatalogRow(20)?.name).toBe('4 More Smart Missiles')
    expect(findPerkCatalogRow(26)?.name).toBe('Chrono Field Duration +5s')
    expect(findPerkCatalogRow(28)?.name).toBe('Spotlight Damage Bonus x1.5')
  })

  it('keeps the corrected list matching the catalog it corrected', () => {
    /*
     * A record of which indices moved, so the scale of the defect stays legible
     * — and so that a future edit cannot quietly restore one of them without
     * this list and the pins above disagreeing.
     */
    expect(PERK_INDICES_CORRECTED_FROM_GAME).toHaveLength(13)
    for (const index of PERK_INDICES_CORRECTED_FROM_GAME) {
      expect(findPerkCatalogRow(index), `corrected index ${index} must exist`).toBeDefined()
    }
    expect(PERK_UW_INDICES.some(i => (PERK_INDICES_CORRECTED_FROM_GAME as readonly number[]).includes(i)))
      .toBe(false)
  })

  it('still agrees with the perk data list on names, pools and quantities', () => {
    /*
     * Three copies of the same facts live in this repo: this catalog, ALL_PERKS
     * in data/perks.ts, and STANDARD_PERK_MAX_QUANTITY in the oracle. The other
     * two carry no indices, so they were never wrong — but they are the check
     * that the renaming above did not invent or drop a perk.
     */
    const all = ALL_PERKS as readonly { perk: string, quantity: number, pool: string }[]
    expect(PERK_IMPORT_CATALOG).toHaveLength(all.length)
    for (const perk of all) {
      const row = PERK_IMPORT_CATALOG.find(candidate => candidate.name === perk.perk)
      expect(row, `no catalog row named ${perk.perk}`).toBeDefined()
      expect(row!.pool, perk.perk).toBe(perk.pool)
      expect(row!.maxLevel, perk.perk).toBe(perk.quantity)
    }
  })

  it('separates HOW a perk is applied from WHETHER it carries an implicit 1', () => {
    /*
     * Two different questions, conflated here once and worth keeping apart.
 *
     *   PerkBenefitUp(i) = (base[i] + increase[i] * level[i]) * (1 + SPB)
*/
    expect(PERK_BENEFIT_UP_FORMULA).toContain('base[i] + increase[i] * perkLevel[i]')

    for (const index of PERK_STANDARD_INDICES) {
      expect(PERK_APPLIED_AS[index], `no application form for perk ${index}`).toBeDefined()
    }

    // Applied by adding — the four the wiki's additive list omits are here.
    for (const index of PERK_ADDITIVE_MISSING_FROM_WIKI) {
      expect(PERK_APPLIED_AS[index], `${findPerkCatalogRow(index)?.name}`).toBe('add')
    }

    // Perk 6 is the discriminating case: no implicit 1, yet multiplied.
    expect(PERK_APPLIED_AS[6]).toBe('multiply')
    expect(PERK_WITHOUT_IDENTITY_TERM).toContain(6)

    // Perk 10 is the other way round — the wiki calls it additive, but it is
    // applied as `1 - benefit`, a multiplier.
    expect(PERK_APPLIED_AS[10]).toBe('multiply')

    // Bounce Shot and Orbs are INTEGER adds; a fractional value is impossible.
    for (const index of PERK_INTEGER_BENEFIT_INDICES) {
      expect(PERK_APPLIED_AS[index]).toBe('add')
      expect(findPerkCatalogRow(index)?.name).toMatch(/\+\d+$/)
    }

    expect(PERK_STANDARD_INDICES.filter(i => PERK_APPLIED_AS[i] === 'grant')).toEqual([11])
  })

  it('explains perk 44 rather than treating its zero as missing data', () => {
    
    // A flag cannot stack, and the game agrees.
    expect(findPerkCatalogRow(44)?.maxLevel).toBe(1)
  })

  it('matches the wiki quantity column, which is the only source for maxLevel', () => {
    /*
     * The expected maximum levels follow the wiki's quantity column.
     * Pin by perk name so an index change cannot silently move the quantity
     * to a different perk.
     *
     * Pinned by NAME, because the names are what moved.
     */
    const wikiQuantity: Readonly<Record<string, number>> = {
      'x1.20 Max Health': 5,
      'x1.15 Damage': 5,
      'x1.15 All Coin Bonuses': 5,
      'x1.15 Defense Absolute': 5,
      'x1.15 Cash Bonus': 5,
      'x1.75 Health Regen': 5,
      'Interest x1.50': 5,
      'Land Mine Damage x3.50': 5,
      'Free Upgrade Chance for All +5.0%': 5,
      'Defense Percent +4.00': 5,
      'Bounce Shot +2': 3,
      'Perk Wave Requirement -20.00%': 3,
      'Orbs +1': 2,
      'Unlock a Random Ultimate Weapon': 1,
      'Increase Max Game Speed by +1.00': 1,
    }
    for (const index of PERK_STANDARD_INDICES) {
      const row = findPerkCatalogRow(index)!
      expect(wikiQuantity[row.name], `wiki has no quantity for ${row.name}`).toBeDefined()
      expect(row.maxLevel, row.name).toBe(wikiQuantity[row.name])
    }
    // Every UW and trade-off perk is once per run.
    for (const index of [...PERK_UW_INDICES, ...PERK_TRADE_OFF_INDICES]) {
      expect(findPerkCatalogRow(index)?.maxLevel, `perk ${index}`).toBe(1)
    }
  })

  it('gives every trade-off perk a name mentioning both sides', () => {
    for (const index of PERK_TRADE_OFF_INDICES) {
      expect(findPerkCatalogRow(index)?.name, `perk ${index}`).toMatch(/,\s*but\s/i)
    }
  })
})

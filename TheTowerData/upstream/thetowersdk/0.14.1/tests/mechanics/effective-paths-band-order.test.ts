import { describe, expect, it } from 'vitest'
import { EFFECTIVE_DAMAGE_UPGRADES } from '../../src/mechanics/effective-paths/edamage-plan'

/**
 * Declaration order IS the tie-break, so it has to match the sheet's columns.
 *
 * `EPP_MATRIX` picks the winner as
 *
 *     maxROI,      MAX(FILTER(line_roi, line_roi<>""))
 *     firstMaxCol, MIN(FILTER(COLUMN(line_roi), line_roi=maxROI))
 *
 * -- the LEFTMOST column of the joint maximum. The port's planner takes the
 * first candidate with a strictly greater ROI, which is the same rule only if
 * it walks the candidates in the sheet's column order. Nothing in the planner
 * enforces that; it is a property of how `EFFECTIVE_DAMAGE_UPGRADES` happens to
 * be written, and adding an upgrade in the wrong place would change which of
 * two tied candidates is bought without changing any value.
 *
 * That is the defect shape this repo keeps finding -- correct in the model,
 * never checked in the wiring, and invisible because the numbers are right.
 * A tie is rare, which makes it worse: it would not show up in a sweep for a
 * long time, and then only as one account picking a different upgrade.
 *
 * Headers below are the sheet's own, read from the ROI band of each satellite
 * tab in the 2026-08-20 whole-workbook dump.
 */

/** `eDamage Stone!FM4:GP4`. */
const SHEET_STONE = [
  'DW Damage', 'DW Quantity', 'DW Cooldown',
  'CL Damage', 'CL Quantity', 'CL Chance',
  'SM Damage', 'SM Quantity', 'SM Cooldown', 'SM Cover Fire',
  'SL Damage', 'SL Angle', 'SL Quantity', 'SL Light Range',
  'PS Damage', 'PS Duration', 'PS Cooldown', 'PS Death Creep',
  'ILM Damage', 'ILM Quantity', 'ILM Cooldown', 'ILM Charged Mines',
  'CF Slow', 'CF Chrono Loop',
  'Assist Module Bonus - Cannon', 'Assist Module Substats - Cannon',
  'Assist Module Substats - Armor', 'Assist Module Bonus - Core',
  'Assist Module Substats - Core',
]

/** `eDamage Coins!EZ4:FY4`. */
const SHEET_COIN = [
  'Damage +', 'Damage Mastery', 'Demon Mode Mastery', 'Critical Chance Mastery',
  'Critical Factor +', 'Super Crit Mult +', 'Cash Bonus +', 'Attack Speed +',
  'Attack Speed Mastery', 'Damage/Meter +', 'Range Mastery', 'Super Tower Mastery',
  'Rend Armor +', 'Ultimate Crit Mastery',
  'Primary Module - Cannon', 'Assist Module - Cannon',
  'Primary Module - Core', 'Assist Module - Core',
  'Assist Module Substats - Cannon', 'Assist Module Substats - Armor',
  'Assist Module Substats - Core', 'Assist Module Bonus - Cannon',
  'Assist Module Bonus - Core',
  'Dissonant Echo - Attack', 'Dissonant Echo - Ultimate Weapons',
]

/** `eDamage Keys!DV4:EH4`. */
const SHEET_KEYS = [
  'Damage', 'Critical Chance', 'Critical Factor', 'Super Crit Chance',
  'Super Crit Mult', 'Attack Speed', 'Multishot Chance', 'Damage / Meter',
  'Rapid Fire Chance', 'Bounce Shot Chance', 'UW Damage',
]

const ours = (band: string) =>
  EFFECTIVE_DAMAGE_UPGRADES.filter(u => u.band === band).map(u => u.sheetName)

describe('candidate order matches the sheet, because order is the tie-break', () => {
  for (const [band, sheet] of [
    ['stone', SHEET_STONE], ['coin', SHEET_COIN], ['keys', SHEET_KEYS],
  ] as const) {
    it(`${band}: same names, same order as the sheet's ROI band`, () => {
      // Compared as whole arrays, not as a count and a set: a swap of two
      // adjacent names keeps both of those identical and is exactly the change
      // that would flip a tie.
      expect(ours(band)).toEqual([...sheet])
    })
  }

  it('would fail on a swap, not just on an addition', () => {
    const swapped = [...SHEET_STONE]
    const [a, b] = [swapped[11], swapped[12]] // SL Angle, SL Quantity
    swapped[11] = b
    swapped[12] = a
    // Same length, same members — only the order differs. If this passed, the
    // three assertions above would be measuring nothing.
    expect(swapped).not.toEqual([...SHEET_STONE])
    expect(swapped.length).toBe(SHEET_STONE.length)
    expect([...swapped].sort()).toEqual([...SHEET_STONE].sort())
  })

  /*
   * The LAB band is deliberately NOT asserted here.
   *
   * Its ROI and candidate columns interleave rather than sitting in two blocks:
   * `eDamage!HD5` is `EPP_MATRIX(FV5:HC5)`, so `FV..HC` is what gets ranked,
   * but the row-5 formulas inside that span include `EPG_LEVEL_CHECK` gates
   * (`FV5` Damage, `GU5` Assist Module Bonus - Cannon, `HA5` Dissonant Echo -
   * Attack) which are candidate-shaped, not ROI-shaped. Until those boundaries
   * are established the sheet's lab order cannot be stated, and asserting a
   * guess would be worse than asserting nothing.
   *
   * The lab variant passes a 199-account path sweep, so its order is
   * empirically consistent with the sheet; it is the CLAIM that is missing,
   * not the behaviour.
   */
  it('records that the lab band is unverified rather than implying it passed', () => {
    expect(ours('lab')).toHaveLength(34)
  })
})

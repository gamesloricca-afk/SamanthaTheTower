import { describe, expect, it } from 'vitest'
import {
  GUILD_BOX_REWARD_TABLE_KEY,
  GUILD_CHEST_PAYOUTS,
  GUILD_CHEST_THRESHOLDS,
  GUILD_SEASONS,
  guildSeasonFromRelicEvent,
  guildSeasonLabel,
} from '../../src/data/guild/data'
import { REFERENCE_TABLES } from '../../src/data/reference/data'
import { RELIC_TEMPLATES } from '../../src/data/relics/data'

/**
 * Guild facts, checked against the sources they were read from.
 *
 * The transcribed numbers in `guild.ts` are a second copy of the reference
 * table's numbers, and a second copy with no owner is how the tier coin-bonus
 * conflict got shipped. These tests give the copy an owner.
 */

describe('guild chest payouts', () => {
  it('matches the reference table row for row', () => {
    const table = REFERENCE_TABLES[GUILD_BOX_REWARD_TABLE_KEY]
    for (const payout of GUILD_CHEST_PAYOUTS) {
      const row = table.rows.find(candidate => candidate[0] === payout.currency)
      expect(row, `no ${payout.currency} row in ${GUILD_BOX_REWARD_TABLE_KEY}`).toBeDefined()
      // Columns 1-4 are the four boxes; column 5 is the table's own total.
      expect(row!.slice(1, 5).map(Number)).toEqual([...payout.perBox])
      expect(Number(row![5]), `${payout.currency} total`).toBe(payout.total)
    }
  })

  it('confirms the four boxes are cumulative, not alternatives', () => {
    /*
     * This is the claim the node makes and the one most likely to be got wrong:
     * a reader who treats the columns as tiers takes the largest and reports
     * 100 bits a week instead of 185. The table's own Total column settles it —
     * it is the SUM, so all four are claimed.
     */
    for (const payout of GUILD_CHEST_PAYOUTS) {
      const summed = payout.perBox.reduce((a, b) => a + b, 0)
      expect(summed, `${payout.currency} sums to its stated total`).toBe(payout.total)
      expect(payout.total).toBeGreaterThan(Math.max(...payout.perBox))
    }
  })

  it('has one threshold per box column', () => {
    const table = REFERENCE_TABLES[GUILD_BOX_REWARD_TABLE_KEY]
    const boxColumns = table.header.slice(1, 5).map(String)
    expect(boxColumns).toEqual(GUILD_CHEST_THRESHOLDS.map(n => `${n} Box`))
  })
})

describe('guild seasons survive the catalog spelling drift', () => {
  it('reads both spellings the relic catalog uses', () => {
    expect(guildSeasonFromRelicEvent('Guild Season 3')).toBe(3)
    expect(guildSeasonFromRelicEvent('Purchased from the Season 8 Guild Store')).toBe(8)
    expect(guildSeasonFromRelicEvent('Into the Matrix')).toBeNull()
    expect(guildSeasonFromRelicEvent(undefined)).toBeNull()
  })

  it('finds seasons written BOTH ways in the live catalog, not just one', () => {
    /*
     * The planted-fault version of this: filter the catalog by the short
     * spelling alone and seasons 8-10 vanish with no error. So assert that both
     * families are actually present — if the catalog is ever normalised, this
     * test should be updated deliberately rather than passing by accident.
     */
    const events = RELIC_TEMPLATES.map(relic => relic.event ?? '')
    expect(events.some(event => /^Guild Season \d+$/.test(event))).toBe(true)
    expect(events.some(event => /Season \d+ Guild Store/.test(event))).toBe(true)

    const shortSpellingOnly = new Set(
      events.filter(event => /^Guild Season \d+$/.test(event))
        .map(event => guildSeasonFromRelicEvent(event)),
    )
    expect(
      GUILD_SEASONS.length,
      'the normaliser must find more seasons than the short spelling alone',
    ).toBeGreaterThan(shortSpellingOnly.size)
  })

  it('numbers seasons contiguously from 1', () => {
    const numbers = GUILD_SEASONS.map(season => season.season)
    expect(numbers).toEqual(numbers.map((_, index) => index + 1))
  })

  it('gives every season one canonical label', () => {
    for (const season of GUILD_SEASONS) {
      expect(season.label).toBe(guildSeasonLabel(season.season))
      expect(season.relicIds.length).toBeGreaterThan(0)
    }
  })
})

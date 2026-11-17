import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

/*
 * The capture helper is a monorepo script, not part of this package, and a fork has no
 * monorepo around it. A static import made the whole file fail to COLLECT there — which reads
 * as a broken suite rather than as a test that cannot apply, so the segments are joined rather
 * than written as one `../../../..` literal, and the suite skips when the helper is absent.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url))
const HELPER = path.resolve(HERE, '..', '..', '..', '..', 'scripts', 'effective-paths', 'unified-player.mjs')
const AVAILABLE = existsSync(HELPER)

const { drawPlayer, levelFor, projectToTab, vocabularyOf } = AVAILABLE
  ? await import(pathToFileURL(HELPER).href)
  : { drawPlayer: null, levelFor: null, projectToTab: null, vocabularyOf: null }

/**
 * The projection that makes one drawn player legal on every tab at once.
 *
 * Checked here rather than in the capture script because the capture costs
 * about six seconds of Sheets quota per account, and the property being checked
 * — a lab shared by two tabs gets one level, within each tab's own cap — is
 * pure arithmetic that needs no network at all.
 *
 * The cap case is the one worth planting: eHP and eEcon both list
 * `Standard Perks Bonus`, and each block carries its OWN max column. Drawing a
 * level once and writing it to both is the obvious implementation and produces
 * a state no player can be in the moment the caps differ — which is exactly
 * what `effective-paths-fixture-sanity.test.ts` exists to catch, one layer
 * further down.
 */

const EHP = {
  name: 'eHP',
  levelColumn: 'BC',
  flagColumn: 'AY',
  cardMasterRow: 16,
  perkMasterRow: 28,
  labs: [
    { name: 'Standard Perks Bonus', row: 5, max: 10 },
    { name: 'Defense Absolute', row: 6, max: 40 },
  ],
  cards: [{ name: 'Health', row: 19 }],
  perks: [{ name: 'Max Health', row: 30 }],
}

const ECON = {
  name: 'eEcon',
  levelColumn: 'BE',
  flagColumn: 'AZ',
  cardMasterRow: 28,
  labs: [
    // The SAME lab, with a different cap on this tab. That is the whole point.
    { name: 'Standard Perks Bonus', row: 7, max: 3 },
    { name: 'Coins/Kill', row: 8, max: 60 },
  ],
  cards: [{ name: 'Coins', row: 31 }],
  perks: [],
}

const TABS = [EHP, ECON]
/*
 * Guarded because this runs at MODULE scope, before any suite. `describe.skipIf` below
 * skips the tests; it cannot stop a call made while the file is being imported, and with
 * the capture helper absent `vocabularyOf` is null and the whole file fails to collect.
 */
const VOCAB = AVAILABLE ? vocabularyOf(TABS, ['Regular', 'Tourney']) : null

describe.skipIf(!AVAILABLE)('one drawn player, projected onto every tab', () => {
  it('gives a shared lab one level, scaled to each tab\'s own cap', () => {
    // Named, never counted — the account and lab ARE the diagnosis.
    const wrong: string[] = []
    for (let i = 0; i < 400; i += 1) {
      const player = drawPlayer(i, VOCAB)
      const a = levelFor(player, 'Standard Perks Bonus', 10)
      const b = levelFor(player, 'Standard Perks Bonus', 3)
      if (a > 10 || b > 3 || a < 0 || b < 0) wrong.push(`account-${i}: ${a}/10, ${b}/3`)
      // Same fraction, so the two must move together: a high draw is high on
      // both tabs, never high on one and low on the other.
      const fa = a / 10
      const fb = b / 3
      if (Math.abs(fa - fb) > 0.34) wrong.push(`account-${i}: ${fa.toFixed(2)} vs ${fb.toFixed(2)} of cap`)
    }
    expect(wrong).toEqual([])
  })

  it('reaches both ends of a cap rather than hugging the middle', () => {
    /*
     * Guards the guard. `Math.floor(fraction * (max + 1))` spans 0..max, but an
     * off-by-one that clamped to `max - 1`, or a fraction that never reached
     * the tails, would leave the check above passing on a population that never
     * tests a maxed lab or an unbought one.
     */
    const seen = new Set<number>()
    for (let i = 0; i < 400; i += 1) {
      seen.add(levelFor(drawPlayer(i, VOCAB), 'Standard Perks Bonus', 3))
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 3])
  })

  it('writes each tab\'s own addresses, and the same player to both', () => {
    const player = drawPlayer(7, VOCAB)
    const ehp = projectToTab(player, EHP)
    const econ = projectToTab(player, ECON)

    // Each tab is written at its own column and row, never the other's.
    expect(ehp.cells['eHP!BC5']).toBe(levelFor(player, 'Standard Perks Bonus', 10))
    expect(econ.cells['eEcon!BE7']).toBe(levelFor(player, 'Standard Perks Bonus', 3))
    expect(Object.keys(ehp.cells).every(k => k.startsWith('eHP!'))).toBe(true)
    expect(Object.keys(econ.cells).every(k => k.startsWith('eEcon!'))).toBe(true)

    // The block master switches ride along, because the sheet reads a card as
    // `AND($AY$16, $AY$19)` and a row alone would count a card the run has off.
    expect(ehp.cells['eHP!AY16']).toBe(player.masters.cards)
    expect(ehp.cells['eHP!AY28']).toBe(player.masters.perks)
  })

  it('reports what it could not place instead of dropping it', () => {
    /*
     * A capture that quietly wrote fewer cells than it meant to is how a band of
     * levels comes to be all zero while the sheet still computes something
     * plausible. eEcon lists no perks, so this player's `Max Health` perk has
     * nowhere to go on that tab — and that must be SAID, not skipped.
     */
    const player = drawPlayer(3, VOCAB)
    const econ = projectToTab(player, ECON)
    expect(econ.unprojected).toContain('perk Max Health')
    expect(econ.unprojected).toContain('card Health')
    expect(econ.unprojected).toContain('lab Defense Absolute')
    // Nothing the tab lists went unknown — every name it has, the player drew.
    expect(econ.unknown).toEqual([])
  })

  it('names a lab the tab lists that the player never drew', () => {
    // Plant the fault: a block gains a row and the vocabulary is stale. It must
    // surface as `unknown`, not as a level of zero.
    const stale = { ...ECON, labs: [...ECON.labs, { name: 'Brand New Lab', row: 9, max: 5 }] }
    const { cells, unknown } = projectToTab(drawPlayer(1, VOCAB), stale)
    expect(unknown).toContain('lab Brand New Lab')
    expect(cells['eEcon!BE9']).toBeUndefined()
  })

  it('is reproducible for a given account', () => {
    expect(drawPlayer(42, VOCAB)).toEqual(drawPlayer(42, VOCAB))
    expect(drawPlayer(42, VOCAB).labFraction)
      .not.toEqual(drawPlayer(43, VOCAB).labFraction)
  })
})

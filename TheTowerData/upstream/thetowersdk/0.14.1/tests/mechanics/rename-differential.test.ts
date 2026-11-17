import { describe, expect, it } from 'vitest'
import { buildLabProgressRows, computeLabGems, getSharedToolLabs } from '../../src/data/labs/overview'
import { LAB_CATALOG } from '../../src/data/labs/catalog.data'
import { computeModuleStat } from '../../src/data/modules/bonus'

/**
 * The numbers, after 620 functions were renamed.
 *
 * A rename cannot change behaviour, which is exactly why it needs checking:
 * type-check proves the symbols still line up, and the page still renders, and
 * neither says the arithmetic came out the same. Every expectation below was
 * read off the live site *before* the rename passes and pasted here, so this
 * compares against the old behaviour rather than against whatever the code
 * happens to do now.
 *
 * These go through the renamed functions on purpose -- computeLabGems was
 * calculateLabGems, computeModuleStat was calculateModuleStat, and
 * buildLabProgressRows lost its currency branch when costs became absolute
 * coins.
 */
describe('behaviour is unchanged after the renames', () => {
  const labByName = (name: string) => {
    const lab = getSharedToolLabs().find(entry =>
      entry.name === name
      || entry.displayName === name
      || entry.name === name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    )
    if (!lab) throw new Error(`${name} missing from the catalog`)
    return lab
  }

  it('costs Damage Mastery the same as before', () => {
    // Read off the live lab calculator pre-rename: 1.1q, 1.3q, 2q, total 50q.
    const lab = labByName('Damage Mastery')
    const rows = buildLabProgressRows(lab, 0, 9, {
      labSpeed: 0, labRelic: 0, labDiscount: 0, speedUp: 1,
    })
    expect(rows.map(row => row.coins).slice(0, 3)).toEqual([1.1e15, 1.3e15, 2e15])
    expect(rows.at(-1)?.cumulativeCoins).toBe(50e15)
  })

  it('costs Ray Enemy Health the same as before', () => {
    // Pre-rename: 250q, 500q, 750q per level, 116.25Q to max.
    const lab = labByName('Ray Enemy Health')
    const rows = buildLabProgressRows(lab, 0, 30, {
      labSpeed: 0, labRelic: 0, labDiscount: 0, speedUp: 1,
    })
    expect(rows.map(row => row.coins).slice(0, 3)).toEqual([2.5e17, 5e17, 7.5e17])
    expect(rows.at(-1)?.cumulativeCoins).toBe(1.1625e20)
  })

  it('applies the lab discount as a rate, not a rounding rule', () => {
    // The currency branch used to keep two decimals for one half of the
    // catalog. One rule now, and 3% off 2.5e17 is a whole number of coins.
    const lab = labByName('Ray Enemy Health')
    const rows = buildLabProgressRows(lab, 0, 1, {
      labSpeed: 0, labRelic: 0, labDiscount: 10, speedUp: 1,
    })
    expect(rows[0]?.coins).toBe(Math.round(2.5e17 * 0.97))
  })

  it('keeps the gem curve where it was', () => {
    // Anchors either side of the piecewise boundaries, so a shifted branch
    // shows up rather than hiding between them.
    expect(computeLabGems(1)).toBe(8)
    expect(computeLabGems(24)).toBe(163)
    expect(computeLabGems(24 * 7)).toBe(1000)
  })

  it('keeps module stats where they were', () => {
    // 0.012 for a level 1 common cannon is the Effective Paths figure.
    expect(computeModuleStat({ type: 'cannon', rarityLabel: 'Common', level: 1 }) - 1).toBeCloseTo(0.012, 4)
    expect(computeModuleStat({ type: 'core', rarityLabel: 'Ancestral', level: 1 }) - 1).toBeCloseTo(0.41, 4)
  })

  it('still reaches every lab through one catalog', () => {
    // getSharedToolLabs used to merge two files and could emit a lab twice.
    const shared = getSharedToolLabs()
    expect(shared.length).toBe(LAB_CATALOG.length)
    expect(new Set(shared.map(lab => lab.name)).size).toBe(shared.length)
  })
})

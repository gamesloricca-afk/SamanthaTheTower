import { describe, expect, it } from 'vitest'
import {
  findLabResearchImportRow,
  labResearchImportRowCount,
} from '../../src/data/labs/display-overrides'
import { readLabsFromSaveRoot } from '../../src/save/labs/read'

/**
 * The import catalog must be read by save index, not by array position.
 *
 * It is dense 0..N-1 in order today, so `CATALOG[i]` gives the right row — by
 * coincidence, and the coincidence belongs to the data rather than the code.
 * These tests are written so that reordering the catalog file breaks nothing:
 * they assert identity, and they decode a save end to end rather than checking
 * that two arrays are the same length.
 */

function saveWithResearchLevel(index: number, level: number): Record<string, unknown> {
  const levels = new Array(labResearchImportRowCount()).fill(0)
  levels[index] = level
  return { researchLevel: levels }
}

describe('lab research rows resolve by save index', () => {
  it('every row is reachable by its own index', () => {
    const count = labResearchImportRowCount()
    for (let i = 0; i < count; i += 1) {
      expect(findLabResearchImportRow(i), `no row for index ${i}`).not.toBeNull()
      expect(findLabResearchImportRow(i)?.index, `row ${i} carries a different index`).toBe(i)
    }
  })

  it('returns null outside the catalog rather than an adjacent row', () => {
    expect(findLabResearchImportRow(-1)).toBeNull()
    expect(findLabResearchImportRow(labResearchImportRowCount())).toBeNull()
    expect(findLabResearchImportRow(1.5)).toBeNull()
    expect(findLabResearchImportRow(Number.NaN)).toBeNull()
  })

  it('decodes a save so that index 238 is the Utility echo', () => {
    const extract = readLabsFromSaveRoot(saveWithResearchLevel(238, 7))
    const row = extract?.researches.find(r => r.index === 238)
    expect(row?.level).toBe(7)
    expect(row?.displayName).toBe('Dissonant Echo - Utility')
    expect(row?.slug).toBe('dissonant_echo_utility')
    expect(row?.gameField).toBe('researchLevel238')
  })

  it('decodes index 241 as the Ultimate Weapons echo', () => {
    const extract = readLabsFromSaveRoot(saveWithResearchLevel(241, 3))
    const row = extract?.researches.find(r => r.index === 241)
    expect(row?.level).toBe(3)
    expect(row?.displayName).toBe('Dissonant Echo - Ultimate Weapons')
    expect(row?.gameField).toBe('researchLevel241')
  })

  it('pairs every decoded row with the catalog row of the SAME index', () => {
    const extract = readLabsFromSaveRoot(saveWithResearchLevel(0, 1))
    expect(extract).not.toBeNull()
    for (const row of extract!.researches) {
      const catalog = findLabResearchImportRow(row.index)
      expect(catalog, `decoded index ${row.index} has no catalog row`).not.toBeNull()
      expect(row.gameField, `gameField mismatch at ${row.index}`).toBe(catalog!.gameField)
    }
  })

  it('no decoded name differs from its catalog row, at any index', () => {
    const extract = readLabsFromSaveRoot(saveWithResearchLevel(0, 1))
    expect(extract).not.toBeNull()
    const differing = extract!.researches.filter(row => {
      const catalog = findLabResearchImportRow(row.index)
      return catalog?.displayName != null && catalog.displayName !== row.displayName
    })
    expect(differing.map(row => row.index)).toEqual([])
  })

  it('index 0 is the Damage lab, in the catalog and when decoded', () => {
    expect(findLabResearchImportRow(0)?.displayName).toBe('Damage')
    expect(findLabResearchImportRow(0)?.slug).toBe('damage')

    const row = readLabsFromSaveRoot(saveWithResearchLevel(0, 1))
      ?.researches.find(r => r.index === 0)
    expect(row?.displayName).toBe('Damage')
    expect(row?.slug).toBe('damage')
  })

  it('every catalog row has a usable display name and slug', () => {
    for (let i = 0; i < labResearchImportRowCount(); i += 1) {
      const row = findLabResearchImportRow(i)
      expect(row).not.toBeNull()
      if (row!.displayName === null) {
        expect(row!.slug, `unnamed slot ${i}`).toBeNull()
      } else {
        expect(row!.displayName, `display name at index ${i}`).toMatch(/^[A-Za-z0-9]/)
        expect(row!.slug, `slug at index ${i}`).toMatch(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/)
      }
    }
  })
})

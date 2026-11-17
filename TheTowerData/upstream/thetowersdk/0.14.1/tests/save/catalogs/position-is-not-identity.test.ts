import { describe, expect, it } from 'vitest'
import { CARD_IMPORT_CATALOG } from '../../../src/data/player-stats/fields.data'
import {
  BOT_IMPORT_CATALOG,
  GUARDIAN_CHIP_SLOT_CATALOG,
  ULTIMATE_WEAPON_IMPORT_CATALOG,
  WORKSHOP_ENHANCEMENT_IMPORT_CATALOG,
  WORKSHOP_IMPORT_CATALOG,
} from '../../../src/save/catalogs/indexes.data'
import { findBotCatalogRow } from '../../../src/save/catalogs/bots'
import { findUltimateWeaponCatalogRow } from '../../../src/save/catalogs/ultimate-weapons'
import {
  findWorkshopCatalogRow,
  findWorkshopEnhancementCatalogRow,
} from '../../../src/save/catalogs/workshop'

/**
 * Array position is not save index, and these catalogs prove it.
 *
 * `WORKSHOP_IMPORT_CATALOG` carries Wall Rebuild (index 47) at array position
 * 34. Fourteen consecutive rows are therefore offset, and until 2026-08-18
 * `findWorkshopCatalogRow` subscripted the array directly — so save index 34
 * (Cash Bonus) returned Wall Rebuild, 35 returned Cash Bonus, and so on. Every
 * answer was a real workshop upgrade with a real level, which is why nothing
 * looked broken.
 *
 * Two claims are tested, and the second matters more than the first:
 *
 *   1. every finder resolves by identity
 *   2. AT LEAST ONE catalog is not dense-and-ordered
 *
 * Without (2) this whole file passes vacuously the moment someone sorts the
 * data, and the finders could quietly go back to being positional.
 */

const CATALOGS = [
  ['BOT_IMPORT_CATALOG', BOT_IMPORT_CATALOG, 'index'],
  ['CARD_IMPORT_CATALOG', CARD_IMPORT_CATALOG, 'index'],
  ['ULTIMATE_WEAPON_IMPORT_CATALOG', ULTIMATE_WEAPON_IMPORT_CATALOG, 'index'],
  ['WORKSHOP_IMPORT_CATALOG', WORKSHOP_IMPORT_CATALOG, 'index'],
  ['WORKSHOP_ENHANCEMENT_IMPORT_CATALOG', WORKSHOP_ENHANCEMENT_IMPORT_CATALOG, 'index'],
  ['GUARDIAN_CHIP_SLOT_CATALOG', GUARDIAN_CHIP_SLOT_CATALOG, 'slotIndex'],
] as const

function identities(rows: readonly unknown[], field: string): number[] {
  return (rows as ReadonlyArray<Record<string, number>>).map(row => row[field])
}

describe('catalogs are addressed by identity, not position', () => {
  it.each(CATALOGS)('%s carries a unique identity on every row', (name, rows, field) => {
    const ids = identities(rows, field)
    expect(ids.every(Number.isInteger), `${name} has a non-integer ${field}`).toBe(true)
    expect(new Set(ids).size, `${name} has duplicate ${field} values`).toBe(ids.length)
  })

  it('at least one catalog is NOT dense-and-ordered, so this file is not vacuous', () => {
    const misordered = CATALOGS
      .filter(([, rows, field]) => identities(rows, field).some((id, position) => id !== position))
      .map(([name]) => name)
    expect(misordered).toContain('WORKSHOP_IMPORT_CATALOG')
  })

  it('WORKSHOP_IMPORT_CATALOG is offset exactly where it was found to be', () => {
    const rows = WORKSHOP_IMPORT_CATALOG as ReadonlyArray<{ index: number, name: string }>
    // Wall Rebuild sits at position 34 while owning save index 47.
    expect(rows[34].index).toBe(47)
    expect(rows[34].name).toBe('Wall Rebuild')
    const offset = rows.map((row, position) => row.index !== position).filter(Boolean)
    expect(offset).toHaveLength(14)
  })

  it('every workshop save index resolves to the row that owns it', () => {
    for (const row of WORKSHOP_IMPORT_CATALOG as ReadonlyArray<{ index: number, name: string }>) {
      const found = findWorkshopCatalogRow(row.index)
      expect(found?.index, `workshop index ${row.index}`).toBe(row.index)
      expect(found?.name, `workshop index ${row.index}`).toBe(row.name)
    }
  })

  it('names the fourteen upgrades that were previously misresolved', () => {
    // Spot-checks at both ends of the shifted run and the row that caused it.
    expect(findWorkshopCatalogRow(34)?.name).toBe('Cash Bonus')
    expect(findWorkshopCatalogRow(35)?.name).toBe('Cash / Wave')
    expect(findWorkshopCatalogRow(46)?.name).toBe('Enemy Health Level Skip')
    expect(findWorkshopCatalogRow(47)?.name).toBe('Wall Rebuild')
  })

  it('the other finders resolve by identity too', () => {
    for (const row of BOT_IMPORT_CATALOG as ReadonlyArray<{ index: number }>) {
      expect(findBotCatalogRow(row.index)?.index).toBe(row.index)
    }
    for (const row of ULTIMATE_WEAPON_IMPORT_CATALOG as ReadonlyArray<{ index: number }>) {
      expect(findUltimateWeaponCatalogRow(row.index)?.index).toBe(row.index)
    }
    for (const row of WORKSHOP_ENHANCEMENT_IMPORT_CATALOG as ReadonlyArray<{ index: number }>) {
      expect(findWorkshopEnhancementCatalogRow(row.index)?.index).toBe(row.index)
    }
  })

  it('returns null for an index no row owns, rather than a neighbour', () => {
    expect(findWorkshopCatalogRow(-1)).toBeNull()
    expect(findWorkshopCatalogRow(9999)).toBeNull()
    expect(findBotCatalogRow(-1)).toBeNull()
    expect(findUltimateWeaponCatalogRow(9999)).toBeNull()
  })
})

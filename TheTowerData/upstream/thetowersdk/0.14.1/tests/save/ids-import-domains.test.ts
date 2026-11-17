/**
 * Cards and Workshop from nine real players' IDS blocks.
 *
 * Same rules as the labs adapter: the real save readers do the consuming, a
 * planted fault proves each guard bites, and nothing may be dropped in silence.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { listUltimateWeaponCatalogRows } from '../../src/save/catalogs/ultimate-weapons'
import {
  IDS_UW_CATALOG_UPGRADE_NAMES_ARE_MIS_SLICED,
} from '../../src/save/ids/import-domains'
import { SRC } from '../helpers/paths'





describe('the catalog field the adapter refuses to trust', () => {
  /*
   * `IDS_UW_CATALOG_UPGRADE_NAMES_ARE_MIS_SLICED` records that
   * `upgradeNames` names the wrong upgrade for eight of the nine weapons, and
   * the adapter derives the ordinal from IDS row order instead. That was a
   * comment and a constant with nothing holding it — so if the catalog were
   * fixed upstream, nothing would say so, and the workaround would outlive the
   * defect it works around. A permanent detour around a repaired road.
   */
  it('still carries one name per weapon where three are needed', () => {
    const rows = listUltimateWeaponCatalogRows() as Array<Record<string, unknown>>
    expect(rows.length, 'the catalog is empty — this proves nothing').toBe(9)

    for (const row of rows) {
      const names = row.upgradeNames
      // A single string cannot carry a weapon's three upgrades. The day this
      // becomes an array of three, the field is fixed: delete the constant,
      // and read the ordinal from the catalog instead of from row order.
      expect(typeof names, `${String(row.name)} upgradeNames is no longer a bare string`)
        .toBe('string')
    }
  })

  it('is flagged as untrustworthy, and the flag says untrustworthy', () => {
    // The constant is the anchor the explanation hangs off; a silent flip to
    // false would read as "this was fixed" with nothing having changed.
    expect(IDS_UW_CATALOG_UPGRADE_NAMES_ARE_MIS_SLICED).toBe(true)
  })

  it('does not read the field anywhere in the adapter', () => {
    // The claim is only worth making if the adapter actually avoids it.
    const source = readFileSync(
      join(SRC, 'save', 'ids', 'import-domains.ts'),
      'utf8',
    )
    /*
     * The PROPERTY read, not the word. A first pass matched any line
     * containing `upgradeNames` and flagged `guardianUpgradeNames()` -- a
     * local function in an unrelated domain -- which is exactly the one-token
     * grep this repo keeps getting caught by.
     */
    const reads = source.split(/\r?\n/).filter(line =>
      /\.upgradeNames\b/.test(line) && !line.trim().startsWith('*'))
    expect(reads, `the adapter reads a field it declares wrong: ${reads.join(' | ')}`).toEqual([])
  })
})

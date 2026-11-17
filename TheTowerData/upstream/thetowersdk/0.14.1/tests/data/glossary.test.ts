/**
 * The glossary is only worth shipping if its names are real. These tests are the
 * thing that makes that true: an expansion that does not resolve to a catalog
 * name fails the build, so a plausible-sounding but invented term cannot land.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import * as data from '../../src/data'
import * as save from '../../src/save'
import {
  expandAcronym,
  GLOSSARY,
  GLOSSARY_CONCEPTS,
  GLOSSARY_NAME_ROWS,
  listAmbiguousGlossaryTerms,
  lookupGlossary,
} from '../../src/data/glossary/terms'

const catalog = { ...data, ...save } as Record<string, unknown>

/** Every player-facing name the shipped catalogs contain. */
function collectCatalogNames(): Set<string> {
  type CatalogRow = Record<string, unknown>

  const names = new Set<string>()
  const push = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) names.add(value.trim().toLowerCase())
  }

  for (const weapon of (catalog.ULTIMATE_WEAPON_IMPORT_CATALOG as CatalogRow[]) ?? []) {
    push(weapon.name)
    push(weapon.plusName)
  }
  for (const bot of (catalog.BOT_IMPORT_CATALOG as CatalogRow[]) ?? []) push(bot.name)
  for (const module of (catalog.MODULE_TEMPLATES as CatalogRow[]) ?? []) push(module.name)
  for (const card of (catalog.CARD_IMPORT_CATALOG as CatalogRow[]) ?? []) push(card.name)
  for (const currency of (catalog.CURRENCY_DEFINITIONS as CatalogRow[]) ?? []) push(currency.name)
  for (const type of (catalog.MODULE_TYPE_ROWS as CatalogRow[]) ?? []) push(type.name)
  const workshop = (catalog.getWorkshopStatDefinitions as (() => CatalogRow[]) | undefined)?.() ?? []
  for (const stat of workshop) push(stat.name ?? stat.label)

  return names
}

describe('glossary', () => {
  const catalogNames = collectCatalogNames()

  it('has entries', () => {
    expect(GLOSSARY_NAME_ROWS.length).toBeGreaterThan(100)
    expect(GLOSSARY_CONCEPTS.length).toBeGreaterThan(10)
  })

  it('every catalog-backed acronym expands to a name that exists in the catalogs', () => {
    // The guard that stops a plausible expansion being invented. It applies to
    // entries claiming to name something in the data -- community shorthand is
    // checked separately below, because "Damage Enhancements" is real usage
    // with no catalog row behind it and holding it to this rule would mean
    // dropping the half of the vocabulary players type most.
    const unresolved = GLOSSARY
      .filter(entry => entry.expansion && entry.source !== 'community')
      .filter(entry => !catalogNames.has(entry.expansion!.trim().toLowerCase()))
      .map(entry => `${entry.term} → ${entry.expansion}`)

    expect(unresolved).toEqual([])
  })

  /*
   * A drift check against a list that lives in a *sibling package*, so it only
   * exists when this source tree sits inside the workspace it was extracted
   * from. Published on its own, the file is absent and the check is not
   * meaningful — skipped rather than failed, and skipped on the file being
   * missing rather than on an env var, so it cannot silently stop running
   * where it does apply.
   */
  const curatedPath = join(__dirname, '..', '..', '..', 'platform', 'src', 'ai', 'acronyms.ts')
  const itCurated = existsSync(curatedPath) ? it : it.skip

  itCurated('carries the whole curated acronym list, not a subset of it', () => {
    // The assistant reads a player's question against that list. It and the
    // glossary disagreed about 257 terms while each was maintained alone, so
    // completeness is asserted rather than hoped for.
    const curatedSource = readFileSync(curatedPath, 'utf8')
    const curatedTerms = [...curatedSource.matchAll(/^\s*'?([A-Za-z0-9#+_-]+)'?\s*:\s*'([^']+)'/gm)]
      .map(match => match[1].toLowerCase())

    expect(curatedTerms.length).toBeGreaterThan(280)

    const known = new Set(GLOSSARY.map(entry => entry.term.toLowerCase()))
    const missing = [...new Set(curatedTerms)].filter(term => !known.has(term))
    expect(missing).toEqual([])
  })

  it('marks every expansion the catalogs cannot back', () => {
    // The point of `source` is that an expansion which resolves to nothing in
    // the data has to say so. Entries that do resolve need no marking -- the
    // guard above already holds them to the catalogs -- but one that does not
    // and is unmarked would read as a fact about the game.
    const unmarked = GLOSSARY
      .filter(entry => entry.expansion)
      .filter(entry => !catalogNames.has(entry.expansion!.trim().toLowerCase()))
      .filter(entry => entry.source !== 'community')
      .map(entry => `${entry.term} → ${entry.expansion}`)

    expect(unmarked).toEqual([])
  })

  it('every entry is fully described', () => {
    for (const entry of GLOSSARY) {
      expect(entry.term.trim(), JSON.stringify(entry)).toBeTruthy()
      expect(entry.definition.trim().length, entry.term).toBeGreaterThan(10)
      expect(['name', 'acronym', 'concept']).toContain(entry.kind)
    }
  })

  it('does not define the same meaning twice', () => {
    const keys = GLOSSARY.map(entry =>
      `${entry.kind}|${entry.domain}|${entry.term.toLowerCase()}|${entry.expansion ?? ''}`)
    expect(keys.length).toBe(new Set(keys).size)
  })

  it('flags terms that mean more than one thing', () => {
    const ambiguous = listAmbiguousGlossaryTerms()
    expect(ambiguous).toContain('SR')

    const shrinkOrSolar = lookupGlossary('SR')
    expect(shrinkOrSolar.length).toBeGreaterThan(1)
    // Ambiguous on its own, resolvable once a caller commits to a domain.
    expect(expandAcronym('SR')).toBeNull()
  })

  it('resolves unambiguous acronyms', () => {
    expect(expandAcronym('ILM')).toBe('Inner Land Mines')
    expect(expandAcronym('GT')).toBe('Golden Tower')
    expect(expandAcronym('CPK')).toBe('Coins / Kill Bonus')
  })

  it('lookup is case-insensitive and trims', () => {
    expect(lookupGlossary('  ilm  ')).toEqual(lookupGlossary('ILM'))
  })

  it('does not contain names the game does not use', () => {
    // Regressions caught in review; each was a plausible-looking invention.
    for (const invented of ['Chronofield', 'Energy Bender', 'Gold Bot', 'Wildfire Ultimate']) {
      expect(lookupGlossary(invented), invented).toEqual([])
    }
  })
})

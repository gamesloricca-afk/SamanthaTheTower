import { describe, expect, it } from 'vitest'
import fixtures from '../../fixtures/mechanics/effective-paths-formula.fixtures.json'
import { EFFECTIVE_PATHS_ALIASES } from '../../src/mechanics/effective-paths/aliases'
import {
  buildEffectivePathsDocument,
  normalizeSheetVersion,
  parseWorkbookDefinedNames,
} from '../../src/mechanics/effective-paths/workbook'

/** Wrap formula text the way Google writes it into `xl/workbook.xml`. */
function asWorkbookXml(entries: Record<string, string>): string {
  const escape = (text: string) => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  const definedNames = Object.entries(entries)
    .map(([name, formula]) => `<definedName name="${escape(name)}">${escape(formula)}</definedName>`)
    .join('')
  return `<?xml version="1.0"?><workbook><definedNames>${definedNames}</definedNames></workbook>`
}

describe('reading defined names out of a workbook export', () => {
  it('decodes the escaping, so "<>" survives the round trip', () => {
    // This is the one that would corrupt formulas silently: the sheet's
    // "not equal" is written &lt;&gt; in the XML, and it appears in every
    // formula that tests for "no module equipped".
    const xml = asWorkbookXml({
      EPH_WALL_REGEN: 'LAMBDA(a, b, IF(a+b<>0, a+b, 1))',
    })
    expect(xml).toContain('&lt;&gt;')

    const names = parseWorkbookDefinedNames(xml)
    expect(names.EPH_WALL_REGEN).toBe('LAMBDA(a, b, IF(a+b<>0, a+b, 1))')
  })

  it('decodes ampersands and numeric entities', () => {
    const names = parseWorkbookDefinedNames(
      '<definedName name="A">1 &amp; 2</definedName>'
      + '<definedName name="B">&#65;&#x42;</definedName>',
    )
    expect(names.A).toBe('1 & 2')
    expect(names.B).toBe('AB')
  })

  it('keeps the first of a name Google emits once per scope', () => {
    const names = parseWorkbookDefinedNames(
      '<definedName name="X" localSheetId="0">FIRST</definedName>'
      + '<definedName name="X">SECOND</definedName>',
    )
    expect(names.X).toBe('FIRST')
  })

  it('ignores an entry with no name rather than throwing', () => {
    expect(parseWorkbookDefinedNames('<definedName>orphan</definedName>')).toEqual({})
  })
})

describe('building a document from a workbook', () => {
  const definedNames = fixtures.functions as Record<string, string>

  it('extracts the eHP stat layer', () => {
    const result = buildEffectivePathsDocument({
      definedNames,
      sheetVersion: fixtures.sheetVersion,
      generatedAt: '2026-08-10T00:00:00.000Z',
      aliases: EFFECTIVE_PATHS_ALIASES,
    })

    expect(result.errors).toEqual([])
    expect(result.skipped).toEqual([])
    expect(result.document).not.toBeNull()
    expect(result.document?.stats.map(s => s.sheetFunction).sort())
      .toEqual(Object.keys(definedNames).sort())
    expect(result.document?.aliases.length).toBe(EFFECTIVE_PATHS_ALIASES.length)
  })

  it('takes only the functions it is asked for', () => {
    const result = buildEffectivePathsDocument({
      definedNames: { ...definedNames, EPD_DPM: 'LAMBDA(a, a)' },
      sheetVersion: 'v1',
      generatedAt: '2026-08-10T00:00:00.000Z',
    })
    // EPD_ is a damage function; the default include is the eHP layer only.
    expect(result.document?.stats.some(s => s.sheetFunction === 'EPD_DPM')).toBe(false)

    const wider = buildEffectivePathsDocument({
      definedNames: { ...definedNames, EPD_DPM: 'LAMBDA(a, a)' },
      sheetVersion: 'v1',
      generatedAt: '2026-08-10T00:00:00.000Z',
      include: name => name.startsWith('EPH_') || name.startsWith('EPD_'),
    })
    expect(wider.document?.stats.some(s => s.sheetFunction === 'EPD_DPM')).toBe(true)
  })

  it('reports what it could not parse instead of dropping it quietly', () => {
    const result = buildEffectivePathsDocument({
      definedNames: {
        ...definedNames,
        EPH_TABLE_LOOKUP: 'LAMBDA(a, XLOOKUP(a, Range, Other))',
        EPH_NOT_A_LAMBDA: "'Master Sheet'!$F$3",
      },
      sheetVersion: 'v1',
      generatedAt: '2026-08-10T00:00:00.000Z',
    })

    // The parseable ones still come through.
    expect(result.document).not.toBeNull()
    expect(result.document?.stats.length).toBe(Object.keys(definedNames).length)

    const reasons = Object.fromEntries(result.skipped.map(s => [s.name, s.reason]))
    expect(reasons.EPH_TABLE_LOOKUP).toMatch(/XLOOKUP/)
    expect(reasons.EPH_NOT_A_LAMBDA).toMatch(/not a LAMBDA/)
  })

  it('returns no document when the result would not validate', () => {
    const result = buildEffectivePathsDocument({
      definedNames,
      sheetVersion: '',
      generatedAt: '2026-08-10T00:00:00.000Z',
    })
    expect(result.document).toBeNull()
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('is reproducible — same input, same output', () => {
    const build = () => buildEffectivePathsDocument({
      definedNames,
      sheetVersion: 'v1',
      generatedAt: '2026-08-10T00:00:00.000Z',
    })
    expect(JSON.stringify(build())).toBe(JSON.stringify(build()))
  })
})

describe('sheet version', () => {
  it('accepts what the sheet writes and rejects what it does not', () => {
    expect(normalizeSheetVersion('v5.09.02.01')).toBe('v5.09.02.01')
    expect(normalizeSheetVersion('  v5.09.02.01  ')).toBe('v5.09.02.01')
    expect(normalizeSheetVersion('Loading...')).toBeNull()
    expect(normalizeSheetVersion('')).toBeNull()
    expect(normalizeSheetVersion(42)).toBeNull()
    expect(normalizeSheetVersion(null)).toBeNull()
  })
})

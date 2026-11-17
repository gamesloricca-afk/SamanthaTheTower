import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  EFFECTIVE_PATHS_ATTRIBUTION,
  EFFECTIVE_PATHS_ATTRIBUTION_WITH_SUPPORT,
  EFFECTIVE_PATHS_AUTHORS,
  EFFECTIVE_PATHS_CONTRIBUTORS,
  EFFECTIVE_PATHS_MAINTAINERS,
  EFFECTIVE_PATHS_SUPPORT,
} from '../../src/mechanics/effective-paths/credits'

/**
 * These formulas are someone else's work, so the credit is part of the contract, not
 * decoration. Spelling especially: **Mattew** has no `h`. Autocorrect and muscle memory
 * both want to write "Matthew", and a misspelt credit is worse than none.
 */
describe('Effective Paths credits', () => {
  const everyone = [
    ...EFFECTIVE_PATHS_AUTHORS,
    ...EFFECTIVE_PATHS_MAINTAINERS,
    ...EFFECTIVE_PATHS_CONTRIBUTORS,
  ]

  it('spells Mattew without an h, everywhere', () => {
    expect(EFFECTIVE_PATHS_AUTHORS.some(credit => credit.name === 'Mattew')).toBe(true)
    for (const credit of everyone) expect(credit.name).not.toMatch(/matthew/i)
    expect(EFFECTIVE_PATHS_ATTRIBUTION).toContain('Mattew')
    expect(EFFECTIVE_PATHS_ATTRIBUTION).not.toMatch(/matthew/i)
  })

  it('names Mattew, QuietFanta and Bisse in the credited roster', () => {
    const names = everyone.map(credit => credit.name)
    for (const name of ['Mattew', 'QuietFanta', 'Bisse']) expect(names, name).toContain(name)
  })

  it('names all three in the attribution line itself', () => {
    for (const name of ['Mattew', 'QuietFanta', 'Bisse']) {
      expect(EFFECTIVE_PATHS_ATTRIBUTION, name).toContain(name)
    }
  })

  it('carries the creator code that supports the team', () => {
    expect(EFFECTIVE_PATHS_SUPPORT.creatorCode).toBe('SHEETLORD')
    expect(EFFECTIVE_PATHS_SUPPORT.storeUrl).toBe('https://store.techtreegames.com/thetower/')
    expect(EFFECTIVE_PATHS_ATTRIBUTION_WITH_SUPPORT).toContain('SHEETLORD')
    // The support line must be a superset of the plain one, so surfaces can swap freely.
    expect(EFFECTIVE_PATHS_ATTRIBUTION_WITH_SUPPORT).toContain(EFFECTIVE_PATHS_ATTRIBUTION)
  })

  it('gives every credited person a non-empty name', () => {
    for (const credit of everyone) expect(credit.name.trim().length).toBeGreaterThan(0)
  })

  it('keeps the shipped docs in step with the code', () => {
    for (const file of ['README.md', 'docs/EFFECTIVE_PATHS.md']) {
      const text = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8')
      expect(text, file).not.toMatch(/matthew/i)
      for (const name of ['Mattew', 'QuietFanta', 'Bisse', 'SHEETLORD']) {
        expect(text, `${file} names ${name}`).toContain(name)
      }
    }
  })
})

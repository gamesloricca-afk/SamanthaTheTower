import { describe, expect, it } from 'vitest'
import { expandAcronym, GLOSSARY, listAmbiguousGlossaryTerms, lookupGlossary } from '../../src/data/glossary/terms'
import { BUILD_TARGET_GRAMMAR } from '../../src/knowledge/compartments/build-targets'
import {
  AMBIGUOUS_TERMS_DISTINCT,
  AMBIGUOUS_TERMS_LISTED,
  JARGON_ACRONYMS,
  WEAPON_INITIAL_DOMAIN,
  WEAPON_INITIALS_NEEDING_DOMAIN,
} from '../../src/knowledge/compartments/jargon'

const INITIALS = Object.keys(BUILD_TARGET_GRAMMAR.weaponInitials)

describe('jargon terms resolve in the shipped glossary', () => {
  it('expands every acronym this compartment names', () => {
    for (const term of JARGON_ACRONYMS) {
      expect(expandAcronym(term), term).not.toBeNull()
    }
  })

  it('does not silently accept a term the glossary lacks', () => {
    expect(expandAcronym('ZZQ')).toBeNull()
    expect(lookupGlossary('ZZQ')).toEqual([])
  })
})

describe('the ambiguous-term list double-counts by case', () => {
  it('lists more entries than there are distinct terms', () => {
    expect(AMBIGUOUS_TERMS_LISTED).toBeGreaterThan(AMBIGUOUS_TERMS_DISTINCT)
    expect(AMBIGUOUS_TERMS_DISTINCT)
      .toBe(new Set(listAmbiguousGlossaryTerms().map(t => t.toLowerCase())).size)
  })

  it('has the duplicates differ only by case, not by meaning', () => {
    const listed = listAmbiguousGlossaryTerms()
    const dupes = listed.filter(t => listed.some(o => o !== t && o.toLowerCase() === t.toLowerCase()))
    expect(dupes.length).toBeGreaterThan(0)
    for (const term of dupes) {
      // Lookup lowercases, so both spellings reach the same entries.
      expect(lookupGlossary(term)).toEqual(lookupGlossary(term.toUpperCase()))
    }
  })
})

describe('weapon initials and the domain they need', () => {
  it('names exactly the initials that fail to expand bare', () => {
    const failing = INITIALS.filter(i => expandAcronym(i) === null)
    expect([...WEAPON_INITIALS_NEEDING_DOMAIN].sort()).toEqual(failing.sort())
  })

  it('leaves exactly one of the nine unresolvable without a domain', () => {
    expect(WEAPON_INITIALS_NEEDING_DOMAIN).toEqual(['SL'])
    expect(INITIALS.length - WEAPON_INITIALS_NEEDING_DOMAIN.length).toBe(8)
  })

  it('resolves all nine once the domain is supplied', () => {
    for (const initial of INITIALS) {
      const expanded = expandAcronym(initial, WEAPON_INITIAL_DOMAIN as never)
      expect(expanded, initial).toBe(
        BUILD_TARGET_GRAMMAR.weaponInitials[initial as keyof typeof BUILD_TARGET_GRAMMAR.weaponInitials],
      )
    }
  })

  it('fails for the right reason — SL means two real things', () => {
    const matches = lookupGlossary('SL').filter(e => e.kind === 'acronym')
    expect(matches.length).toBeGreaterThan(1)
    expect(new Set(matches.map(e => e.domain)).size).toBeGreaterThan(1)
    expect(matches.map(e => e.expansion)).toContain('Spotlight')
  })

  it('keeps the glossary non-trivial, so these counts mean something', () => {
    expect(GLOSSARY.length).toBeGreaterThan(100)
  })
})

import { describe, expect, it } from 'vitest'
import { CARD_TEMPLATES } from '../../src/data/cards/data'
import {
  CARD_CATALOG_SIZE,
  CARD_MASTERY_NAME_TO_CARD,
  CARD_MASTERY_STONE_COST,
  MASTERY_PRICED_CARD_COUNT,
  MASTERY_TERMS_WITH_TRAILING_PUNCTUATION,
} from '../../src/knowledge/compartments/masteries'

const CARD_NAMES = CARD_TEMPLATES.map(card => card.name)
const MASTERY_NAMES = CARD_TEMPLATES.map(card => card.masteryName)

/** Both name spaces at once — resolving against cards alone is the bug. */
const RESOLVES = (term: string): boolean =>
  CARD_NAMES.includes(term) || MASTERY_NAMES.includes(term)

describe('every card has exactly one mastery, with its own name', () => {
  it('gives each card a mastery name', () => {
    for (const card of CARD_TEMPLATES) {
      expect(card.masteryName, `${card.name} has no mastery name`).toBeTruthy()
    }
    expect(MASTERY_NAMES).toHaveLength(CARD_CATALOG_SIZE)
  })

  it('names most masteries something other than the card', () => {
    const renamed = CARD_TEMPLATES.filter(c => c.masteryName !== c.name && !c.masteryName.endsWith('+'))
    expect(renamed.length).toBeGreaterThan(CARD_TEMPLATES.length / 2)
    // The specific pair the correction turned on.
    const zerk = CARD_TEMPLATES.find(c => c.id === 'zerk')!
    expect(zerk.name).toBe('Berserker')
    expect(zerk.masteryName).toBe('Viking Funeral')
  })

  it('has Coin Orb as a MASTERY name, not a card — the case I got wrong', () => {
    expect(CARD_NAMES).not.toContain('Coin Orb')
    expect(MASTERY_NAMES).toContain('Coin Orb')
    expect(CARD_TEMPLATES.find(c => c.masteryName === 'Coin Orb')?.name).toBe('Extra Orb')
    // Resolving against cards alone would call it uncovered. It is not.
    expect(RESOLVES('Coin Orb')).toBe(true)
  })
})

describe('the Berserker typo is fixed at source', () => {
  it('spells the card the way the game does', () => {
    expect(CARD_NAMES).toContain('Berserker')
    expect(CARD_NAMES).not.toContain('Berzerker')
  })

  it('needs no alias for it any more', () => {
    expect(CARD_MASTERY_NAME_TO_CARD).not.toHaveProperty('Berserker')
    expect(Object.keys(CARD_MASTERY_NAME_TO_CARD)).toEqual(['Package Chance'])
  })

  it('resolves every alias key onto a real card', () => {
    for (const [alias, card] of Object.entries(CARD_MASTERY_NAME_TO_CARD)) {
      expect(CARD_NAMES, `${alias} -> ${card}`).toContain(card)
      expect(CARD_NAMES, `${alias} should not already match`).not.toContain(alias)
    }
  })
})

describe('mastery punctuation normalization', () => {
  it('lists punctuation artefacts that all end in a non-word character', () => {
    for (const term of MASTERY_TERMS_WITH_TRAILING_PUNCTUATION) {
      expect(term, term).toMatch(/[^\w)]$/)
      expect(term.replace(/[^\w\s]+$/, ''), term).toMatch(/ Mastery$/)
    }
  })
})

describe('counts stay in step', () => {
  it('prices one mastery per catalog card', () => {
    expect(MASTERY_PRICED_CARD_COUNT).toBe(CARD_CATALOG_SIZE)
  })

  it('resolves every priced mastery onto a card, through the alias where needed', () => {
    for (const priced of Object.keys(CARD_MASTERY_STONE_COST)) {
      const card = CARD_MASTERY_NAME_TO_CARD[priced] ?? priced
      expect(CARD_NAMES, `"${priced}" resolves to no card (tried "${card}")`).toContain(card)
    }
  })
})

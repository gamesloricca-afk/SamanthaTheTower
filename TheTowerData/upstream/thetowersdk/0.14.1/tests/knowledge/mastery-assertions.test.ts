import { describe, expect, it } from 'vitest'
import { GAME_KNOWLEDGE } from '../../src/knowledge'
import {
  CARD_MASTERY_EFFECTS,
  CARD_MASTERY_LAB_DAYS_BY_LEVEL,
  CARD_MASTERY_LAB_DAYS_TO_MAX,
  CARD_MASTERY_MAX_LEVEL,
  CARD_MASTERY_NAME_TO_CARD,
  CARD_MASTERY_STONE_COST,
  MASTERIES_THAT_SCALE_THE_CARD,
} from '../../src/knowledge/compartments/masteries'
import { CARD_TEMPLATES } from '../../src/data/cards/data'

/**
 * Masteries were the largest gap in the graph: 33 of 36 nodes carried no
 * assertion at all, so 31 per-card nodes described a system in prose that
 * nothing could contradict.
 *
 * The assertion that earns its keep is `resolvesToCatalogCard`. The other four
 * per-mastery claims restate a table ten lines away and can only fail if
 * someone edits that table; this one JOINS the mastery to the shipped card
 * catalog, and it is false the moment a card is renamed or dropped. That join
 * has silently broken twice — `Berserker` against a `Berzerker` typo, and
 * `Package Chance` against `Recovery Package Chance` — and both times it read
 * as "that card has no mastery" rather than as a mismatch.
 */

const masteries = GAME_KNOWLEDGE.compartments.find(c => c.id === 'masteries')!
const assertionsFor = (id: string) => masteries.nodes.find(n => n.id === id)?.assertions ?? []
const claim = (id: string, predicate: string) =>
  assertionsFor(id).find(a => a.predicate === predicate)?.value

describe('every mastery node carries checkable claims', () => {
  it('leaves no node in the compartment without an assertion', () => {
    const bare = masteries.nodes.filter(n => !(n.assertions?.length)).map(n => n.id)
    expect(bare).toEqual([])
  })

  it('has exactly one node per mastery in CARD_MASTERY_EFFECTS, both ways', () => {
    // Derived from the effects table rather than by excluding a hand-listed set
    // of structural nodes. The compartment has four of those — vocabulary,
    // naming, effect, lab — and a hand-list would have silently stopped
    // covering whichever one was added next.
    const expected = new Set(
      Object.keys(CARD_MASTERY_EFFECTS).map(card => `cardMastery.${card.replace(/\s+/g, '')}`),
    )
    const present = new Set(masteries.nodes.map(n => n.id).filter(id => expected.has(id)))
    const missing = [...expected].filter(id => !present.has(id))
    expect(missing, 'masteries in the table with no node').toEqual([])
    expect(present.size).toBe(expected.size)
  })

  it('resolves every mastery to a card that exists in the shipped catalog', () => {
    const unresolved = masteries.nodes
      .flatMap(n => n.assertions ?? [])
      .filter(a => a.predicate === 'resolvesToCatalogCard' && a.value !== true)
      .map(a => a.subject)
    expect(unresolved, `masteries naming a card the catalog does not have:\n  ${unresolved.join('\n  ')}`)
      .toEqual([])
  })

  it('resolves through the alias table, not by exact name alone', () => {
    // Package Chance is the live case: the mastery tables and the game write
    // `Recovery Package`, the catalog writes `Recovery Package Chance`.
    const alias = Object.keys(CARD_MASTERY_NAME_TO_CARD)[0]
    expect(CARD_TEMPLATES.some(t => t.name === alias)).toBe(false)
    expect(CARD_TEMPLATES.some(t => t.name === CARD_MASTERY_NAME_TO_CARD[alias])).toBe(true)
    expect(claim(`cardMastery.${alias.replace(/\s+/g, '')}`, 'resolvesToCatalogCard')).toBe(true)
  })

  it('carries the stone cost and scaling flag from the tables', () => {
    for (const card of Object.keys(CARD_MASTERY_EFFECTS)) {
      const id = `cardMastery.${card.replace(/\s+/g, '')}`
      expect(claim(id, 'stoneCost'), `${card} stone cost`).toBe(CARD_MASTERY_STONE_COST[card])
      expect(claim(id, 'maxLevel'), `${card} max level`).toBe(CARD_MASTERY_MAX_LEVEL)
      expect(claim(id, 'scalesOwnCardStat'), `${card} scaling flag`)
        .toBe((MASTERIES_THAT_SCALE_THE_CARD as readonly string[]).includes(card))
    }
  })

  it('states the non-scaling majority rather than leaving it to subtraction', () => {
    const total = Object.keys(CARD_MASTERY_EFFECTS).length
    expect(claim('cardMastery.effect', 'scaleOwnCardStat')).toBe(MASTERIES_THAT_SCALE_THE_CARD.length)
    expect(claim('cardMastery.effect', 'addADistinctMechanic'))
      .toBe(total - MASTERIES_THAT_SCALE_THE_CARD.length)
  })

  it('derives the lab total from its own per-level parts', () => {
    const summed = Object.values(CARD_MASTERY_LAB_DAYS_BY_LEVEL).reduce((sum, d) => sum + d, 0)
    expect(claim('cardMastery.lab', 'daysToMaxOneMastery')).toBeCloseTo(summed, 6)
    // And the separately-stated constant must agree with that sum, or one of
    // the two has drifted.
    expect(summed).toBeCloseTo(CARD_MASTERY_LAB_DAYS_TO_MAX, 6)
  })
})

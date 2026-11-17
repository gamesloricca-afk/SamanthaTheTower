import { describe, expect, it } from 'vitest'
import {
  AD_COIN_BONUS_MULTIPLIER, BOTH_PACKS_COIN_MULTIPLIER,
  COINS_CARD_INDEX, COINS_MASTERY_RESEARCH_INDEX,
  ECONOMY_KNOWLEDGE_NODES, EPIC_PACK_COIN_MULTIPLIER,
  STARTER_PACK_COIN_MULTIPLIER, WAVE_SKIP_CARD_INDEX,
} from '../../src/knowledge/compartments/economy'
import { CARD_IMPORT_CATALOG } from '../../src/data/player-stats/fields.data'

describe('account coin bonuses', () => {
  it('multiplies both purchased packs to six times the base income', () => {
    expect(STARTER_PACK_COIN_MULTIPLIER).toBe(2)
    expect(EPIC_PACK_COIN_MULTIPLIER).toBe(3)
    expect(BOTH_PACKS_COIN_MULTIPLIER).toBe(6)
    expect(BOTH_PACKS_COIN_MULTIPLIER)
      .toBe(STARTER_PACK_COIN_MULTIPLIER * EPIC_PACK_COIN_MULTIPLIER)
    expect(AD_COIN_BONUS_MULTIPLIER).toBe(1.5)
  })

  it('identifies the Coins and Wave Skip cards by saved card index', () => {
    const byIndex = new Map(CARD_IMPORT_CATALOG.map(card => [card.index, card.name]))
    expect(byIndex.get(COINS_CARD_INDEX)).toBe('Coins')
    expect(byIndex.get(WAVE_SKIP_CARD_INDEX)).toBe('Wave Skip')
    expect(COINS_CARD_INDEX).not.toBe(WAVE_SKIP_CARD_INDEX)
    expect(COINS_MASTERY_RESEARCH_INDEX).toBe(166)
  })

  it('keeps farming advice separate from quantitative claims', () => {
    const advice = ECONOMY_KNOWLEDGE_NODES.find(node => node.id === 'economy.farmingAdvice')!
    expect(advice.claimType).toBe('sentiment')
    expect(advice.assertions ?? []).toEqual([])
    expect(advice.implementedBy ?? []).toEqual([])
  })
})

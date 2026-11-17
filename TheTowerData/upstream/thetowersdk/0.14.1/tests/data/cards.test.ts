import { describe, expect, it } from 'vitest'
import {
  CARD_MASTERY_EFFECT_LEVELS,
  CARD_MASTERY_LEVELS,
  CARD_TEMPLATES,
  CARDS_BY_RARITY,
} from '../../src/data/cards/data'

/**
 * Card level values, checked against the curves the Effective Paths sheet
 * publishes for the same cards.
 *
 * The catalog stores one number per level, which makes a single mistyped digit
 * invisible — Fortress carried `0.75` where `1.75` belongs for long enough that
 * nothing noticed. The sheet writes these as formulas instead, so where it has
 * one, the whole column can be regenerated and compared.
 */

const card = (id: string) => {
  const template = CARD_TEMPLATES.find(entry => entry.id === id)
  if (!template) throw new Error(`no card template "${id}"`)
  return template
}

describe('card level values against the Effective Paths sheet', () => {
  it('Fortress follows 1.15 + 0.15 × level', () => {
    // eHP!AV25 = 1.15 + 0.15 * AU25, where AU25 is the card level. The sheet
    // reports 1.2999999999999998 for level 1, so this compares to precision
    // rather than exactly.
    const values = card('fort').levelValues
    values.forEach((value, index) => {
      expect(value, `level ${index + 1}`).toBeCloseTo(1.15 + 0.15 * (index + 1), 12)
    })
  })

  it('Extra Defense follows 4% + 1% × level', () => {
    // eHP!AV23 = 4% + 1% * AU23. The catalog stores percents as whole numbers.
    expect(card('def').levelValues)
      .toEqual([1, 2, 3, 4, 5, 6, 7].map(level => 4 + level))
  })

  it('Health keeps the sheet\'s own table, which is not linear', () => {
    // eHP!AV19 is a SWITCH, not a formula — the step drops after level 2.
    expect(card('hp').levelValues).toEqual([1.5, 2, 2.4, 2.8, 3.2, 3.6, 4])
  })

  it('gives every card seven levels', () => {
    for (const template of CARD_TEMPLATES) {
      expect(template.levelValues, template.id).toHaveLength(7)
    }
  })
})

/**
 * The two derived groupings, pinned to the templates they come from.
 *
 * Both of these were wrong on 2026-08-17 and neither failed anything:
 *
 * - `CARDS_BY_RARITY` was a hand-written literal whose `rare` bucket omitted
 *   `ws` (Wave Skip). The card import preview falls through to `'common'` for
 *   an unlisted id, and `getEffectiveChance` divides by the bucket length, so
 *   every rare card's draw odds came out 8/7 too high.
 * - `masteryValues` is indexed from level 0, not level 1. The interface comment
 *   said otherwise and platform's chart library followed it.
 */
describe('card groupings stay derived from the templates', () => {
  it('buckets every template by rarity, with none dropped', () => {
    const bucketed = Object.values(CARDS_BY_RARITY).flat()

    expect(bucketed).toHaveLength(CARD_TEMPLATES.length)
    expect(new Set(bucketed).size, 'a card is bucketed twice').toBe(bucketed.length)

    for (const template of CARD_TEMPLATES) {
      expect(
        CARDS_BY_RARITY[template.rarity]?.includes(template.id),
        `${template.id} (${template.name}) is missing from the ${template.rarity} bucket`,
      ).toBe(true)
    }
  })

  it('keeps Wave Skip rare — the exact card that went missing', () => {
    expect(card('ws').rarity).toBe('rare')
    expect(CARDS_BY_RARITY.rare).toContain('ws')
    // 9 since v29 added Cells. This count is the guard that caught the missing card in
    // the first place, so it moves only alongside a real addition to the templates.
    expect(CARDS_BY_RARITY.rare).toHaveLength(9)
    expect(CARDS_BY_RARITY.rare).toContain('cells')
  })

  it('covers mastery levels 0-9, one more value than there are lab levels', () => {
    // The wiki's Card Mastery Overview table is headed 0-9 (ten columns); its
    // lab time/coin table runs 1-9. Unlocking grants the level-0 effect, so the
    // two are consistent and the arrays must differ in length by exactly one.
    expect(CARD_MASTERY_EFFECT_LEVELS).toHaveLength(CARD_MASTERY_LEVELS.length + 1)
    expect(CARD_MASTERY_EFFECT_LEVELS[0]).toBe(0)

    for (const template of CARD_TEMPLATES) {
      expect(template.masteryValues, `${template.id} mastery values`)
        .toHaveLength(CARD_MASTERY_EFFECT_LEVELS.length)
    }

    // Damage's row on the wiki: x1.4 at level 0 through x5 at level 9.
    expect(card('dmg').masteryValues[0], 'mastery level 0').toBe(1.4)
    expect(card('dmg').masteryValues[9], 'mastery level 9').toBe(5)
  })
})

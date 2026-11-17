import { describe, expect, it } from 'vitest'
import { GAME_KNOWLEDGE } from '../../src/knowledge'
import { ULTIMATE_WEAPON_CATALOG_ASSERTIONS } from '../../src/knowledge/compartments/ultimate-weapons'
import { TOWER_HARD_CAPS } from '../../src/knowledge/compartments/tower'
import { ASSIST_HARD_CAPS } from '../../src/knowledge/compartments/modules'
import { CARD_DRAW_RATE } from '../../src/knowledge/compartments/cards'
import { CARD_TEMPLATES } from '../../src/data/cards/data'

/**
 * Whole-graph completeness, and the cross-table agreements that span
 * compartments.
 */

const allNodes = GAME_KNOWLEDGE.compartments.flatMap(c => c.nodes)
const allAssertions = allNodes.flatMap(n => n.assertions ?? [])

describe('no claim is built and then dropped', () => {
  /**
   * Every catalog assertion must reach a node.
   *
   * This exists because 36 of them did not. Moving the per-weapon assertions
   * off the parent node used an equality filter on subject, which silently
   * excluded the per-STAT subjects — `ultimateWeapon.blackHole.Size` and 35
   * siblings. Nothing reported it: a filter that excludes wrongly looks exactly
   * like a filter with nothing to exclude.
   */
  it('every ultimate-weapon catalog assertion reaches the graph', () => {
    const present = new Set(allAssertions.map(a => `${a.subject}|${a.predicate}`))
    const lost = ULTIMATE_WEAPON_CATALOG_ASSERTIONS
      .filter(a => !present.has(`${a.subject}|${a.predicate}`))
      .map(a => `${a.subject}.${a.predicate}`)
    expect(lost, `built but never attached:\n  ${lost.join('\n  ')}`).toEqual([])
  })

  it('leaves few enough bare nodes that the number is worth tracking', () => {
    const bare = allNodes.filter(n => !(n.assertions?.length))
    // Was 184 of 290 on 2026-08-18. Ratchet this down; never up.
    expect(bare.length).toBeLessThanOrEqual(51)
  })
})

describe('caps agree across compartments, allowing for units', () => {
  /**
   * The tower table stores FRACTIONS and the assist table stores PERCENT.
   *
   * Same caps, same field names, two scales. Reading one where the other is
   * expected is wrong by a hundredfold — and a hundredfold error in a defense
   * figure gives a tower that never dies or dies instantly, rather than a
   * number anyone would call suspicious.
   */
  it('the shared caps are equal once scaled', () => {
    expect(TOWER_HARD_CAPS.defensePercent * 100).toBeCloseTo(ASSIST_HARD_CAPS.defensePercent, 9)
    expect(TOWER_HARD_CAPS.wallRebuildSeconds).toBe(ASSIST_HARD_CAPS.wallRebuildSeconds)
    expect(TOWER_HARD_CAPS.shockwaveFrequencySeconds)
      .toBe(ASSIST_HARD_CAPS.shockwaveFrequencySeconds)
  })

  it('the two tables really are on different scales, so the check is not vacuous', () => {
    expect(TOWER_HARD_CAPS.defensePercent).toBeLessThan(1)
    expect(ASSIST_HARD_CAPS.defensePercent).toBeGreaterThan(1)
  })
})

describe('card rarity keys need normalising before a join', () => {
  it('a raw join matches nothing, which is why the warning is on the table', () => {
    const catalogRarities = new Set(CARD_TEMPLATES.map(t => t.rarity))
    const raw = Object.keys(CARD_DRAW_RATE).filter(rarity => catalogRarities.has(rarity as never))
    expect(raw).toEqual([])
  })

  it('every draw-rate rarity matches a catalog rarity once lower-cased', () => {
    const catalogRarities = new Set(CARD_TEMPLATES.map(t => String(t.rarity).toLowerCase()))
    const missing = Object.keys(CARD_DRAW_RATE)
      .filter(rarity => !catalogRarities.has(rarity.toLowerCase()))
    expect(missing).toEqual([])
    expect(catalogRarities.size).toBe(Object.keys(CARD_DRAW_RATE).length)
  })
})

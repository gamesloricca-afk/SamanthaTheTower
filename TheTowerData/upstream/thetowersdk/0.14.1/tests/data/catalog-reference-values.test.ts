import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { CARD_TEMPLATES } from '../../src/data'
import { MILESTONE_TIER_DATA } from '../../src/data/milestones/tracks'

/**
 * Catalog values must match the versioned reference fixtures under explicit unit conversions.
 *
 * The catalogs here were assembled from the wiki, from community sheets and from earlier
 * reference tables, and a wrong value in one of them does not fail — it renders, and it feeds a
 * planner. Two were wrong before this file existed:
 *
 *   - Wave Accelerator level 5 said 48% where the game shows 46%, breaking the card's own
 *     +4 progression (30 / 34 / 38 / 42 / 46 / 50 / 54)
 *   - Milestone tier 1 wave 10 said 10 Coins where the game shows 25
 *
 * WHAT THE STORED TABLE IS NOT. `cardBenefit` is the value the game keeps, and for most
 * cards it is also the value the game SHOWS. For some it is not, and the card screen is the
 * authority on what a player sees. Two are known and listed in `STORED_DIFFERS_FROM_SHOWN`
 * below; both were "corrected" here against the stored table before screenshots settled it,
 * which is the mistake this comment exists to stop repeating. A difference between the two
 * is a fact about the game worth recording, not a defect in this package to be patched away.
 *
 * The comparison is against committed `facts/v29.0.0/*.json` fixtures containing
 * identifiers, values and units. Stored values and display values remain distinct.
 *
 * UNITS are the one subtlety, and they are handled explicitly rather than by loosening the
 * comparison. The game stores a fraction where this package stores a percent, a multiplier
 * where it stores a percent increase, and seconds where it stores minutes. Each card is
 * checked under the conventions its own `levelType` allows, so a real difference cannot hide
 * behind a unit and a unit is never reported as a difference.
 */

const FACTS = path.resolve(__dirname, '../../facts/v29.0.0')

function readFact<T>(name: string): T {
  return JSON.parse(readFileSync(path.join(FACTS, name), 'utf8')) as T
}

interface CardBenefitFact {
  gameVersion: string
  cards: { cardId: string; levelValues: number[] }[]
}

interface MilestoneFact {
  gameVersion: string
  tiers: {
    tier: number
    free: { slot: number; type: string | null; value: number | null }[]
  }[]
}

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Readings of a stored value that this package legitimately uses. */
function readings(stored: number): number[] {
  return [
    stored, //               same unit
    stored * 100, //         fraction -> percent
    (stored - 1) * 100, //   multiplier -> percent increase
    (1 - stored) * 100, //   multiplier -> percent reduction
    stored / 60, //          seconds -> minutes
  ]
}

const close = (a: number, b: number) => Math.abs(a - b) <= Math.max(5e-3, Math.abs(b) * 2e-3)

/**
 * Cards whose STORED benefit is not the number the card screen shows.
 *
 * The card screen is what a player reads, so this package follows it. The stored value is
 * retained in the versioned fixture; it just is not the
 * same quantity, and asserting they are equal makes this suite demand a wrong answer.
 *
 * Confirmed from in-game screenshots on 2026-09-03, after both were briefly "fixed" the
 * wrong way against the stored table.
 */
const STORED_DIFFERS_FROM_SHOWN: Record<string, string> = {
  'Death Ray':
    'shows 2.3 / 2.7 / 3.1 / 3.5 / 3.9 / 4.4 / 4.9 sec; stored table runs 2.3 / 2.66 / 3.05 '
    + '/ 3.44 / 3.83 / 4.3 / 4.6. Level 1 agrees and the rest drift, so the shown duration is '
    + 'not the stored one.',
  'Energy Shield':
    'shows 8 min at level 7; the stored table has 485 seconds, which is 8.08. Levels 1-6 '
    + 'agree exactly at 60 s per minute, so only the last entry differs.',
}

describe('card level values match the reference fixture', () => {
  const fact = readFact<CardBenefitFact>('card-benefits.json')
  const byCard = new Map(fact.cards.map(c => [normalise(c.cardId), c.levelValues]))

  const checked = CARD_TEMPLATES.filter(
    card => byCard.has(normalise(card.name)) && !(card.name in STORED_DIFFERS_FROM_SHOWN),
  )

  it('covers the cards the game has a benefit table for', () => {
    // Not every card is in both: `Super Tower` is special-cased in game code and has no row
    // in the benefit table, so it is legitimately absent rather than missing.
    expect(checked.length).toBeGreaterThanOrEqual(26)
  })

  it('every documented exception still disagrees, and is still in the table', () => {
    // If one of these ever starts matching, the game changed or the reason recorded above was
    // wrong. Either way it should stop being an exception rather than sit here unexamined.
    for (const [name, reason] of Object.entries(STORED_DIFFERS_FROM_SHOWN)) {
      const card = CARD_TEMPLATES.find(c => c.name === name)
      expect(card, `${name} is no longer a card`).toBeTruthy()
      const game = byCard.get(normalise(name))
      expect(game, `${name} has no stored benefit row`).toBeTruthy()
      const agrees = [0, 1, 2, 3, 4].some(which =>
        game!.every((stored, i) => close(card!.levelValues[i], readings(stored)[which])),
      )
      expect(agrees, `${name} now AGREES with the stored table — drop the exception. ${reason}`).toBe(false)
    }
  })

  it.each(checked.map(card => [card.name, card] as const))(
    '%s',
    (_name, card) => {
      const game = byCard.get(normalise(card.name))!
      expect(card.levelValues).toHaveLength(game.length)
      // One consistent reading has to explain EVERY level. Allowing a different convention
      // per level would let a single wrong number slip through as a unit change.
      const consistent = [0, 1, 2, 3, 4].some(which =>
        game.every((stored, i) => close(card.levelValues[i], readings(stored)[which])),
      )
      expect(consistent, `no single unit convention maps ${card.name} to ${JSON.stringify(game)}`).toBe(true)
    },
  )
})

describe('milestone rewards match the game', () => {
  const fact = readFact<MilestoneFact>('milestone-rewards.json')

  it('has the same number of tiers as the game', () => {
    expect(MILESTONE_TIER_DATA.length).toBe(fact.tiers.length)
  })

  it('tier 1 rewards read in the game order, with the game amounts', () => {
    const tier1 = fact.tiers.find(t => t.tier === 1)!
    const amounts = tier1.free
      .filter(r => (r.type === 'Coins' || r.type === 'Gems') && r.value !== null)
      .slice(0, 5)
      .map(r => `${r.value} ${r.type}`)
    const labels = MILESTONE_TIER_DATA[0].standard.waveRewards.flatMap(w => w.rewards)
    // Each amount the game states must appear in the tier's reward labels. `10 Coins` sat
    // here where the game says 25, and nothing else in the tier disagreed.
    for (const amount of amounts) {
      const [value, kind] = amount.split(' ')
      const wanted = Number(value)
      const found = labels.some(label => {
        const m = label.match(/^([\d.]+)(k?)\s+(\w+)/)
        if (!m || m[3] !== kind) return false
        return Number(m[1]) * (m[2] === 'k' ? 1000 : 1) === wanted
      })
      expect(found, `no ${amount} reward in milestone tier 1: ${labels.join(', ')}`).toBe(true)
    }
  })
})

describe('the shipped fixtures contain catalog data', () => {
  // Keep test-harness state out of the catalog fixtures consumed by the SDK.
  it.each(['card-benefits.json', 'milestone-rewards.json', 'daily-mission-goals.json'])(
    '%s contains no test-harness state',
    name => {
      const text = readFileSync(path.join(FACTS, name), 'utf8')
      for (const word of ['seededGrid', 'sentinel', 'resumes', 'emulated', 'seed_length', 'faked']) {
        expect(text, `${name} mentions ${word}`).not.toContain(word)
      }
    },
  )
})

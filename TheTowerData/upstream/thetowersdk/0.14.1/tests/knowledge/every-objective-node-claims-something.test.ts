import { describe, expect, it } from 'vitest'
import { GAME_KNOWLEDGE } from '../../src/knowledge'
import {
  CRITICAL_FACTOR_BASE,
  CRITICAL_FACTOR_MAX,
  DAMAGE_FORMULA,
  DEFENSE_PERCENT_HARD_CAP,
} from '../../src/knowledge/compartments/combat'
import { WORKSHOP_IMPORT_CATALOG } from '../../src/save/catalogs/indexes.data'
import { TOWER_HARD_CAPS } from '../../src/knowledge/compartments/tower'

/**
 * The whole graph, held to one rule: an objective node must claim something.
 *
 * On 2026-08-18 the graph was 290 nodes carrying 747 assertions, with 184 nodes
 * carrying none — most of it prose that `findContradictions` could never see and
 * that no wrong number could ever fail against. It is now 1473 assertions with
 * four bare nodes, and all four are `sentiment`.
 *
 * Sentiment nodes are bare ON PURPOSE and must stay that way: an opinion has no
 * fact to assert, and `coin-bonus-chain.test.ts` refuses assertions on
 * `economy.farmingAdvice` specifically. So this asserts the rule by claimType
 * rather than by a count, because a count would let a new objective node arrive
 * bare as long as an old one was filled in.
 */

const nodes = GAME_KNOWLEDGE.compartments.flatMap(c => c.nodes)

function workshopMaxLevel(name: string): number {
  return (WORKSHOP_IMPORT_CATALOG as readonly { name: string, maxLevel?: number }[])
    .find(entry => entry.name === name)?.maxLevel ?? -1
}

describe('every objective node claims something', () => {
  it('finds the whole graph, so the sweep cannot pass by looking at nothing', () => {
    expect(nodes.length).toBeGreaterThanOrEqual(280)
    expect(nodes.flatMap(n => n.assertions ?? []).length).toBeGreaterThanOrEqual(1400)
  })

  it('leaves no objective node without an assertion', () => {
    const bare = nodes
      .filter(n => (n.claimType ?? 'objective') !== 'sentiment')
      .filter(n => !(n.assertions?.length))
      .map(n => n.id)
    expect(bare, `objective nodes with nothing checkable:\n  ${bare.join('\n  ')}`).toEqual([])
  })

  /**
   * Sentiment nodes MAY assert — my first version of this test said they may
   * not, and six pre-existing nodes disproved it immediately.
   *
   * The real rule, enforced by knowledge.test.ts, is narrower: an opinion may
   * not carry an `implementedBy` or a `validRange`. It may carry facts ABOUT
   * the thing the opinion is about — `buildTarget.perma` asserts a weapon count
   * from the catalog — because a count is not an endorsement.
   *
   * The one node pinned bare is `economy.farmingAdvice`, by name, in
   * coin-bonus-chain.test.ts. That is a decision about that node, not a general
   * law, and I mistook it for one.
   */
  it('lets opinion assert facts but never an implementation', () => {
    const offenders = nodes
      .filter(n => n.claimType === 'sentiment')
      .filter(n => (n.implementedBy?.length ?? 0) > 0 || n.validRange != null)
      .map(n => n.id)
    expect(offenders, `opinion nodes naming an implementation:\n  ${offenders.join('\n  ')}`)
      .toEqual([])
    expect(nodes.filter(n => n.claimType === 'sentiment').length).toBeGreaterThan(0)
  })
})

describe('combat claims join to the shipped catalog', () => {
  /**
   * Combat was deliberately left until last: it is the compartment every
   * calculator reads, and it was wiki-only prose with nothing checkable. The
   * catalog join is what makes its numbers falsifiable.
   */
  const JOINED: Array<[string, string]> = [
    ['criticalChance', 'Critical Chance'],
    ['criticalFactor', 'Critical Factor'],
    ['defenseAbsolute', 'Defense Absolute'],
    ['healthRegen', 'Health Regen'],
    ['lifesteal', 'Lifesteal'],
  ]

  it.each(JOINED)('%s workshop levels match the catalog row for %s', (nodeId, catalogName) => {
    const claimed = nodes.find(n => n.id === nodeId)
      ?.assertions?.find(a => a.predicate === 'workshopLevels')?.value
    expect(claimed).toBe(workshopMaxLevel(catalogName))
    expect(claimed).toBeGreaterThan(0)
  })

  it('the critical factor ladder reaches its stated maximum', () => {
    const levels = workshopMaxLevel('Critical Factor')
    expect(CRITICAL_FACTOR_BASE + levels * 0.1).toBeCloseTo(CRITICAL_FACTOR_MAX, 9)
  })

  it('Berserker is added outside the damage product, not folded into it', () => {
    expect(DAMAGE_FORMULA.trim().endsWith('+ Berserker')).toBe(true)
  })

  it('agrees with the tower compartment on the defense cap', () => {
    expect(DEFENSE_PERCENT_HARD_CAP).toBe(TOWER_HARD_CAPS.defensePercent)
  })
})

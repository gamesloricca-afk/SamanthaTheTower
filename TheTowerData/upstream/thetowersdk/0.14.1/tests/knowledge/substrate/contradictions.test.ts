import { describe, expect, it } from 'vitest'
import { checkIncoming, findContradictions } from '../../../src/knowledge/substrate/contradictions'
import { scoreAll } from '../../../src/knowledge/substrate/maturity'
import type { Assertion, Compartment, KnowledgeGraph, Provenance } from '../../../src/knowledge/substrate/types'

/**
 * The substrate tested against fixtures, not against Tower content.
 *
 * Deliberate: a substrate whose tests depend on the repo's real claims cannot
 * be lifted into another repo without dragging them along, and its tests start
 * failing for reasons that have nothing to do with the substrate.
 */

const IN_GAME: Provenance = {
  origin: 'game',
  ref: 'tier screen',
  sourceVersion: 'v28.3',
  verifiedAt: '2026-08-16',
}

const CATALOG: Provenance = {
  origin: 'code',
  ref: 'src/data/tiers.ts',
  verifiedAt: '2026-01-01',
}

const WIKI: Provenance = {
  origin: 'wiki',
  ref: 'Tiers',
  verifiedAt: '2026-08-16',
}

function graphWith(assertions: readonly Assertion[]): KnowledgeGraph {
  const compartment: Compartment = {
    id: 'fixture',
    domain: 'test fixture',
    summary: 'A compartment that exists only to exercise the substrate.',
    nodes: [
      {
        id: 'fixture.node',
        label: 'Fixture',
        kind: 'stat',
        summary: 'A node carrying the assertions under test and nothing else.',
        assertions,
        sources: [IN_GAME],
      },
    ],
    edges: [],
  }
  return { version: 1, compartments: [compartment] }
}

describe('structural contradiction detection', () => {
  it('catches the defect this repo actually shipped', () => {
    /*
     * The real one: the catalog said tier 22 coin bonus was 75, the game says
     * 72. It survived for months because it was plausible, monotonic, and only
     * observable at tier 22+. No test pinned it because nobody thought to.
     *
     * This is the check that would have caught it without foresight.
     */
    const graph = graphWith([
      { subject: 'tier.22', predicate: 'coinBonus', value: 72, provenance: IN_GAME },
      { subject: 'tier.22', predicate: 'coinBonus', value: 75, provenance: CATALOG },
    ])

    const found = findContradictions(graph)
    expect(found).toHaveLength(1)
    expect(found[0].subject).toBe('tier.22')
    expect(found[0].crossSource).toBe(true)

    // In-game outranks code, so the game's value is surfaced as likely.
    expect(found[0].likelyValue).toBe(72)
    expect(found[0].claims[0].origin).toBe('game')
  })

  it('does not cry wolf over agreeing sources', () => {
    // A detector with false positives gets muted, and a muted detector is
    // worse than none — it provides the feeling of coverage without any.
    const graph = graphWith([
      { subject: 'tier.22', predicate: 'coinBonus', value: 72, provenance: IN_GAME },
      { subject: 'tier.22', predicate: 'coinBonus', value: 72, provenance: WIKI },
    ])

    expect(findContradictions(graph)).toHaveLength(0)
  })

  it('treats 72 and "72" as the same claim', () => {
    // The same value arriving from a JSON import and a TypeScript literal is
    // not a disagreement.
    const graph = graphWith([
      { subject: 'tier.22', predicate: 'coinBonus', value: 72, provenance: IN_GAME },
      { subject: 'tier.22', predicate: 'coinBonus', value: '72', provenance: WIKI },
    ])

    expect(findContradictions(graph)).toHaveLength(0)
  })

  it('keeps different predicates on the same subject apart', () => {
    const graph = graphWith([
      { subject: 'tier.22', predicate: 'coinBonus', value: 72, provenance: IN_GAME },
      { subject: 'tier.22', predicate: 'requiredWave', value: 300, provenance: WIKI },
    ])

    expect(findContradictions(graph)).toHaveLength(0)
  })
})

describe('the import gate', () => {
  const local = graphWith([
    { subject: 'tier.22', predicate: 'coinBonus', value: 72, provenance: IN_GAME },
  ])

  it('refuses to let a weaker external source overwrite local knowledge', () => {
    // The scenario that makes cross-repo sharing dangerous: another repo's
    // wrong value arriving with the authority of "the substrate says so".
    const result = checkIncoming(local, {
      subject: 'tier.22',
      predicate: 'coinBonus',
      value: 75,
      provenance: { origin: 'external-repo', ref: 'some-other-tower-tool', verifiedAt: '2026-08-01' },
    })

    expect(result.conflicts).toBe(true)
    expect(result.advice).toMatch(/do not replace local knowledge/i)
  })

  it('flags but still does not auto-apply a stronger external source', () => {
    // Local knowledge here comes only from the wiki, so a game-files claim
    // genuinely outranks it. (Nothing outranks `in-game` — it is the top of
    // ORIGIN_AUTHORITY, which is why the local fixture above cannot be beaten.)
    const wikiOnly = graphWith([
      { subject: 'tier.22', predicate: 'coinBonus', value: 72, provenance: WIKI },
    ])

    const result = checkIncoming(wikiOnly, {
      subject: 'tier.22',
      predicate: 'coinBonus',
      value: 75,
      provenance: { origin: 'game', ref: 'later release', sourceVersion: 'v29', verifiedAt: '2026-09-01' },
    })

    expect(result.conflicts).toBe(true)
    expect(result.advice).toMatch(/higher authority/i)
    // Even a better source does not get to write silently — a human decides.
    expect(result.advice).toMatch(/do not overwrite automatically/i)
  })

  it('tells you a novel claim is unverified rather than accepting it', () => {
    const result = checkIncoming(local, {
      subject: 'tier.99',
      predicate: 'coinBonus',
      value: 500,
      provenance: { origin: 'external-repo', ref: 'pack', verifiedAt: '2026-08-01' },
    })

    expect(result.conflicts).toBe(false)
    expect(result.advice).toMatch(/unverified/i)
  })
})

describe('compartment maturity', () => {
  it('reports zero traps as unexercised rather than clean', () => {
    const graph = graphWith([])
    const [maturity] = scoreAll(graph, '2026-08-16')

    expect(maturity.trapDensity).toBe(0)
    expect(maturity.nodeCount).toBe(1)
  })

  it('counts a claim stale once its newest source ages out', () => {
    const graph = graphWith([])
    const fresh = scoreAll(graph, '2026-08-17')
    const later = scoreAll(graph, '2028-08-17')

    expect(fresh[0].staleCount).toBe(0)
    expect(later[0].staleCount).toBe(1)
  })

  it('is deterministic for a given asOf', () => {
    // Metrics that move on their own cannot be diffed or asserted on.
    const graph = graphWith([])
    expect(scoreAll(graph, '2026-08-16')).toEqual(scoreAll(graph, '2026-08-16'))
  })
})

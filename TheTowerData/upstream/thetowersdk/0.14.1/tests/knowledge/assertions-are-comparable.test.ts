import { describe, expect, it } from 'vitest'
import { allNodes, findContradictions, GAME_KNOWLEDGE } from '../../src/knowledge'
import { findContradictions as findContradictionsIn } from '../../src/knowledge/substrate'
import type { KnowledgeGraph } from '../../src/knowledge/substrate/types'

/**
 * Assertions must be comparable, not merely present.
 *
 * ## Why this file exists
 *
 * `findContradictions` groups by `(subject, predicate)` and compares values. It
 * found its first real defect on 2026-08-18 — a heat index the game and our
 * catalog disagreed on — and in the same run it reported a second one that was
 * not a defect at all:
 *
 * ```
 * (cardMastery, unlockMilestone) = 'T16 W100'          [code]
 * (cardMastery, unlockMilestone) = 'Tier 16 Wave 100'  [wiki]
 * ```
 *
 * Same milestone. Two renderings of it, written into two compartments by two
 * sessions. A detector with one real finding cannot afford a false one — the
 * next person mutes it, and then the real finding goes with it.
 *
 * So the rule is: **an assertion value is a number, a boolean, or an
 * identifier — never a formatted sentence.** Prose belongs in `summary` and
 * `traps`, where nothing tries to compare it.
 */

/** Values that look like a rendered milestone rather than a comparable value. */
const MILESTONE_SHAPED = /^(?:t(?:ier)?\s*\d+)\s*(?:w(?:ave)?\s*\d+)?$/i

describe('assertion values stay machine-comparable', () => {
  it('reports no contradiction that is only a difference in formatting', () => {
    /*
     * The real check. Every surviving contradiction must be a genuine
     * disagreement about a value — so none of them may collapse to a single
     * value once whitespace, case and punctuation are removed.
     */
    const cosmetic = findContradictions(GAME_KNOWLEDGE).filter(contradiction => {
      const flattened = new Set(
        contradiction.claims.map(claim => String(claim.value).replace(/[\s\-_]/g, '').toLowerCase()),
      )
      return flattened.size < contradiction.claims.length
    })

    expect(
      cosmetic.map(c => `${c.subject}.${c.predicate}: ${c.claims.map(x => x.value).join(' vs ')}`),
      'these disagree only in how the value is written',
    ).toEqual([])
  })

  it('keeps milestone gates as numbers, so they cannot be written two ways', () => {
    /*
     * Planted-fault equivalent: reintroducing `value: 'T16 W100'` anywhere makes
     * this fail. That is the specific form that caused the false positive, and
     * a number has no second rendering.
     */
    const offenders: string[] = []
    for (const node of allNodes(GAME_KNOWLEDGE)) {
      for (const assertion of node.assertions ?? []) {
        if (typeof assertion.value === 'string' && MILESTONE_SHAPED.test(assertion.value.trim())) {
          offenders.push(`${node.id} -> ${assertion.subject}.${assertion.predicate} = ${assertion.value}`)
        }
      }
    }

    expect(offenders, 'assert unlockTier and unlockWave as numbers instead').toEqual([])
  })

  it('carries only REAL disagreements, and reports them', () => {
    /*
     * This asserted zero until 2026-08-18, when a genuine one arrived: the game
     * puts the eighth sub-module slot at level 241 and a trusted community guide
     * says 242. That is exactly what the machinery is for, so the check is not
     * "no contradictions" — it is "every contradiction is a real one".
     *
     * Real means: the values differ after normalisation, and the disagreement
     * spans different sources. A same-source disagreement is a bug in our own
     * data rather than a conflict between sources, and would be worth failing
     * on.
     */
    const found = findContradictions()
    for (const contradiction of found) {
      expect(contradiction.claims.length).toBeGreaterThan(1)
      expect(new Set(contradiction.claims.map(c => c.value)).size)
        .toBe(contradiction.claims.length)
      expect(
        contradiction.crossSource,
        `${contradiction.subject}.${contradiction.predicate} disagrees with ITSELF, not with another source`,
      ).toBe(true)
    }
  })

  it('reports the versioned model and community guide disagreement without claiming observation', () => {
    /*
     * The live conflict remains visible while its SDK value is identified as a
     * versioned model rather than an independent in-game observation. If the guide is ever
     * corrected upstream and the assertion removed, this fails and someone
     * confirms the removal was deliberate rather than a tidy-up.
     */
    const slotEight = findContradictions()
      .find(c => c.predicate === 'opensAtLevel')
    expect(slotEight, 'the 241-vs-242 sub-module slot conflict has vanished').toBeDefined()
    expect(slotEight!.likelyValue).toBe(241)
    expect(slotEight!.claims[0].origin).toBe('code')
  })

  it('still fires on a planted conflict, so silence would be meaningful', () => {
    const planted: KnowledgeGraph = {
      version: GAME_KNOWLEDGE.version,
      compartments: [{
        id: 'planted', domain: 'positive control', summary: 'Proves contradiction detection.',
        nodes: [{
          id: 'planted.node', label: 'Planted', kind: 'rule',
          summary: 'Carries two conflicting independent fixture claims.',
          assertions: [{
            subject: 'planted.node', predicate: 'fixtureValue', value: 22,
            provenance: { origin: 'game', ref: 'planted game fixture', verifiedAt: '2026-10-15' },
          }, {
            subject: 'planted.node', predicate: 'fixtureValue', value: 27,
            provenance: { origin: 'wiki', ref: 'planted wiki fixture', verifiedAt: '2026-10-15' },
          }],
          sources: [{ origin: 'game', ref: 'planted game fixture', verifiedAt: '2026-10-15' }],
        }],
        edges: [],
      }],
    }
    const found = findContradictionsIn(planted).find(conflict => conflict.predicate === 'fixtureValue')
    expect(found).toBeDefined()
    expect(found!.likelyValue).toBe(22)
    expect(found!.crossSource).toBe(true)
  })
})

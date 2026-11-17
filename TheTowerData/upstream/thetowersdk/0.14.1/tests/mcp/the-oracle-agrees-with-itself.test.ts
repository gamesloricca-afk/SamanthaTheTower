import { describe, expect, it } from 'vitest'
// @ts-expect-error — the MCP server is plain ESM JavaScript with no declarations.
import { TOWER_ORACLE_TOOLS } from '../../mcp/server.mjs'

/**
 * Two oracle tools describing the same graph must not disagree about what is in it.
 *
 * `oracle_coverage` lists compartments — `bots`, `modules`, `cards` — with a node count each, and
 * `oracle_map` is the tool you would naturally call next to see one. It filtered by entity id
 * PREFIX, and the ids inside those compartments are `bot.`, `module.` and `card.`. So the obvious
 * second call returned an empty graph for **17 of 29 compartments**, and a fraction of itself for
 * five more: `attack` gave 1 node of 7, because `multishot` and `rapidFire` do not start with
 * "attack".
 *
 * Nothing failed, and nothing could have. `{ counts: { nodes: 0, edges: 0 } }` is a well-formed
 * answer, indistinguishable from a family that genuinely holds nothing — the trap this very graph
 * documents about spreadsheets ("an empty result and a mistyped tab name are indistinguishable"),
 * reproduced in the tool that serves the graph.
 *
 * The check is a cross-reference rather than a restatement: every compartment `oracle_coverage`
 * reports must be retrievable from `oracle_map`, at the size `oracle_coverage` claims. Neither
 * side's number is written down here, so the test cannot drift with them — it can only catch them
 * disagreeing.
 */

type Coverage = { compartments: { id: string, nodeCount: number }[] }
type Map = {
  counts?: { nodes: number, edges: number }
  matchedAs?: string
  found?: boolean
  didYouMean?: string[]
  compartments?: string[]
}

const coverage = () =>
  TOWER_ORACLE_TOOLS.oracle_coverage.run({ asOf: '2026-08-20' }) as Coverage

const map = (args: Record<string, unknown>) =>
  TOWER_ORACLE_TOOLS.oracle_map.run(args) as Map

describe('oracle_map and oracle_coverage describe the same graph', () => {
  it('has compartments to check', () => {
    expect(coverage().compartments.length).toBeGreaterThan(20)
  })

  it('returns every compartment, at the size coverage reports', () => {
    const disagreements: string[] = []

    for (const { id, nodeCount } of coverage().compartments) {
      const result = map({ family: id })
      const got = result.counts?.nodes ?? 0

      if (got !== nodeCount) disagreements.push(`${id}: coverage ${nodeCount}, map ${got}`)
    }

    expect(disagreements, 'a compartment you cannot retrieve is a compartment that does not exist')
      .toEqual([])
  })

  it('still accepts an entity id prefix, and says which reading answered', () => {
    /*
     * The original behaviour is not replaced, it is joined. `module` is a prefix over several
     * compartments and must keep working; `modules` is a compartment and must now work too. If
     * both resolved the same way, one of the two audiences would have been broken to fix the other.
     */
    const byPrefix = map({ family: 'module' })
    const byCompartment = map({ family: 'modules' })

    expect(byPrefix.matchedAs).toBe('idPrefix')
    expect(byCompartment.matchedAs).toBe('compartment')
    expect(byPrefix.counts!.nodes).toBeGreaterThan(0)
    expect(byCompartment.counts!.nodes).toBeGreaterThan(0)
  })

  it('refuses a name it cannot resolve instead of returning an empty graph', () => {
    const missing = map({ family: 'definitely-not-a-family' })

    expect(missing.found).toBe(false)
    expect(missing.counts).toBeUndefined()
    expect(missing.compartments!.length).toBeGreaterThan(20)
  })

  it('suggests the name someone meant to type', () => {
    /*
     * A single dropped letter is the ordinary typo. Substring matching alone offered nothing for
     * "moduls", because `'modules'.includes('moduls')` is false — a suggestion list that cannot
     * survive one missing character is decoration.
     */
    const typo = map({ family: 'moduls' })

    expect(typo.found).toBe(false)
    expect(typo.didYouMean).toContain('modules')
    expect(typo.didYouMean).toContain('module')
  })

  it('offers nothing rather than nonsense for a name that resembles none of them', () => {
    /*
     * The other half of a suggestion list: it has to be able to say "no idea". Ranking every
     * candidate and taking the top few always produces an answer, and a confident wrong suggestion
     * is worse than an empty list.
     */
    expect(map({ family: 'zzzzzzzzzz' }).didYouMean).toEqual([])
  })
})

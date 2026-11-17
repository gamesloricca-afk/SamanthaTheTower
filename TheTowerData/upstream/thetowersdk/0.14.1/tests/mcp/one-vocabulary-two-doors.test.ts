import { describe, expect, it } from 'vitest'
// @ts-expect-error — the MCP server is plain ESM JavaScript with no declarations.
import { TOOLS, TOWER_ORACLE_TOOLS } from '../../mcp/server.mjs'
// @ts-expect-error — the knowledge build is emitted JavaScript.
import { GAME_KNOWLEDGE } from '../../dist/knowledge/index.js'

/**
 * Two tools answer "what does this acronym mean", and they must not disagree.
 *
 * `define_term` reads the generated glossary, which is built from the shipped catalogs — so it
 * knows the names of things that exist as catalog rows. The knowledge graph separately asserts
 * `shorthand` on entities, which covers community usage the catalogs never name.
 *
 * The graph asserted 58; the glossary resolved 50. The eight it missed — `dpm+`, `as#`, `hr#`,
 * `rng#`, `fu#`, `ccoin#`, `uc#`, `nuke#` — came back as "not in the glossary — do not invent an
 * expansion".
 *
 * That dead end is worse than a plain miss. `define_term`'s own note and the oracle's instructions
 * both forbid expanding an acronym from memory, so an agent that follows the rules is left
 * correctly stuck while another tool in the same server has the answer with provenance. Being
 * honest about not knowing is right; not saying who does is the gap.
 *
 * `define_term` now defers to the graph, and reports `source` so a caller can tell which authority
 * answered. This holds them level.
 */

interface Assertion { predicate: string, value: unknown }
interface Node { assertions?: Assertion[] }
interface Compartment { nodes: Node[] }

/** Every shorthand the graph asserts. Read from the graph, so it cannot go stale against it. */
const shorthands = [...new Set(
  (GAME_KNOWLEDGE as { compartments: Compartment[] }).compartments
    .flatMap(compartment => compartment.nodes)
    .flatMap(node => node.assertions ?? [])
    .filter(assertion => assertion.predicate === 'shorthand')
    .map(assertion => assertion.value)
    .filter((value): value is string => typeof value === 'string'),
)]

describe('the two vocabulary doors agree', () => {
  it('has shorthands to check', () => {
    expect(shorthands.length).toBeGreaterThan(40)
  })

  it('resolves through define_term everything the oracle can expand', () => {
    const stuck: string[] = []

    for (const term of shorthands) {
      const expanded = TOWER_ORACLE_TOOLS.oracle_expand.run({ term })
      if ((expanded.expansions ?? []).length === 0) continue

      const defined = TOOLS.define_term.run({ term })
      if (!defined.found) stuck.push(term)
    }

    expect(stuck, 'the oracle knows these and define_term sends the caller away empty')
      .toEqual([])
  })

  it('says which authority answered', () => {
    /*
     * Not decoration. A glossary hit is a catalog row; a graph hit is a community term with
     * provenance and traps behind it. A caller deciding whether to write the name into UI copy
     * wants to know which of those they have.
     */
    const fromGraph = TOOLS.define_term.run({ term: 'dpm+' })
    expect(fromGraph.found).toBe(true)
    expect(fromGraph.source).toBe('knowledge-graph')
    expect(fromGraph.meanings[0].entityId).toBeDefined()

    const fromGlossary = TOOLS.define_term.run({ term: 'ILM' })
    expect(fromGlossary.found).toBe(true)
    expect(fromGlossary.source).toBe('glossary')
  })

  it('refuses a misspelling, however close', () => {
    /*
     * The regression the first version of this fallback caused, kept as a case.
     *
     * Deferring to `oracle_expand` — a FUZZY resolver — made `define_term('Chronofield')` resolve
     * to Chrono Field. This tool is consulted "before writing a name into docs or UI copy", where
     * accepting a near-miss is the entire failure mode, and an existing naming-authority test
     * caught it within one run.
     *
     * The fallback now reads `shorthand` assertions directly: a closed set with provenance, rather
     * than whatever the resolver found nearby.
     */
    const misspelled = TOOLS.define_term.run({ term: 'Chronofield' })

    expect(misspelled.found, 'a misspelling must not resolve').toBe(false)
    expect(TOOLS.define_term.run({ term: 'Chrono Field' }).found).toBe(true)
  })

  it('accepts the casing the community actually writes', () => {
    /* `dpm+` and `DPM+` are the same acronym. Case folding is safe while no two collide. */
    expect(TOOLS.define_term.run({ term: 'DPM+' }).found).toBe(true)
  })

  it('still refuses a term neither authority knows', () => {
    /*
     * The half a fallback can break. If deferring made everything resolve, the tool would have
     * stopped being able to say "I do not know", which is the only thing standing between an agent
     * and an invented expansion.
     */
    const unknown = TOOLS.define_term.run({ term: 'zzz#' })

    expect(unknown.found).toBe(false)
    expect(unknown.note).toMatch(/do not invent/)
  })

  it('keeps the graph as the wider authority, not a replacement', () => {
    /*
     * If the glossary ever covered everything the graph does, the fallback would be dead code and
     * this test would be measuring nothing. Recording the relationship makes that visible.
     */
    const glossaryOnly = shorthands.filter((term) => {
      const defined = TOOLS.define_term.run({ term })
      return defined.found && defined.source === 'glossary'
    })

    expect(glossaryOnly.length).toBeGreaterThan(0)
    expect(glossaryOnly.length).toBeLessThan(shorthands.length)
  })
})

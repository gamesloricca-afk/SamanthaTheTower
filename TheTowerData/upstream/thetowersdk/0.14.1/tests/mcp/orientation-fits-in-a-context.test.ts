import { describe, expect, it } from 'vitest'
// @ts-expect-error — the MCP server is plain ESM JavaScript with no declarations.
import { TOOLS, TOWER_ORACLE_TOOLS } from '../../mcp/server.mjs'
import { toolsCallableWithNoArguments } from '../helpers/every-tool'

/**
 * A tool called with no arguments must return something a caller can afford to read.
 *
 * Four tools returned half a megabyte or more from `run({})`, and the protocol dispatcher passes
 * `args ?? {}` — so that is not a hypothetical call, it is the simplest one a client can make.
 *
 * The two that mattered were the two the server actively recommends:
 *
 * - `calc_list` returned all 1,988 declared calculators, 604 KB. Its own description says "call
 *   this before writing any game maths", and `calc_describe`'s error hint points at it. An agent
 *   following the instruction as written spent most of a context window on the answer.
 * - `oracle_map` returned all 321 nodes with every trap and assertion body, 804 KB, from a tool
 *   described as being "for orientation before a large piece of work". 804 KB of prose is the
 *   opposite of being oriented.
 *
 * Neither was a bug in the usual sense. Both returned correct, well-formed, complete data. The
 * only thing wrong was the amount, and nothing anywhere measured the amount — the same blind spot
 * that let `get_export` return 220 of 225 rows for `limit: -5`.
 *
 * So this measures bytes, on the call a client makes by default.
 */

/*
 * From the canonical registry, which knows all three servers and which tools leave the process.
 *
 * The hand-written exclusion list this replaced was the second time an audit here quietly covered
 * a subset: it named eighteen tools to skip and had no idea the epaths registry existed.
 */
const NO_ARGUMENT_TOOLS = toolsCallableWithNoArguments()

/** What an agent should be able to spend on a single orientation call. */
const BUDGET = 200_000

/**
 * Tools allowed past the budget, each with the reason.
 *
 * Empty, and kept rather than deleted: the moment one is added it should have to carry a sentence
 * saying why. `sdk_graph_get` and `sdk_debug_snapshot` are both over budget and were briefly listed
 * here, but they are excluded below for a stronger reason — they leave the process — so an
 * allowance would have been the wrong reason recorded for the right outcome.
 */
const ALLOWED_LARGE = new Map<string, string>([])

describe('orientation fits in a context window', () => {
  it('has tools to check', () => {
    expect(NO_ARGUMENT_TOOLS.length).toBeGreaterThan(5)
  })

  it('keeps every no-argument response under the budget', async () => {
    const oversized: string[] = []
    const unmeasured: string[] = []

    for (const tool of NO_ARGUMENT_TOOLS) {
      const name = tool.name
      if (ALLOWED_LARGE.has(name)) continue

      let bytes = 0
      try {
        bytes = JSON.stringify(await tool.run({}))?.length ?? 0
      }
      catch (error) {
        unmeasured.push(`${name}: ${String((error as Error).message).split('\n')[0]}`)
        continue
      }

      if (bytes > BUDGET) oversized.push(`${name}: ${bytes.toLocaleString()} bytes`)
    }

    /*
     * A tool that throws is not "a different suite's problem" as far as this one is concerned.
     *
     * It used to `continue` on that reasoning, which is true about whose job the fix is and wrong
     * about the consequence: an unmeasured tool cannot be over budget, so every tool throwing
     * leaves `oversized` empty and this passing. The suite would report that orientation fits in a
     * context window precisely because nothing could be weighed.
     *
     * The registry already excludes the tools that leave the process, so what remains is callable
     * with no arguments by definition, and none of them throws today. If one starts to, that is
     * worth a failure here on its own account: the protocol dispatcher passes `args ?? {}`, so
     * every client can make this call.
     */
    expect(unmeasured, 'could not be weighed, so the budget below proves nothing about them')
      .toEqual([])

    expect(oversized, `over ${BUDGET.toLocaleString()} bytes from a call with no arguments`)
      .toEqual([])
  }, 300_000)

  it('still reports the true size of what it truncated', () => {
    /*
     * The half that makes truncation safe. A caller who is shown 60 of 1,988 must be told it was
     * 1,988 — otherwise a bounded answer becomes a wrong one, which is worse than a big one.
     */
    const listed = TOOLS.calc_list.run({})

    expect(listed.total).toBeGreaterThan(1_000)
    expect(listed.matched).toBe(listed.total)
    expect(listed.shown).toBeLessThan(listed.matched)
    expect(listed.truncated).toBe(true)
    expect(listed.hint).toMatch(/more match/)
  })

  it('leaves nothing out of the graph outline', () => {
    /*
     * `oracle_map` promises "every entity and typed relationship". Holding back the claim BODIES is
     * a summary; dropping nodes would be a different tool. The counts must match the full version.
     */
    const outline = TOWER_ORACLE_TOOLS.oracle_map.run({})
    const full = TOWER_ORACLE_TOOLS.oracle_map.run({ detail: true })

    expect(outline.counts).toEqual(full.counts)
    expect(outline.nodes.length).toBe(full.nodes.length)
    expect(outline.edges.length).toBe(full.edges.length)
    expect(outline.detail).toBe(false)
    expect(outline.hint).toMatch(/detail/)

    /* And the detail is genuinely still reachable, or the flag would be decoration. */
    expect(JSON.stringify(full).length).toBeGreaterThan(JSON.stringify(outline).length * 3)
  })
})

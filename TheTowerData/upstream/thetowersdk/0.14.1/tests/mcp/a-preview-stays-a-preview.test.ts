import { describe, expect, it } from 'vitest'
// @ts-expect-error — the MCP server is plain ESM JavaScript with no declarations.
import { TOOLS } from '../../mcp/server.mjs'

/**
 * A tool that promises a sample must not be talked into returning the table.
 *
 * `get_export` exists so an agent can ask "what shape is this" without spending a context window,
 * and its own comment said "never return one whole by accident". It sliced with the caller's number
 * directly — and `slice(0, -5)` means "all but the last five". Asking for **-5** entries of
 * `LAB_CATALOG` returned 220 of 225 rows, 695 KB, from a request that reads like the smallest one
 * you could make.
 *
 * `wiki_search` had the same shape by a different route: `Math.min(Number(limit) || 12, 25)` clamps
 * the top and passes negatives straight through, so asking for -3 titles returned a SHORTER list
 * than asking for 10, with nothing to say results had been dropped.
 *
 * Neither failed anything. Both returned a well-formed object with plausible contents; the only
 * symptom was size, and nothing measures size.
 *
 * So these assert on the numbers a caller can actually be hurt by, with the hostile inputs that
 * reach a tool schema declaring nothing more than `type: 'number'`.
 */

/** Everything a JSON-RPC client can put in a field typed `number`, plus the values that aren't. */
const HOSTILE = [-5, -1, 0, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 1e9, 3.7]

describe('get_export never returns the whole table', () => {
  it('has a table big enough for this to matter', () => {
    const whole = TOOLS.get_export.run({ name: 'LAB_CATALOG' })
    expect(whole.kind).toBe('array')
    expect(whole.length).toBeGreaterThan(200)
  })

  it('caps the sample however it is asked', () => {
    const { length } = TOOLS.get_export.run({ name: 'LAB_CATALOG' })

    for (const limit of HOSTILE) {
      const result = TOOLS.get_export.run({ name: 'LAB_CATALOG', limit })

      expect(result.sample.length, `limit ${limit} returned ${result.sample.length} rows`)
        .toBeLessThanOrEqual(100)
      expect(result.sample.length, `limit ${limit} returned a negative-slice tail`)
        .toBeLessThan(length)
      expect(result.length, `limit ${limit} must still report the true size`).toBe(length)
    }
  })

  it('says when it truncated, rather than looking complete', () => {
    /*
     * The tell that would have caught the original: a caller had no way to know 220 of 225 rows was
     * a truncation at all, because nothing in the response distinguished a sample from the whole.
     */
    const sampled = TOOLS.get_export.run({ name: 'LAB_CATALOG', limit: 3 })
    expect(sampled.truncated).toBe(true)
    expect(sampled.sample.length).toBe(3)
  })

  it('never spends more than a bounded amount of context', () => {
    /*
     * Size is the thing that actually hurt, so size is what this measures.
     *
     * The threshold has to sit comfortably between the two behaviours or it proves nothing. The
     * first version allowed 400,000 against a 200-row cap — and PASSED with the fault planted,
     * because the broken path returned 220 rows at ~359,000. The cap is now 100 rows (~163,000),
     * which leaves real daylight either side.
     */
    const worst = Math.max(...HOSTILE.map(limit =>
      JSON.stringify(TOOLS.get_export.run({ name: 'LAB_CATALOG', limit })).length))

    expect(worst, 'a preview should not be able to reach six figures of characters')
      .toBeLessThan(250_000)
  })
})

describe('wiki_search honours its own ceiling', () => {
  it('clamps instead of slicing from the end', async () => {
    const asked = await TOOLS.wiki_search.run({ query: 'thorns', limit: 10 })
    const negative = await TOOLS.wiki_search.run({ query: 'thorns', limit: -3 })

    /*
     * The original returned FEWER results for -3 than for 10 — a negative limit quietly eating the
     * tail. Whatever the clamp resolves to, it must not be a silent truncation of a real answer.
     */
    expect(negative.results.length).toBeGreaterThanOrEqual(asked.results.length)
  }, 60_000)

  it('does not exceed 25 however large the ask', async () => {
    const huge = await TOOLS.wiki_search.run({ query: 'thorns', limit: 1e9 })
    expect(huge.results.length).toBeLessThanOrEqual(25)
  }, 60_000)
})

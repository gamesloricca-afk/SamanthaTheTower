import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — the MCP server is plain ESM JavaScript with no declarations.
import { TOOLS } from '../../mcp/server.mjs'
import { IN_MONOREPO, everyTool, loadedRegistries } from '../helpers/every-tool'

/**
 * No tool may answer for a key that only exists on `Object.prototype`.
 *
 * Every string a tool receives is an untrusted key: it came from a model, and a model guesses
 * names. Plain member access walks the prototype chain, so `record['constructor']` is the `Object`
 * function and `record['toString']` is a function too — and `typeof fn !== 'function'` does not
 * reject either, which is exactly the guard `run_extractor` was relying on.
 *
 * What that cost, before this:
 *
 * - `run_extractor({ extractor: 'constructor' })` passed the function check, called
 *   `Object(parsedRoot)`, and returned the entire 741-key save root as that extractor's output.
 * - `get_export({ name: 'toString' })` reported `toString` as an export of `thetowersdk/data`,
 *   kind `function`. `AGENTS.md` opens with "find the export; do not invent one" — and the tool
 *   whose job is preventing invented names was confirming them.
 * - `valueOf` and `hasOwnProperty` threw raw TypeErrors out of the tool layer.
 *
 * The package already ships `hasOwnKey` for this, and its docblock describes this precise trap.
 * Thirty-three files use it. The tool surface did not, which is why this sweeps every tool rather
 * than the two that were caught: the next one will be written by someone who also did not know.
 */

/*
 * The canonical registry, not a spread assembled here.
 *
 * This file first read `TOOLS` alone and reported "oracle_get is not registered" instead of testing
 * it. Fixing that by spreading in the oracle tools still left the epaths registry out — and that is
 * where the last instance of this bug was hiding, in a server whose own compartment documents the
 * trap. Two rounds of the same mistake is enough to stop assembling the list by hand.
 */
const EVERY_TOOL = everyTool()

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REAL_SAVE = path.resolve(HERE, '..', '..', '..', 'test', 'playerInfo.dat')

/** Names that exist on every object and belong to no API. */
const PROTOTYPE_KEYS = [
  'constructor',
  'toString',
  'valueOf',
  'hasOwnProperty',
  '__proto__',
  'propertyIsEnumerable',
  'isPrototypeOf',
  'toLocaleString',
]

/**
 * Every tool that resolves a caller-supplied name, the field it uses, and what refusal looks like.
 *
 * The two families answer differently on purpose and both are right. A registry lookup either has
 * the handle or does not, so it returns `{ error }`. The oracle is a free-text resolver: it is
 * SUPPOSED to find near matches, and it reports `matchedExactly` so a caller can tell a real hit
 * from a fuzzy one.
 *
 * That distinction is not pedantry — `oracle_traps('constructor')` legitimately resolves to
 * `sheets.rangeNaming`, because the word appears inside a trap warning about untrusted keys
 * resolving to `Object.prototype` members. The oracle answering a prototype probe with the trap
 * about prototype probes is the system working. What would be wrong is claiming an EXACT match.
 */
const refusedByError = (result: Record<string, unknown>) => Boolean(result.error)

const refusedByResolver = (result: Record<string, unknown>) =>
  result.found === false || result.matchedExactly === false

const NAME_TAKING = [
  { tool: 'get_export', field: 'name', extra: {}, refused: refusedByError, maxBody: 500 },
  { tool: 'run_extractor', field: 'extractor', extra: { path: REAL_SAVE }, refused: refusedByError, maxBody: 500 },
  { tool: 'calc_run', field: 'id', extra: { args: {} }, refused: refusedByError, maxBody: 500 },
  { tool: 'calc_describe', field: 'id', extra: {}, refused: refusedByError, maxBody: 1_000 },
  { tool: 'oracle_get', field: 'id', extra: {}, refused: refusedByResolver, maxBody: 20_000 },
  { tool: 'oracle_traps', field: 'id', extra: {}, refused: refusedByResolver, maxBody: 20_000 },

  /*
   * The epaths tab lookups. These reach the Sheets API for a real tab, but a prototype key must be
   * refused BEFORE that — which is the point. `TAB_UI['constructor']` is the `Object` function, and
   * `preset ? … : null` took the truthy branch, so the `knownTabs` error never ran and the tool
   * spent a live API call building `'constructor'!undefined`. Refused locally, these cost nothing.
   */
  { tool: 'read_path_display', field: 'tab', extra: {}, refused: refusedByError, maxBody: 500 },
  { tool: 'inspect_tab_ui', field: 'tab', extra: {}, refused: refusedByError, maxBody: 500 },
]

describe('a prototype member is never mistaken for an entry', () => {
  for (const { tool, field, extra, refused, maxBody } of NAME_TAKING) {
    it(`${tool} refuses them`, async () => {
      const run = EVERY_TOOL[tool]

      /*
       * `read_path_display` and `inspect_tab_ui` belong to the Effective Paths server, which is
       * not part of the published package. Absent there is correct; absent HERE is the silent
       * shrink this sweep exists to catch, and `an-audit-covers-every-registry` fails on it.
       */
      if (!run && !IN_MONOREPO) {
        expect(loadedRegistries()).not.toContain('epaths')
        return
      }
      expect(run, `${tool} is not registered`).toBeDefined()

      for (const key of PROTOTYPE_KEYS) {
        let result: unknown
        try {
          result = await run.run({ [field]: key, ...extra })
        }
        catch (error) {
          /*
           * Throwing is its own failure. A tool that raises a TypeError out of the protocol layer
           * has told the caller nothing they can act on, and `valueOf` did exactly that.
           */
          expect.unreachable(`${tool}(${field}: ${key}) threw: ${(error as Error).message}`)
        }

        const body = JSON.stringify(result)

        /*
         * The assertion is on the SHAPE of the answer, not its size. `constructor` returning the
         * whole save root was a well-formed success object — the only thing wrong with it was that
         * it was an answer at all.
         */
        expect(
          refused(result as Record<string, unknown>),
          `${tool}(${field}: ${key}) treated a prototype member as a real entry`,
        ).toBe(true)
        expect(body.length, `${tool}(${field}: ${key}) returned a large body`).toBeLessThan(maxBody)
      }
    }, 60_000)
  }

  it('still answers for names that are real', async () => {
    /*
     * The other half. A refusal that also refuses real input is not a fix, and an over-broad
     * blocklist would pass every case above while breaking the tools entirely.
     */
    const exported = TOOLS.get_export.run({ name: 'LAB_CATALOG', limit: 1 })
    expect(exported.error).toBeUndefined()
    expect(exported.length).toBeGreaterThan(200)

    const described = TOOLS.calc_describe.run({ id: 'lab.maxLevel' })
    expect(described.error).toBeUndefined()
  })
})

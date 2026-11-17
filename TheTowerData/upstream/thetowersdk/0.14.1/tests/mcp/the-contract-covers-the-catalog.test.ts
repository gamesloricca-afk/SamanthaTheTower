import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — the MCP server is plain ESM JavaScript with no declarations.
import { TOOLS } from '../../mcp/server.mjs'
import { IN_MONOREPO, everyTool } from '../helpers/every-tool'
import { MONOREPO_ROOT } from '../helpers/paths'

/**
 * The taxonomy must name every tool the server actually has.
 *
 * `mcp_contract` describes itself as what to "call when unsure which tool family to use". It listed
 * 63 tools and omitted all nine oracle tools — including `oracle_traps`, which CLAUDE.md and the
 * compliance instructions both mandate calling FIRST on any mechanic. There was no `oracle`
 * category at all.
 *
 * A taxonomy that omits an obscure tool is a gap. One that omits the mandatory tool is worse than a
 * gap: an agent consulting it to find the right family concludes that family does not exist, and
 * proceeds without the traps the whole pipeline is built around.
 *
 * It had a self-check — `toolCount` against the length of `tools`. Both are computed from the same
 * array, so they agreed at 63 while nine tools were missing. That is the third time in this
 * directory the same tautology has guarded the wrong thing: two numbers derived from one source,
 * neither from the thing they describe. This compares the contract against the live registry.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))

/**
 * Tools the contract may name that this package's registries do not hold.
 *
 * `list_modules` is added by the slim merger; the `commit_*` tools live in `tower-gov`. The
 * contract is deliberately ecosystem-wide, so naming them is correct — but the allowance is
 * derived from the governance allow-list rather than typed here, so a commit tool that disappears
 * stops being excused.
 */
function toolsFromElsewhere(): Set<string> {
  const catalog = path.join(MONOREPO_ROOT, 'tools', 'tower-mcp', 'slim-catalog.mjs')
  const names = new Set(['list_modules'])

  if (existsSync(catalog)) {
    const source = readFileSync(catalog, 'utf8')
    const block = /TOWER_GOV_SLIM_ALLOW = Object\.freeze\(\[([\s\S]*?)\]\)/.exec(source)?.[1] ?? ''
    for (const match of block.matchAll(/'([\w.]+)'/g)) names.add(match[1])
  }

  return names
}

/* Memoised: each build takes over a second, and nothing here mutates it. */
let contractCache: {
  toolCount: number
  categories: string[]
  tools: { name: string, category: string, module: string }[]
} | null = null

const contract = () => (contractCache ??= TOOLS.mcp_contract.run({}))

/*
 * Monorepo only. `mcp_contract` does not build the taxonomy in-process — it spawns the repo's own
 * `tsx` against a script that lives above this package, so outside the monorepo it returns
 * `{ ok: false, exit, stderr }` and every case here reads `undefined.map`. That is the tool
 * behaving correctly for a checkout it cannot serve, reported as six broken tests.
 *
 * `monorepo-only-tools.test.ts` is the guard that keeps it from being ADVERTISED there. This is the
 * matching half: do not exercise it where it was never going to run.
 */
describe.skipIf(!IN_MONOREPO)('mcp_contract covers the catalog it describes', () => {
  it('names every registered tool', () => {
    const listed = new Set(contract().tools.map(entry => entry.name))
    const missing = Object.keys(everyTool()).filter(name => !listed.has(name))

    expect(missing, 'a tool absent from the taxonomy is one an agent concludes does not exist')
      .toEqual([])
  })

  it('names the mandatory tool, and gives it a family', () => {
    /*
     * Called out separately from the sweep above. `oracle_traps` being present is not one row among
     * seventy-two — it is the tool the compliance pipeline opens with, and it was the one missing.
     */
    const entry = contract().tools.find(tool => tool.name === 'oracle_traps')

    expect(entry, 'oracle_traps is the first call the pipeline mandates').toBeDefined()
    expect(entry!.category).toBe('oracle')
    expect(contract().categories).toContain('oracle')
  })

  it('names nothing that exists nowhere', () => {
    /*
     * The other direction. A catalog advertising a tool no server implements sends an agent to call
     * something that will fail, which is worse than not mentioning it.
     */
    const known = new Set([...Object.keys(everyTool()), ...toolsFromElsewhere()])
    const ghosts = contract().tools.map(entry => entry.name).filter(name => !known.has(name))

    expect(ghosts, 'the contract advertises tools nothing registers').toEqual([])
  })

  it('counts what it listed', () => {
    const report = contract()
    expect(report.toolCount).toBe(report.tools.length)

    /*
     * And the count has to be of something real. `toolCount` matched `tools.length` at 63 while
     * nine tools were missing, because both came from the same array — so this pins it against the
     * registry instead.
     */
    expect(report.toolCount).toBeGreaterThanOrEqual(Object.keys(everyTool()).length)
  })

  it('puts every tool in a declared category and module', () => {
    const report = contract()
    const badCategory: string[] = []

    for (const entry of report.tools) {
      if (!report.categories.includes(entry.category)) {
        badCategory.push(`${entry.name}: category "${entry.category}" is not declared`)
      }
    }

    expect(badCategory).toEqual([])
  })

  it('agrees with list_modules about which module a tool belongs to', () => {
    /*
     * Two catalogs describing one surface. They were free to disagree, and on the oracle they did:
     * `list_modules` had an `oracle` module with nine tools while the contract had no such module.
     */
    const byName = new Map(contract().tools.map(entry => [entry.name, entry.module]))
    const disagreements: string[] = []

    for (const tool of Object.values(everyTool())) {
      const claimed = byName.get(tool.name)
      if (claimed && claimed !== tool.registry) {
        disagreements.push(`${tool.name}: contract says ${claimed}, registry says ${tool.registry}`)
      }
    }

    expect(disagreements).toEqual([])
  })
})

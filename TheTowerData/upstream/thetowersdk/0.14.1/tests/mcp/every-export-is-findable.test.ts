import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — the MCP server is plain ESM JavaScript with no declarations.
import { TOOLS, TOWER_ORACLE_TOOLS } from '../../mcp/server.mjs'
import { PACKAGE_ROOT } from '../helpers/paths'

/**
 * If a tool says "call this export, do not reimplement it", the export has to be findable.
 *
 * `AGENTS.md` rule 8 is "never invent export names — list_exports / get_export", and
 * `oracle_brief` introduces `implementedBy` as "the SDK exports that already implement it (call
 * these — do not reimplement)". Both instructions point at the same two tools.
 *
 * Those tools searched six entry points. The package publishes thirteen. So an agent doing exactly
 * what it was told found that `MODULE_CURRENCIES`, `ULTIMATE_WEAPON_STATS` and `DAMAGE_FORMULA`
 * "do not exist" — and 202 of the oracle's 349 `implementedBy` names came back as missing, because
 * most of them live in `knowledge`, which was not on the list.
 *
 * The failure is worse than an unhelpful error. An agent told an export does not exist does the
 * thing the instruction was written to prevent: it writes its own.
 *
 * Both checks derive their expectations — one from `package.json`, one from the graph — so neither
 * can drift as entry points and nodes are added.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PACKAGE_JSON = path.join(PACKAGE_ROOT, 'package.json')

/** Subpaths that are not code, and so have nothing to list. */
const NOT_CODE = /\.(json|md)$/

describe('every published entry point is searchable', () => {
  it('lists every code subpath the package exports', () => {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')) as {
      exports: Record<string, unknown>
    }

    const published = Object.keys(pkg.exports)
      .filter(key => key !== '.' && !key.includes('*'))
      .map(key => key.replace('./', ''))
      .filter(name => !NOT_CODE.test(name))

    const searchable: string[] = TOOLS.list_exports.inputSchema.properties.entry.enum

    const invisible = published.filter(name => !searchable.includes(name))

    expect(invisible, 'an entry point the tools cannot see is one an agent concludes is empty')
      .toEqual([])
  })

  it('returns exports for every entry point it advertises', () => {
    /*
     * The other direction: advertising an entry point that answers with nothing is the same
     * failure wearing the opposite hat.
     */
    const empty: string[] = []

    for (const entry of TOOLS.list_exports.inputSchema.properties.entry.enum as string[]) {
      const listed = TOOLS.list_exports.run({ entry })
      if (!listed.total || listed.total === 0) empty.push(entry)
    }

    expect(empty, 'an advertised entry point with no exports').toEqual([])
  })
})

describe('the oracle only names exports that exist', () => {
  it('resolves every implementedBy through get_export', () => {
    /*
     * Read from the graph rather than a fixture, so a node added tomorrow with a mistyped export
     * name fails here rather than in someone's editor six weeks later.
     */
    const graph = TOWER_ORACLE_TOOLS.oracle_map.run({ detail: true }) as {
      nodes: { id: string, implementedBy?: string[] }[]
    }

    const named = [...new Set(graph.nodes.flatMap(node => node.implementedBy ?? []))]
    expect(named.length, 'the graph should name plenty of exports').toBeGreaterThan(200)

    const missing = named.filter(name => Boolean(TOOLS.get_export.run({ name, limit: 1 }).error))

    expect(missing, '"call these — do not reimplement" must name things that can be called')
      .toEqual([])
  })
})

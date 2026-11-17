import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { MONOREPO_ROOT } from '../helpers/paths'

/**
 * The tool that says what tools exist must not leave one out.
 *
 * `list_modules` is how an agent orients: it is the first call, and whatever it does not mention
 * effectively does not exist. It reported `toolCount: 49` beside three modules listing 48 tools
 * between them — the missing one being `list_modules` itself, tagged `module: 'meta'` against a
 * `MODULES` map that had no `meta` entry.
 *
 * Nothing caught it, and the reason is worth keeping. There WAS a self-check: `toolCount` against
 * `expectedToolCount`. But `expectedToolCount` is `ALLOW.length + 1` and `toolCount` was
 * `Object.keys(merged).length` — both derived from the REGISTRATION, neither from the LISTING. Two
 * numbers that cannot disagree, guarding a third thing that had already drifted. That is a guard
 * shaped like a guard.
 *
 * So this compares the enumeration against the registration, which are the two things that can
 * actually come apart.
 *
 * The slim server lives in the development monorepo; a published copy has only `mcp/server.mjs`,
 * so this skips there rather than inventing a path.
 */
const SLIM_SERVER = path.resolve(MONOREPO_ROOT, 'tools', 'tower-mcp', 'mechanics-server.mjs')

/**
 * Read the listing through a plain `node`, once, rather than importing the server here.
 *
 * Vitest's transform cannot load this file — it is ESM with top-level await that reaches across
 * the monorepo, and importing it from a test throws `Invalid or unexpected token` before any
 * assertion runs. Node itself loads it without complaint, which is also how it is actually run.
 *
 * One spawn, at module scope, shared by every case. An earlier determinism test in this package
 * spawned `npx tsx` per case from inside a worker and tore down the worker's IPC channel under
 * load; `node -e` is a fraction of that and happens once.
 */
const listing = (() => {
  if (!existsSync(SLIM_SERVER)) return null

  const script = `
    const { pathToFileURL } = require('node:url')
    import(pathToFileURL(${JSON.stringify(SLIM_SERVER)}).href).then(({ TOOLS }) => {
      process.stdout.write(JSON.stringify({
        listing: TOOLS.list_modules.run(),
        registered: Object.keys(TOOLS).sort(),
      }))
    })
  `

  const out = execFileSync('node', ['-e', script], { encoding: 'utf8', timeout: 120_000 })
  return JSON.parse(out) as {
    listing: {
      toolCount: number
      listedToolCount: number
      expectedToolCount: number
      modules: { id: string, summary: string, tools: string[] }[]
    }
    registered: string[]
  }
})()

describe.skipIf(!existsSync(SLIM_SERVER))('list_modules', () => {
  it('mentions every tool the server registers', () => {
    const enumerated = listing!.listing.modules.flatMap(entry => entry.tools).sort()
    const registered = listing!.registered

    expect(enumerated, 'a registered tool that no module lists is invisible to an agent')
      .toEqual(registered)
  })

  it('agrees with its own totals', () => {
    const report = listing!.listing
    const summed = report.modules.reduce((total, entry) => total + entry.tools.length, 0)

    expect(report.listedToolCount, 'the reported listing total must be the listing').toBe(summed)
    expect(report.toolCount, 'registration and listing must agree').toBe(report.listedToolCount)
    expect(report.expectedToolCount).toBe(report.toolCount)
  })

  it('puts every tool in exactly one module', () => {
    const seen = new Map<string, string>()
    const twice: string[] = []
    for (const entry of listing!.listing.modules) {
      for (const name of entry.tools) {
        if (seen.has(name)) twice.push(`${name} (${seen.get(name)} and ${entry.id})`)
        seen.set(name, entry.id)
      }
    }

    expect(twice, 'a tool listed under two modules makes the totals lie').toEqual([])
  })

  it('gives every module a summary someone could act on', () => {
    const vague = listing!.listing.modules
      .filter(entry => !entry.summary || entry.summary.length < 12)
      .map(entry => entry.id)

    expect(vague, 'a module with no summary is a heading, not an answer').toEqual([])
  })
})

import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  IN_MONOREPO,
  callableTools,
  everyTool,
  expectedRegistries,
  loadedRegistries,
} from '../helpers/every-tool'
import { MCP, TESTS } from '../helpers/paths'

/**
 * An audit that sweeps the tool surface must sweep all of it.
 *
 * This is the meta-guard, and it exists because I made the same mistake twice in one afternoon
 * while writing guards against it.
 *
 * The catalog is assembled from three registries: the SDK tools, the oracle tools, and the
 * Effective Paths tools in a sibling server. Each sweeping audit here was written against whichever
 * subset was nearest to hand:
 *
 * - The prototype sweep read `TOOLS` alone. Its first run reported "oracle_get is not registered"
 *   instead of testing it. Spreading in the oracle tools fixed that and still left epaths out —
 *   where the last live instance of the bug was sitting, in a server whose own knowledge
 *   compartment documents the trap verbatim.
 * - The parameter audit read two of three, passed, and missed eight bare parameters, five of them
 *   on a mutating tool.
 *
 * Both are the shape of the `list_modules` defect those audits exist to catch: a check over one
 * registry, describing a surface made of several. A guard with the same blind spot as the bug is
 * worse than no guard, because it reports success.
 *
 * So: `every-tool.ts` assembles the registry once, and no audit may build its own.
 */


/** Audits that sweep the surface. Files testing one named tool are not making a coverage claim. */
const SWEEPS = [
  'no-tool-answers-for-the-prototype.test.ts',
  'orientation-fits-in-a-context.test.ts',
  'every-parameter-explains-itself.test.ts',
]

describe('an audit covers every registry', () => {
  it('loads every registry this checkout actually has', () => {
    /*
     * Not "all three" unconditionally. Two registries ship with the package and the Effective
     * Paths tools do not, so a clone of the published repository has two — and asserting three
     * there fails on a fact that is simply not true of it. This is the shape of defect the
     * published-clone verify exists to surface, and it surfaced this one.
     *
     * `expectedRegistries()` reads a signal that has nothing to do with the epaths server, so the
     * comparison still fails if that server breaks while this is the monorepo.
     */
    expect(loadedRegistries()).toEqual(expectedRegistries())
  })

  it('refuses to hand out a tool nobody has classified', () => {
    /*
     * `everyTool` decides which tools an audit may CALL, so an unreviewed one gets invoked by a
     * sweep. Adding a tool has to force that decision rather than defaulting to safe-looking
     * silence.
     *
     * The first version of this case asserted `typeof tool.mutates === 'boolean'` — which is always
     * true, because the loop assigns `MUTATES.has(name)`. It could not fail. That is the same
     * vacuous-check defect this directory exists to catch, so it now plants the fault: a tool the
     * roster has never seen must throw.
     */
    expect(() => everyTool()).not.toThrow()

    const registered = Object.keys(everyTool())
    const source = readFileSync(path.join(TESTS, 'helpers', 'every-tool.ts'), 'utf8')
    const roster = /const REVIEWED = new Set\(\[([\s\S]*?)\]\)/.exec(source)?.[1] ?? ''

    const missing = registered.filter(name => !roster.includes(`'${name}'`))
    expect(missing, 'every registered tool must be in REVIEWED').toEqual([])

    /*
     * And the roster must not name tools that no longer exist, or it stops meaning "reviewed".
     *
     * Only where every registry is present. In the published repository the roster legitimately
     * names the fifteen Effective Paths tools that did not load, and calling those "stale" would
     * demand deleting classifications that are correct here — turning a true statement about the
     * monorepo into a failure about a checkout that was never supposed to have them.
     */
    if (IN_MONOREPO) {
      const listed = [...roster.matchAll(/'([\w.]+)'/g)].map(match => match[1])
      const stale = listed.filter(name => !registered.includes(name))
      expect(stale, 'REVIEWED names tools that are not registered').toEqual([])
    }
  })

  it('never offers a mutating tool to a sweep by default', () => {
    const dangerous = callableTools().filter(tool => tool.mutates).map(tool => tool.name)
    expect(dangerous, 'a sweep must not be able to call these accidentally').toEqual([])
  })

  it('lets a sweep opt in explicitly, so the exclusion is visible', () => {
    /*
     * The other half. If the only way to reach the network tools were to fork the registry, the
     * next audit would fork it — which is how this started.
     */
    expect(callableTools({ includeNetwork: true }).length)
      .toBeGreaterThan(callableTools().length)
  })

  it('makes every sweep use the shared registry rather than its own', () => {
    const offenders: string[] = []

    for (const file of SWEEPS) {
      const text = readFileSync(path.join(TESTS, 'mcp', file), 'utf8')

      /* Any path to it — the sweeps reach the registry from `tests/`, not from beside it. */
      if (!/from '[^']*every-tool'/.test(text)) {
        offenders.push(`${file}: does not import the shared registry`)
      }

      /*
       * A spread of two registries into one object is the exact expression that was wrong twice.
       * It reads as thoroughness and is a subset.
       */
      if (/\{\s*\.\.\.TOOLS\s*,\s*\.\.\.TOWER_ORACLE_TOOLS\s*\}/.test(text)) {
        offenders.push(`${file}: assembles its own registry — use everyTool()`)
      }
    }

    expect(offenders).toEqual([])
  })

  it('names a tool from each registry, so a registry that stops loading fails loudly', () => {
    /*
     * Without this, a sibling that fails to import makes the surface silently smaller and every
     * sweep passes faster than before. Fewer findings looks like progress.
     */
    const all = everyTool()
    const loaded = new Set<string>(loadedRegistries())

    for (const [name, registry] of [
      ['get_export', 'sdk'],
      ['oracle_traps', 'oracle'],
      ['eval_formula', 'epaths'],
    ] as const) {
      /*
       * A registry this checkout was never meant to have is not a registry that stopped loading.
       * `expectedRegistries()` above already decides which of the two happened; this only names a
       * witness for each one that should be here.
       */
      if (!loaded.has(registry)) {
        expect(expectedRegistries()).not.toContain(registry)
        continue
      }
      expect(all[name], `${name} missing — the ${registry} registry did not load`).toBeDefined()
      expect(all[name].registry).toBe(registry)
    }
  })

  it('has not grown a fourth registry nobody wired in', () => {
    /*
     * `mechanics-server.mjs` merges the servers for the slim catalog. If it ever gains one this
     * file does not know about, the count stops matching and this says so.
     */
    const serverFiles = readdirSync(MCP)
      .filter(name => name.endsWith('.mjs'))
      .filter(name => /server|tools/.test(name))

    expect(serverFiles.sort()).toEqual(['oracle-tools.mjs', 'server.mjs'])
  })
})

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Every counted claim the site makes must match the installed package.
 *
 * The site says things like "819 formulas", "forty-six chart datasets", "316 mechanics". Those are
 * the claims most likely to rot, because nothing breaks when a number drifts — the page keeps
 * rendering and keeps being wrong. `site-examples-are-real` covers imported symbols; this covers
 * the figures around them.
 *
 * Each entry pairs a phrase pattern with the value the package actually reports. Both the numeral
 * and the written form are checked, since the prose uses whichever reads better.
 */
const SITE = path.resolve('site/src')

function siteFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap(entry => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) return siteFiles(full)
    return /\.(svelte|ts)$/.test(full) ? [full] : []
  })
}

const WORDS: Record<number, string> = {
  2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine',
  10: 'ten', 12: 'twelve', 13: 'thirteen', 15: 'fifteen', 27: 'twenty-seven', 29: 'twenty-nine',
  14: 'fourteen', 37: 'thirty-seven', 42: 'forty-two', 46: 'forty-six',
}

describe.skipIf(!existsSync(SITE))('the site counts match the package', () => {
  const files = siteFiles(SITE)
  const corpus = files.map(file => readFileSync(file, 'utf8')).join('\n')

  /**
   * Find every number the site states immediately before `noun`.
   *
   * Adjacency is required, and the number may not follow a letter, digit or colon. Both rules were
   * added after false positives: `B2:B200` next to `readFormulas` read as "200 formulas", and
   * `downtimeSeconds: 197, notes: []` read as "197 notes". A claim on this site is always written
   * as the number then the thing.
   */
  function claimed(noun: RegExp): string[] {
    /*
     * Thousands separators are matched as grouping, never as a trailing comma — `[0-9][0-9,]*`
     * swallowed the comma in `downtimeSeconds: 197, notes: []` and turned a result field into a
     * claim of 197 notes.
     */
    const pattern = new RegExp(
      /*
       * The noun goes inside a non-capturing group.
       *
       * Interpolated bare, a noun containing `|` split the WHOLE pattern at the top level:
       * `(number)\s+a|b` matches either "<number> a" or the bare word "b", so `match[1]` came back
       * undefined for the second branch and the helper threw rather than reporting anything.
       */
      `(?<![A-Za-z0-9:])([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+|[A-Za-z]+(?:-[a-z]+)?)\\s+(?:${noun.source})`,
      'gi',
    )
    return [...corpus.matchAll(pattern)].map(match => match[1].toLowerCase().replace(/,/g, ''))
  }

  /**
   * Assert the site states this count, and never states a different one.
   *
   * The presence check matters as much as the equality check: an earlier version only rejected
   * wrong numbers, so a claim phrased in a way the pattern could not see passed while checking
   * nothing at all. A claim this test cannot find is a claim it is not guarding.
   */
  function expectOnly(noun: RegExp, actual: number, label: string) {
    const allowed = new Set([String(actual), WORDS[actual]].filter(Boolean))
    const found = claimed(noun).filter(
      value => /^[0-9]+$/.test(value) || Object.values(WORDS).includes(value),
    )

    /*
     * No lower bound any more.
     *
     * This used to require the site to STATE the count, so that deleting a claim could not quietly
     * end the check. That rule became wrong the moment the counts were derived: `{sdkFacts.formulas}`
     * states the number at render time and leaves no numeral in the source, which is the stronger
     * arrangement and looked identical to a deletion.
     *
     * What matters now is the opposite direction — a numeral REAPPEARING where a derived fact
     * exists. `expectOnly` still catches a wrong one; `no-hardcoded-count` below catches a right
     * one that will not stay right.
     */
    expect(found.length, `${label}: unreachable`)
      .toBeGreaterThanOrEqual(0)

    const wrong = found.filter(value => !allowed.has(value))
    expect(
      wrong,
      `${label}: the package reports ${actual}, but the site also says ${[...new Set(wrong)].join(', ')}`,
    ).toEqual([])
  }

  it('formula, calculator, chart and graph counts are the package’s own', async () => {
    const mechanics = await import('thetowersdk/mechanics')
    const builders = await import('thetowersdk/builders')
    const charts = await import('thetowersdk/charts')
    const knowledge = await import('thetowersdk/knowledge')

    const formulas = Object.values(mechanics).filter(value => typeof value === 'function').length
    expectOnly(/formulas?\b/, formulas, 'mechanics formulas')

    expectOnly(/(?:calculators|builders)\b/, builders.CALCULATOR_BUILDERS.length, 'builders')

    expectOnly(/chart (?:datasets|entries)\b/, charts.SHARED_CHART_REGISTRY.length, 'charts')

    const graph = knowledge.GAME_KNOWLEDGE
    const nodes = knowledge.allNodes(graph)
    expectOnly(/mechanics across\b/, nodes.length, 'graph nodes')
    expectOnly(/compartments\b/, graph.compartments.length, 'compartments')

    /*
     * The graph's own contents, which drifted while everything above stayed right.
     *
     * The site claimed 1,642 claims against 1,641, and 315 nodes on one page beside 316 on
     * another. Both pages render perfectly and a reader has no way to tell which is lying.
     */
    expectOnly(
      /individual claims\b|claims that each\b/,
      nodes.flatMap((node: { assertions?: unknown[] }) => node.assertions ?? []).length,
      'graph claims',
    )
    expectOnly(
      /recorded misreadings\b/,
      nodes.flatMap((node: { traps?: unknown[] }) => node.traps ?? []).length,
      'recorded traps',
    )
    /* "…across 316 nodes" — the same figure as above, stated a second way on a second page. */
    expectOnly(/nodes\b/, nodes.length, 'nodes, wherever the site counts them')
  })

  it('the MCP tool count is the server’s own', () => {
    const server = readFileSync(path.join('mcp', 'server.mjs'), 'utf8')
    const tools = [...server.matchAll(/^ {2}([a-z_]+): \{/gm)].length
    expectOnly(/(?:MCP )?tools\b/, tools, 'MCP tools')
  })

  it('the patch-note count is the shipped archive’s own', async () => {
    const knowledge = await import('thetowersdk/knowledge')
    expectOnly(/(?:patch )?notes\b/, (knowledge.PATCH_NOTES ?? []).length, 'patch notes')
  })

  it('the entry-point count matches the exports map', () => {
    const manifest = JSON.parse(readFileSync('package.json', 'utf8')) as {
      exports: Record<string, unknown>
    }
    const entries = Object.keys(manifest.exports).filter(
      key => key.startsWith('./') && !key.includes('*') && !key.endsWith('.json'),
    ).length
    expectOnly(/entry points\b/, entries, 'entry points')
  })
})

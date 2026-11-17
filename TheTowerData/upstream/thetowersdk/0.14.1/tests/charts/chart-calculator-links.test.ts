import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { CHART_CALCULATOR_LINKS } from '../../src/charts/registry/calculator-links'
import { SHARED_CHART_REGISTRY } from '../../src/charts/registry/data'
import { CALCULATOR_IDS } from '../../src/calculators'
import { SRC } from '../helpers/paths'

/**
 * The chart → formula link, checked against both ends.
 *
 * A link is only worth something if it resolves. A handle pointing at nothing
 * sends an agent looking for a calculator that does not exist, which is worse
 * than no link at all: it stops the search that would have found the real one.
 */

describe('every chart the site publishes is linked', () => {
  it('covers every renderer key in the registry, with none left over', () => {
    const rendered = [...new Set(SHARED_CHART_REGISTRY.map(entry => entry.rendererKey))].sort()
    const linked = Object.keys(CHART_CALCULATOR_LINKS).sort()
    // Both directions. A missing key is an unlinked chart; a surplus one is a
    // link to a chart that no longer exists, and both go stale silently.
    expect(linked).toEqual(rendered)
  })

  it('names 48 charts across 29 renderers', () => {
    // Counted from the array, never grepped for `pathId:` — an earlier count
    // did that and caught two occurrences outside it.
    expect(SHARED_CHART_REGISTRY.length).toBe(48)
    expect(Object.keys(CHART_CALCULATOR_LINKS)).toHaveLength(29)
  })
})

describe('every link resolves', () => {
  it('points only at calculator handles that exist', () => {
    const known = new Set(CALCULATOR_IDS)
    for (const [renderer, link] of Object.entries(CHART_CALCULATOR_LINKS)) {
      for (const id of link.calculators) {
        expect(known.has(id), `${renderer} -> ${id}`).toBe(true)
      }
    }
  })

  it('points only at data symbols the charts modules export', () => {
    const dir = path.join(SRC, 'charts')
    /*
     * Recursive, because charts/ has subdomains now. This read only the top level, so when the
     * modules moved into registry/, tables/ and datasets/ it saw index.ts and nothing else — and
     * a check that finds no sources cannot fail on a missing symbol. It would have reported
     * success for exactly the reason it should have reported everything.
     */
    const walk = (from: string): string[] => fs.readdirSync(from, { withFileTypes: true })
      .flatMap(entry => (entry.isDirectory()
        ? walk(path.join(from, entry.name))
        : (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')
            ? [fs.readFileSync(path.join(from, entry.name), 'utf8')]
            : [])))
    const sources = walk(dir).join(String.fromCharCode(10))
    // The chartable rows live under data/charts/, so they are looked up
    // there rather than here.
    const tables = fs.readFileSync(
      path.join(dir, '..', 'data', 'charts', 'data.ts'), 'utf8')

    for (const [renderer, link] of Object.entries(CHART_CALCULATOR_LINKS)) {
      if (!link.data) continue
      const exported = new RegExp(`export\\s+const\\s+${link.data}\\b`)
      expect(
        exported.test(sources) || exported.test(tables),
        `${renderer} names data "${link.data}", which nothing exports`,
      ).toBe(true)
    }
  })
})

describe('the gaps are stated rather than implied', () => {
  it('gives every formula-less chart a reason', () => {
    /*
     * An empty `calculators` list means the SDK cannot recompute that chart —
     * its rows are measured. That is a real finding, so it has to carry a note.
     * Without one, "no calculators" is indistinguishable from "nobody looked".
     */
    for (const [renderer, link] of Object.entries(CHART_CALCULATOR_LINKS)) {
      if (link.calculators.length > 0) continue
      expect(link.note, `${renderer} has no calculators and no reason`).toBeTruthy()
      expect((link.note ?? '').length, renderer).toBeGreaterThan(15)
    }
  })

  it('reports how much of the chart surface is computable', () => {
    const links = Object.values(CHART_CALCULATOR_LINKS)
    const withFormula = links.filter(link => link.calculators.length > 0)
    // Ten of twenty-nine renderers have a formula behind them. The rest are
    // measured tables. Pinned so the number has to be updated deliberately when
    // a formula is added — which is the point of tracking it at all.
    expect(withFormula).toHaveLength(10)
    expect(links.filter(link => link.data)).toHaveLength(24)
  })
})

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { SITE as SITE_ROOT } from '../helpers/paths'

/**
 * A count the package can supply must never be typed into a sentence.
 *
 * `site-claims-are-true.test.ts` checked that the numerals were right. That is the weaker half of
 * the problem: it catches a number after it has gone wrong, and only when the claim is phrased the
 * way its pattern expects. It missed `'formulas': 822` in a code sample entirely, because the
 * number came after the noun rather than before it.
 *
 * The counts are now read from the installed package through `src/lib/sdk-facts.ts`, the same way
 * `SDK_VERSION` already was after that drifted twice. So the rule this file enforces is the one
 * that removes the question rather than policing it: if a fact exists, the page interpolates it.
 *
 * ## Which package the numbers describe
 *
 * The site installs `thetowersdk` from the registry with its own lockfile, so these numbers are
 * the PUBLISHED package's, not the working tree's. That is correct for a documentation site — a
 * reader installs what the site describes — and the release pipeline's `consumers` phase bumps the
 * site onto each new version, so the prose follows a publish without anyone editing it.
 *
 * It also means the site can legitimately differ from the working tree between releases. This file
 * therefore checks the SHAPE of the claim, never its value; `site-claims-are-true` owns value.
 */

const SITE = path.join(SITE_ROOT, 'src')

function siteFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) return siteFiles(full)
    return /\.(svelte|ts)$/.test(full) ? [full] : []
  })
}

/** Nouns `sdkFacts` can supply, and the words the prose uses for their sizes. */
const DERIVABLE = [
  'formulas?',
  'builders?',
  'chart datasets?',
  'compartments?',
  'entry points?',
  'individual claims',
  'recorded misreadings',
  '(?:patch )?notes',
]

/**
 * A stated quantity, written the way a claim on this site is written.
 *
 * Two exclusions, both learned the hard way and both already documented in
 * `site-claims-are-true.test.ts` — which I did not read closely enough before writing this and so
 * reproduced its bugs:
 *
 * - Digits may not end in a comma. `downtimeSeconds: 197, notes: []` otherwise reads as a claim of
 *   "197 notes", turning a result field in a code sample into a package count.
 * - "one" is not in the list. "one formula" is prose about a single formula, not an assertion about
 *   how many the package has, and no count here is ever one.
 */
const NUMBER = '(?:[0-9][0-9,]*[0-9]|[0-9]|two|three|four|five|six|seven|eight|nine|ten|eleven'
  + '|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|twenty-seven'
  + '|twenty-nine|forty-two|forty-six)'

describe.skipIf(!existsSync(SITE))('site counts are derived, not typed', () => {
  const files = siteFiles(SITE).filter((file) => !file.endsWith('sdk-facts.ts'))

  it('has a facts module to derive from', () => {
    const facts = path.join(SITE, 'lib', 'sdk-facts.ts')
    expect(existsSync(facts), 'src/lib/sdk-facts.ts is missing').toBe(true)

    const source = readFileSync(facts, 'utf8')
    /* Read from the package, not restated — the whole point. */
    expect(source).toMatch(/from 'thetowersdk/)
  })

  it('hardcodes no count a fact could supply', () => {
    const offenders: string[] = []

    for (const noun of DERIVABLE) {
      const pattern = new RegExp(`(?<![\\w:>])(${NUMBER})\\s+(${noun})\\b`, 'gi')

      for (const file of files) {
        const text = readFileSync(file, 'utf8')
        for (const match of text.matchAll(pattern)) {
          offenders.push(`${path.relative(SITE, file)}: "${match[1]} ${match[2]}"`)
        }
      }
    }

    expect(
      offenders,
      'interpolate sdkFacts instead — a number in prose has nothing to disagree with',
    ).toEqual([])
  })

  it('hardcodes no count written after the noun either', () => {
    /*
     * The phrasing that slipped past the numeral check for however long it had been there:
     * `{'ok': True, 'formulas': 822, 'calculators': 15, 'chartDatasets': 46}` in a Python sample.
     * Same claim, reversed word order, invisible to a pattern that expects the number first.
     */
    const offenders: string[] = []
    const pattern = /['"]?(formulas|calculators|builders|chartDatasets|compartments)['"]?\s*[:=]\s*([0-9][0-9,]*)/g

    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(pattern)) {
        offenders.push(`${path.relative(SITE, file)}: "${match[1]}: ${match[2]}"`)
      }
    }

    expect(offenders, 'a count in a code sample goes stale like any other').toEqual([])
  })

  it('uses one word for one population', () => {
    /*
     * "Calculator" named two things. `CALCULATOR_BUILDERS` is fifteen ready-made builders; the MCP
     * registry declares over 1,900 calculator handles across the whole exported surface. A reader
     * who saw "fifteen calculators" and then asked `calc_list` got a number two orders of magnitude
     * larger with nothing to explain the gap.
     *
     * The fifteen are builders throughout. `sdkFacts` has no `calculators` key, deliberately.
     */
    const facts = readFileSync(path.join(SITE, 'lib', 'sdk-facts.ts'), 'utf8')
    expect(facts).not.toMatch(/^\s*calculators:/m)

    const ambiguous: string[] = []
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      /* Prose only — a code sample echoing the WASM's own field name is quoting an API. */
      for (const match of text.matchAll(/\b(fifteen|15)\s+calculators\b/gi)) {
        ambiguous.push(`${path.relative(SITE, file)}: "${match[0]}"`)
      }
    }

    expect(ambiguous, 'call them builders — the registry uses "calculator" for something else')
      .toEqual([])
  })
})

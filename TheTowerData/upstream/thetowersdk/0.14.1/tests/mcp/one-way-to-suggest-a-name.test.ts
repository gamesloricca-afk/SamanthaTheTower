import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — the MCP server is plain ESM JavaScript with no declarations.
import { TOOLS, TOWER_ORACLE_TOOLS } from '../../mcp/server.mjs'
import { nearestNames } from '../../mcp/nearest-names.mjs'

/**
 * Every "did you mean" answers the same way.
 *
 * There were three implementations across three files and all of them matched by substring, which
 * is the wrong shape for the case they exist to serve. `'modules'.includes('moduls')` is false, so
 * a single dropped letter — the ordinary typo — produced an empty list. `calc_describe` offered
 * nothing for `lab.maxLevl`, one character from a real handle.
 *
 * Worse than useless: a suggestion list that is usually empty teaches a reader to stop looking at
 * it, so the times it does fire get ignored too.
 *
 * The oracle's `missSuggestions` and `resolution.alternatives` are deliberately excluded. They
 * resolve semantically over the knowledge graph — scoring labels, summaries and traps — which is a
 * different question from "which of these strings did you mean", and collapsing the two would make
 * the oracle worse in order to make the code shorter.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))

describe('name suggestions come from one implementation', () => {
  it('survives a single dropped letter', () => {
    /*
     * The case every previous version failed. Asserted through the tool rather than the helper,
     * because the helper being right is not the claim — the tool using it is.
     */
    const typo = TOOLS.calc_describe.run({ id: 'lab.maxLevl' })

    expect(typo.error).toBeDefined()
    expect(typo.didYouMean).toContain('lab.maxLevel')
  })

  it('still matches a genuine fragment', () => {
    const fragment = TOOLS.calc_describe.run({ id: 'maxLevel' })
    expect(fragment.didYouMean?.length).toBeGreaterThan(1)
  })

  it('offers nothing for a name resembling none of them', () => {
    /*
     * A list that always produces something is a list that means nothing. Ranking every candidate
     * and taking the top few would pass both cases above and be useless.
     */
    expect(nearestNames('zzzzzzzzzzzz', ['module', 'card', 'bot'])).toEqual([])
    expect(TOWER_ORACLE_TOOLS.oracle_map.run({ family: 'zzzzzzzzzzzz' }).didYouMean).toEqual([])
  })

  it('agrees across tools for the same query', () => {
    /*
     * Two tools asked about the same near-miss should not rank it differently. That is the whole
     * reason to share the implementation rather than merely fix each copy.
     */
    const candidates = ['modules', 'module', 'card', 'bot']
    expect(nearestNames('moduls', candidates)).toEqual(['module', 'modules'])
  })

  it('leaves no hand-rolled substring matcher behind', () => {
    /*
     * The pattern rather than the three instances, because the next one will be written by someone
     * who did not know this file exists. A `.filter(x => x.includes(...))` feeding a variable named
     * for suggestions is the exact shape that was wrong three times.
     */
    const offenders: string[] = []

    for (const file of readdirSync(HERE).filter(name => name.endsWith('.mjs'))) {
      if (file === 'nearest-names.mjs') continue
      const text = readFileSync(path.join(HERE, file), 'utf8')

      /* A suggestion variable assigned from a plain containment filter. */
      const handRolled = /(?:const|let)\s+(?:near|suggestions?|didYouMean)\s*=[\s\S]{0,200}?\.includes\(/
      if (handRolled.test(text)) offenders.push(file)
    }

    expect(offenders, 'use nearestNames from ./nearest-names.mjs').toEqual([])
  })
})

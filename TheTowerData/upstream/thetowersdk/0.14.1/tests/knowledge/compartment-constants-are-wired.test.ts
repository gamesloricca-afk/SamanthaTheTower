import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SRC } from '../helpers/paths'

/**
 * A constant declared in a compartment and referenced by nothing is knowledge
 * that was written down and never wired into the graph.
 *
 * This is the repo's signature defect shape aimed at itself: supported by the
 * model, never set by the wiring, nothing anywhere reports it. Four were found
 * on 2026-08-18 — the constant-table offset for the sub-module slot table, the two
 * perk-pool rates the game actually declares, the perk wave-requirement order
 * of operations, and the relic state that counts toward bonuses. All four were
 * real findings with game provenance, sitting inert beside nodes that described
 * them only in prose.
 *
 * eslint's `no-unused-vars` does not catch these: they are exported, so from its
 * point of view they are used. The question that matters is not "is it exported"
 * but "does anything in the package refer to it".
 *
 * Wiring means an ASSERTION carrying the value, not an `implementedBy` entry.
 * `implementedBy` names public SDK exports and is checked by
 * knowledge-exports.test.ts; compartment-local constants are not public, and
 * adding them there fails that test rather than this one.
 */

const COMPARTMENTS_DIR = join(SRC, 'knowledge', 'compartments')
const SRC_DIR = SRC

function readAllSources(dir: string, out: Map<string, string> = new Map()): Map<string, string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) readAllSources(path, out)
    else if (entry.name.endsWith('.ts')) out.set(path, readFileSync(path, 'utf-8'))
  }
  return out
}

/**
 * Identifier counts for the whole package, tokenised once.
 *
 * Two earlier versions of this were wrong in ways worth recording, because both
 * failed loudly in the direction of "catastrophic finding" rather than "broken
 * tool":
 *
 * - A word-boundary regex built in a template literal. The backslash was eaten
 *   before the file reached disk, and a template literal reads a lone
 *   backslash-b as the BACKSPACE character, so the pattern matched nothing and
 *   every constant in every compartment was reported as an orphan. Splitting on
 *   non-identifier characters has no escape to lose.
 * - Re-splitting all 685 sources for each of ~380 constants, which is a quarter
 *   of a million string splits and timed out at 5s. Tokenising once and looking
 *   up is the same answer in well under a second.
 */
function tokenCounts(sources: Iterable<string>): Map<string, number> {
  const counts = new Map<string, number>()
  for (const body of sources) {
    for (const token of body.split(/[^A-Za-z0-9_]+/)) {
      if (!token) continue
      counts.set(token, (counts.get(token) ?? 0) + 1)
    }
  }
  return counts
}

const sources = readAllSources(SRC_DIR)

/**
 * The corpus is the source tree, and this checker is no longer part of it.
 *
 * A checker that examines a corpus used to be inside that corpus: naming a constant in order to
 * assert something about it counted as a reference to it, so every name mentioned here got a
 * phantom one — including the sentinel that is supposed to be absent, which broke the counter's
 * own self-check. It was handled with an exemption for this one file.
 *
 * The exemption is gone because the reason for it is. Tests live in `tests/` and sources in
 * `src/`, so reading `src/` cannot pick up a test, and there is nothing to filter out. A
 * structural separation needs no list of exceptions to maintain, which is the point of having
 * one.
 */
const corpus = [...sources.values()]
const referenceCounts = tokenCounts(corpus)
const compartmentFiles = readdirSync(COMPARTMENTS_DIR)
  .filter(name => name.endsWith('.ts') && !name.endsWith('.test.ts'))

function declaredConstants(text: string): string[] {
  return [...text.matchAll(/^(?:export )?const ([A-Za-z_][A-Za-z0-9_]*)/gm)].map(m => m[1])
}

describe('every compartment constant is wired into the graph', () => {
  it('finds compartments and sources, so the sweep is not vacuous', () => {
    expect(compartmentFiles.length).toBeGreaterThanOrEqual(25)
    expect(sources.size).toBeGreaterThanOrEqual(200)
    const totalConstants = compartmentFiles
      .reduce((sum, file) => sum + declaredConstants(sources.get(join(COMPARTMENTS_DIR, file)) ?? '').length, 0)
    expect(totalConstants).toBeGreaterThanOrEqual(300)
  })

  it('counts identifiers correctly, so a broken counter cannot report a clean sweep', () => {
    expect(referenceCounts.get('PERK_APPLIED_AS') ?? 0).toBeGreaterThan(1)
    // Built at runtime so the sentinel never appears literally in any source.
    const absent = ['NOT', 'A', 'REAL', 'CONSTANT', 'NAME'].join('_')
    expect(referenceCounts.get(absent) ?? 0).toBe(0)
    // No exemptions: the corpus is every source file, because no test can be among them.
    expect(corpus.length).toBe(sources.size)
    // Substrings must not count: PERK_POOL_RATES is not PERK_POOL.
    const isolated = tokenCounts(['const PERK_POOL_RATES = 1'])
    expect(isolated.get('PERK_POOL') ?? 0).toBe(0)
    expect(isolated.get('PERK_POOL_RATES') ?? 0).toBe(1)
  })

  it('has no constant that nothing references', () => {
    const orphans: string[] = []
    for (const file of compartmentFiles) {
      const text = sources.get(join(COMPARTMENTS_DIR, file)) ?? ''
      for (const name of declaredConstants(text)) {
        // 1 = the declaration itself.
        if ((referenceCounts.get(name) ?? 0) <= 1) orphans.push(`${file} -> ${name}`)
      }
    }
    expect(orphans, `compartment constants nothing references:\n  ${orphans.join('\n  ')}`)
      .toEqual([])
  })

  it('the three found on 2026-08-18 are wired inside their own compartment', () => {
    const wired: Array<[string, string]> = [
      ['perks.ts', 'PERK_POOL_WEIGHTS_FROM_GAME_CONSTANTS'],
      ['perks.ts', 'PERK_WAVE_REQUIREMENT_ORDER'],
      ['progression.ts', 'RELIC_COUNTS_WHEN_STATE_IS'],
    ]
    for (const [file, name] of wired) {
      const text = sources.get(join(COMPARTMENTS_DIR, file)) ?? ''
      const local = tokenCounts([text]).get(name) ?? 0
      expect(local, `${name} declared and used in ${file}`).toBeGreaterThanOrEqual(2)
      expect(text, `${name} must not be in implementedBy — it is not a public export`)
        .not.toContain(`'${name}'`)
    }
  })
})

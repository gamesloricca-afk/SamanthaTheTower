import { describe, expect, it } from 'vitest'
import * as data from '../../src/data'
import * as mechanics from '../../src/mechanics'
import * as save from '../../src/save'
import * as sheets from '../../src/sheets'
import * as knowledge from '../../src/knowledge'
import { allNodes, GAME_KNOWLEDGE } from '../../src/knowledge'

/**
 * Every export the oracle points at must exist.
 *
 * ## Why
 *
 * `implementedBy` is the field that makes this graph useful for *building*
 * something rather than only for understanding it: it tells an agent "the SDK
 * already does this, call it". That is worth nothing — worse than nothing — if
 * the name is wrong.
 *
 * A hallucinated export is caught immediately by the compiler and costs a
 * minute. The failure this guards against is subtler and much more expensive:
 * an agent looks for `computeModuleStat`, does not find it under the name the
 * oracle gave, concludes the SDK has no such helper, and writes a fresh
 * implementation beside the correct one. Now there are two, they disagree at
 * the star tiers, and nothing reports it.
 *
 * So the oracle is not allowed to name an export it cannot produce.
 */

const SURFACES: Record<string, Record<string, unknown>> = {
  data: data as unknown as Record<string, unknown>,
  mechanics: mechanics as unknown as Record<string, unknown>,
  /*
   * `knowledge` counts too. Some compartments are the only place a table
   * exists — UW+ ability names, for instance, are knowledge rather than game
   * data — and an agent told to "call this" needs it to resolve from a public
   * entry point wherever it lives.
   */
  knowledge: knowledge as unknown as Record<string, unknown>,
  /*
   * `save` counts too. Perk and relic identity live in the save catalogs —
   * `PERK_IMPORT_CATALOG` is where an index becomes a name — and the oracle
   * points at them for exactly that reason.
   */
  save: save as unknown as Record<string, unknown>,
  /*
   * `sheets` counts too. The spreadsheet compartment names the helpers that
   * handle the reads which mislead — a spilled range, a truncated grid — and
   * `thetowersdk/sheets` is a published entry point like any other.
   */
  sheets: sheets as unknown as Record<string, unknown>,
}

function findExport(name: string): string | null {
  for (const [surface, module] of Object.entries(SURFACES)) {
    if (name in module) return surface
  }
  return null
}

describe('implementedBy points at real exports', () => {
  it('resolves every named export somewhere in the public SDK', () => {
    const missing: string[] = []

    for (const node of allNodes(GAME_KNOWLEDGE)) {
      for (const name of node.implementedBy ?? []) {
        if (!findExport(name)) missing.push(`${node.id} → ${name}`)
      }
    }

    /*
     * The message names the RIGHT failure.
     *
     * It used to read "exports that do not exist", and that sent two separate
     * sessions looking for typos. The symbols existed every time -- they were
     * `export const` in a compartment -- they simply were not re-exported from a
     * public entry point. A message that names the wrong cause is worse than a
     * vague one, because it is confidently wrong about where to look.
     */
    expect(missing, [
      'implementedBy names symbols that are not reachable from a public entry point:',
      ...missing.map(entry => `  ${entry}`),
      '',
      'They may well exist. "Public" here means re-exported by one of:',
      '  src/data/index.ts | src/mechanics/index.ts | src/save/index.ts | src/knowledge/index.ts',
      'A compartment-local `export const` is NOT public until one of those lists names it.',
      '',
      'Two correct fixes, no third:',
      '  1. it is genuinely API - add it to the relevant entry point, then name it here;',
      '  2. it is data behind a claim - drop it from implementedBy and put its VALUE in',
      '     an assertions entry, which is what makes it checkable.',
    ].join('\n')).toEqual([])
  })

  it('actually calls the module helpers it recommends', () => {
    /*
     * Naming an export is a weaker claim than it looks — a name can exist and
     * still be the wrong tool. These are the ones the module-level guidance
     * sends people to, so they get exercised rather than merely spelled.
     */
    expect(data.getLevelCapForRarity('Ancestral')).toBe(200)
    expect(data.getLevelCapForRarity('Ancestral 5')).toBe(300)

    // The clamp is what stops a tool accepting an out-of-range level.
    expect(data.clampLevelToRarity(400, 'Ancestral')).toBe(200)
    expect(data.clampLevelToRarity(250, 'Ancestral 5')).toBe(250)
  })

  it('reproduces the silent-1 failure the oracle warns about', () => {
    /*
     * The trap on `module.rarity` says an UNMATCHED label returns a bonus of 1
     * with no error. If that ever stops being true the warning is misleading,
     * so it is pinned here rather than trusted.
     *
     * What changed on 2026-08-17: a differently-SPELLED label is no longer
     * unmatched. `Ancestral 5*` now resolves like `Ancestral 5`, because the
     * rarity alias map finally registers the starred forms its own normaliser
     * had always known how to produce. The silent 1 remains for input that is
     * genuinely not a rarity, which is the case the trap is actually about.
     */
    const good = data.computeModuleStat({ type: 'armor', rarityLabel: 'Ancestral 5', level: 246 })
    const starred = data.computeModuleStat({ type: 'armor', rarityLabel: 'Ancestral 5*', level: 246 })
    const nonsense = data.computeModuleStat({ type: 'armor', rarityLabel: 'Ancestral 9', level: 246 })

    expect(good, 'a known label should produce a real bonus').not.toBe(1)
    expect(starred, 'the starred spelling is the same rarity and must agree').toBe(good)
    expect(nonsense, 'a label that is not a rarity still fails silently to 1').toBe(1)

    /*
     * A SECOND route into the same silent 1, found while writing this test: the
     * `type` argument is required, and omitting it returns 1 exactly like an
     * unknown rarity does. Two different mistakes, one indistinguishable
     * result, no error either way.
     */
    const noType = (data.computeModuleStat as unknown as (o: unknown) => number)({
      rarityLabel: 'Ancestral 5',
      level: 246,
    })
    expect(noType, 'omitting `type` is a second silent-1 path').toBe(1)
  })
})

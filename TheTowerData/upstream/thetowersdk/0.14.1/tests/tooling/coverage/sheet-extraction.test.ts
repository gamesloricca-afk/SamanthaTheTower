import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import inventory from '../../../tooling/coverage/data/sheet-extraction.v1.json'
import { PACKAGE_ROOT, SRC as SRC_ROOT } from '../../helpers/paths'

/**
 * The extraction denominator, asserted.
 *
 * The eDamage port shipped exposing 37 of the sheet's 47 computation columns
 * with 8 of them compared, and no file anywhere printed those three numbers --
 * so "the tests are green" read as "the port is verified" for six turns of
 * symptom-chasing. See docs/ACS_GUARDRAIL_FEEDBACK_2026-08-BATCH14.md.
 *
 * This holds the port to a whole-workbook scan: 30 tabs, 203,671 non-empty
 * cells, 98,783 formulas, and the dependency graph rooted at every path tab's
 * answer cell. It cannot re-read the sheet -- that needs a service account --
 * so it asserts the two things that CAN drift without anyone noticing:
 *
 *   1. a function the inventory says the port models is still named in it;
 *   2. the set the port does NOT model is exactly the recorded set, so both
 *      modelling one and the sheet growing a new one fail here.
 *
 * Regenerate after a sheet version bump:
 *
 *   node scripts/effective-paths/dump-whole-sheet.mjs canonical.json
 *   EPATHS_RENDER=UNFORMATTED_VALUE node scripts/effective-paths/dump-whole-sheet.mjs values.json
 *   node scripts/effective-paths/analyze-sheet-dump.mjs canonical.json templates.json
 *   node scripts/effective-paths/build-sheet-graph.mjs canonical.json graph.json
 *   node scripts/effective-paths/emit-extraction-inventory.mjs \
 *     canonical.json values.json templates.json graph.json
 */

const MECHANICS = path.join(SRC_ROOT, 'mechanics')
const DATA = path.join(SRC_ROOT, 'data')

function sourceText(): string {
  const chunks: string[] = []
  const walk = (dir: string) => {
    let entries: fs.Dirent[]
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) { walk(p); continue }
      // Tests excluded, matching the emitter. A name listed in a test is not
      // a modelled function; counting it as one makes this file's own
      // assertions erase the gap they exist to measure.
      if (/\.test\.[cm]?tsx?$/.test(e.name)) continue
      if (/\.(ts|mjs)$/.test(e.name)) chunks.push(fs.readFileSync(p, 'utf8'))
    }
  }
  walk(MECHANICS)
  walk(DATA)
  /*
   * The tooling too. The port's modelling of the sheet is split between shipped mechanics and the
   * graph tooling, and when that tooling moved out of `src/mechanics` this scan stopped seeing
   * seven symbols it had always seen — reporting them as "not modelled" rather than as "not
   * found", which is the same number arrived at for the opposite reason.
   */
  walk(path.join(PACKAGE_ROOT, 'tooling'))
  return chunks.join('\n')
}

const SRC = sourceText()

describe('the sheet extraction denominator', () => {
  it('records a whole-workbook scan, not a sample', () => {
    // Every tab, not just the eleven path tabs -- a formula on a data tab that
    // nobody reads is still a formula somebody could start reading.
    expect(inventory.counts.tabs).toBe(30)
    expect(inventory.counts.formulaCells).toBe(98783)
    expect(inventory.counts.nonEmptyCells).toBe(203671)
  })

  it('reaches every path tab from its own answer cell', () => {
    // The first version of this walk guessed `ES5` for all eleven tabs. Six of
    // them do not compute there, so six contributed ZERO reachable cells and
    // the walk still reported a number. A tab at zero is the tell.
    const empty = inventory.tabs.filter(t => t.reachable === 0)
    expect(empty.map(t => t.tab)).toEqual([])
  })

  it('knows every column its live row computes', () => {
    const total = inventory.tabs.reduce((n, t) => n + t.liveRowColumns, 0)
    expect(total).toBe(inventory.counts.liveRowRoots)
    expect(inventory.counts.liveRowRoots).toBe(791)
  })

  it('lands only on spill anchors it has identified', () => {
    /*
     * A formula-mode read returns EMPTY for a spilled cell -- only the anchor
     * carries a formula -- so a formula dump cannot see anything an
     * ARRAYFORMULA or a spilling LAMBDA produces, and reports it as blank
     * rather than as missing. Cross-referencing a VALUE dump found five
     * anchors whose spill lands in the graph, four of them player data and one
     * the `_IDS` IMPORTRANGE. That is the whole list; it is small on purpose.
     */
    expect(inventory.spillAnchorsInGraph).toHaveLength(5)
    for (const a of inventory.spillAnchorsInGraph) expect(a.formula).toBeTruthy()
  })

  it('still models every function it claims to model', () => {
    const claimed = inventory.functions.filter(f => f.modelled)
    const lost = claimed.filter(f => !SRC.includes(f.name)).map(f => f.name)
    // Named, never counted: the function IS the diagnosis.
    expect(lost).toEqual([])
    expect(claimed).toHaveLength(inventory.counts.modelledFunctions)
    /*
     * 126 -> 130 on 2026-08-20, and THREE OF THE FOUR ARE NOT REAL COVERAGE.
     *
     * `modelled` is a name match against non-test source, which the emit script
     * already warns overstates the gap. Wiring the coin band added EP graph
     * nodes whose formulas are compiled into
     * `planner-engine/generated/eDamage.citations.ts` -- a non-test `.ts` --
     * so every function those formulas mention started counting.
     *
     *   MODSTAT_CORE             genuinely modelled, as `computeModuleStat`
     *   IDS_MOD_CORE_NAME        NOT modelled
     *   IDS_MOD_CORE_ASSIST_NAME NOT modelled
     *   IDS_MOD_CORE_RARITY      NOT modelled
     *
     * The three IDS lookups resolve the player's core module and its rarity,
     * and the port does not do that: it takes `modules.core.primaryRarity` as
     * config, which NOTHING currently supplies. That unwired field is precisely
     * the defect `effective-paths-edamage-coin-levels.test.ts` pins -- so
     * reading these three as covered would claim exactly the thing that is
     * still missing. Written down rather than absorbed into a number.
     */
    /*
     * 130 -> 131 on 2026-08-24, and this one IS real coverage.
     *
     * `TTG_DISSONANT_UW_BOOST` feeds `eDamage!EB5`. The port has always had the
     * maths -- `dissonantBoostOfType` -- but `configFromSheet` hardcoded
     * `dissonance: { active: false }`, so it returned 1 for every account and
     * two whole terms vanished. A real community copy shows the sheet reading
     * 5.20808557575 there. Now wired, including the ultimate weapon echo's own
     * tier bests, which the sheet reads from a different block than attack's.
     *
     * 131 -> 133 on 2026-08-30: the v29 EP work wired the UW+ cost horizon —
     * EP_NEXT_UWP_COST_OFFSET (and EP_NEXT_UWP_COST) are now named in edamage-plan.
     */
    expect(inventory.counts.modelledFunctions).toBe(133)
  })

  it('has an exact list of what it does NOT model', () => {
    /*
     * A floor to work down, not a licence. Modelling one of these fails here
     * until the inventory is regenerated, and so does the sheet growing a new
     * unmodelled function -- which is the case nobody would otherwise see.
     */
    const recorded = inventory.functions.filter(f => !f.modelled).map(f => f.name).sort()
    const actual = inventory.functions
      .filter(f => !SRC.includes(f.name)).map(f => f.name).sort()
    expect(actual).toEqual(recorded)
    expect(recorded.length).toBe(
      inventory.counts.customFunctions - inventory.counts.modelledFunctions,
    )
  })

  it('splits the unmodelled set instead of quoting one misleading number', () => {
    /*
     * "70 unmodelled functions" is true and badly overstates the gap, because
     * `modelled` is a NAME match against the port's source.
     *
     *   player data (62) -- `IDS_*` reads the player's save through the IDS
     *     Master. The port RECEIVES these values as config; there is nothing to
     *     reproduce, however many cells call them.
     *   computation (12) -- the real list.
     *   never upstream of an answer (2) -- used somewhere, but no answer cell
     *     depends on them.
     *
     * Of the twelve, six land on eDamage / eDamage Coins / eDamage Stone, whose
     * columns, candidate ROIs and full 40-step paths are asserted on ten
     * accounts: their BEHAVIOUR is verified and only the citation is absent.
     * The genuinely unverified remainder is the five on eEcon and eEcon Stones,
     * which have no parity sweep at all -- and that, not the 70, is the number
     * worth acting on.
     */
    const by = (kind: string) =>
      inventory.functions.filter(f => !f.modelled && f.kind === kind).map(f => f.name)

    expect(by('player data')).toHaveLength(inventory.counts.unmodelledPlayerData)
    expect(by('computation')).toHaveLength(inventory.counts.unmodelledComputation)
    // 62 -> 59: the three IDS_MOD_CORE_* lookups moved out of this bucket by
    // NAME only. See the note on `modelledFunctions` above -- the port still
    // does not resolve a core module's rarity from the player's save.
    expect(inventory.counts.unmodelledPlayerData).toBe(59)
    // 12 -> 11: MODSTAT_CORE, which the port genuinely does model as
    // `computeModuleStat` -- the one of the four newly-matched names that is
    // real coverage rather than a citation artifact.
    // 11 -> 10: TTG_DISSONANT_UW_BOOST, wired 2026-08-24. See the note on
    // `modelledFunctions`.
    expect(inventory.counts.unmodelledComputation).toBe(8)

    // Every `IDS_*` is player data and nothing else is — if that stops holding,
    // the split above is sorting on a prefix rather than on a meaning.
    const misfiled = inventory.functions
      .filter(f => !f.modelled)
      .filter(f => /^IDS_/.test(f.name) !== (f.kind === 'player data'))
      .map(f => f.name)
    expect(misfiled).toEqual([])

    // The parts must add up to the whole; a new `kind` would otherwise vanish.
    const total = inventory.counts.unmodelledPlayerData
      + inventory.counts.unmodelledComputation + inventory.counts.unmodelledInert
    expect(total).toBe(inventory.counts.customFunctions - inventory.counts.modelledFunctions)
  })

  it('knows which unmodelled computations sit on a tab with no sweep', () => {
    const computation = inventory.functions.filter(f => !f.modelled && f.kind === 'computation')
    // Named, never counted.
    const unswept = computation
      .filter(f => f.reachesTabs.some((t: string) => t.startsWith('eEcon')))
      .map(f => f.name).sort()
    expect(unswept).toEqual([
      'DVT_BOT_STAT', 'MODSTAT_GENERATOR',
      'TTG_DISSONANT_UTILITY_BOOST', '_IDS_READY',
    ])
  })

  it('names the path table the port does not reproduce', () => {
    /*
     * The step-row display columns have no row 5, so they are not upstream of
     * any answer cell and a reachability walk rooted at the answers reports
     * them as out of scope. They are what the player actually reads: the
     * upgrade name, its level, cumulative cost, running time, coin/hour and
     * e-value. Every one is an `EPP_*` function and every one of those is in
     * the unmodelled list above -- one gap, counted twice, which is why it is
     * asserted rather than described.
     */
    expect(inventory.counts.stepRowDisplayColumns).toBe(104)
    const eppOnly = inventory.stepRowDisplayColumns.filter(c => /EPP_/.test(c.formula))
    expect(eppOnly.length).toBeGreaterThan(40)

    // Every `EPP_*` the workbook actually CALLS is now modelled by
    // `effective-paths-path-display.ts`. `list_lambdas` reports 17 defined;
    // only 12 appear in a formula, and the count here is of the used ones.
    const epp = inventory.functions.filter(f => /^EPP_/.test(f.name))
    expect(epp.filter(f => !f.modelled).map(f => f.name)).toEqual([])
  })
})

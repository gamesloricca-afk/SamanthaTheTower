import { describe, expect, it } from 'vitest'
import {
  buildTrustReport,
  loadSdkGraph,
  loadSdkGraphWithTrust,
  runSdkGraphInvariants,
} from '../../../tooling/sdk-graph'
import { CoverageInventorySchema, findSilentGaps } from '../../../tooling/coverage/schema'
import sheetsRaw from '../../../tooling/coverage/data/sheets.v1.json'
import { distinctEpPlannerCellKeys } from '../../../tooling/coverage/ep-citations'

describe('mechanics coverage + trust', () => {
  it('sheets inventory has zero silent gaps', () => {
    const inv = CoverageInventorySchema.parse(sheetsRaw)
    expect(findSilentGaps(inv)).toEqual([])
    // 121 -> 126 on 2026-08-20: the coin level band and both tabs' Core module
    // pairs became cited source when `levels.coin` was wired. Each of the five
    // was read off the live sheet before it was added -- see
    // `effective-paths-edamage-coin-levels.ts`.
    // 126 -> 127 on 2026-08-20: `eHP!DT2`, the row-2 flag that hides Health
    // Mastery when its card is not equipped. Read off the live sheet in
    // FORMULA mode before it was cited -- see `effective-paths-ehp-plan.ts`.
    // 127 -> 131 on 2026-08-22, closing the last four unexercised path
    // surfaces. Each was read off the live sheet before it was cited:
    //   eDamage Keys!DW5  the vault Damage node's ROI -- the only keys
    //                     candidate priced on a local ladder rather than
    //                     against $DI5, and the reason the port never bought it
    //   eRegen!AL3        `={eHP!AL3:BM37}`, the mirror that makes the regen
    //   eHP!AL3           config readable from the eHP cells
    //   eRegen!BO4        header of eRegen's OWN level band, which the mirror
    //                     above does not reach
    // 131 -> 132 on 2026-08-22: `eDamage!CX6`, `(1+$BL$39)*(1+$BM$39)`. The
    // config used to read that finished product, which froze the vault out of
    // the keys planner; the compute now rebuilds it from the relic and the
    // level. Cited so the cell is findable after the field was deleted.
    // 132 -> 133 on 2026-08-22: `eDamage!BM39`, the ultimate weapon damage
    // vault. It reaches the weapons only through the `CX6` product, so the
    // compute divides that product by it to let a keys purchase move the term.
    // 157 -> 154 on 2026-08-30: the v29 EP extraction revised the cited-cell set
    // (net -3). sheets.v1.json was re-seeded from the current planner citations
    // (distinctEpPlannerCellKeys), the same scan cell-references pins at 154.
    // 154 -> 155: verified current v5.11.01.03 eDamage Stone!FG5 CF candidate.
    // 155 -> 157: current eDamage!IG4 and eEcon!EX4 update-matrix anchors.
    // 157 -> 158: current eDamage Stone!ER5 UW+ roster gate.
    expect(inv.entries.length).toBe(158)
  })

  it('every planner citation is modeled or explicitly unmodeled', () => {
    const inv = CoverageInventorySchema.parse(sheetsRaw)
    const keys = new Set(distinctEpPlannerCellKeys())
    for (const key of keys) {
      expect(inv.entries.some(e => e.id === key), key).toBe(true)
    }
  })

  it('strict loadSdkGraph succeeds with seeded coverage', () => {
    const graph = loadSdkGraph({ mode: 'strict' })
    expect(Object.keys(graph.nodes).length).toBeGreaterThan(20)
  })

  it('buildTrustReport is ok in strict mode', () => {
    const { graph, report, trust } = loadSdkGraphWithTrust({ mode: 'strict' })
    expect(trust).toBe('ok')
    expect(report.ok).toBe(true)
    expect(report.invariants.filter(i => i.severity === 'error')).toEqual([])
    const hits = runSdkGraphInvariants(graph)
    expect(hits.filter(h => h.id === 'planner-cell-not-in-graph')).toEqual([])
  })

  it('degraded mode returns report without throwing when forced empty inventory', () => {
    const { graph } = loadSdkGraphWithTrust({ mode: 'degraded', scanPlannerCitations: false })
    const report = buildTrustReport(graph, {
      mode: 'degraded',
      scanPlannerCitations: true,
      sheetsInventory: {
        version: 1,
        surface: 'sheet',
        entries: [],
      },
    })
    // Without allowlist, planner citations become planner-cell-not-in-graph errors
    expect(report.ok).toBe(false)
    expect(report.invariants.some(i => i.id === 'planner-cell-not-in-graph')).toBe(true)
  })
})

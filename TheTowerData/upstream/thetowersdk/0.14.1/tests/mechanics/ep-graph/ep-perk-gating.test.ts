import { describe, expect, it } from 'vitest'

import { loadEpGraph } from '../../../src/mechanics/ep-graph'

/**
 * Every eDamage perk is gated by the Perks master, and the graph says so.
 *
 * The five per-ultimate perk toggles are never read alone. Each appears inside
 * an `AND` with `AY61`, the Perks master:
 *
 *     AX5   STAT_UW_DW_FINAL_QTY(...,  AND($AY$67, $AY$61))
 *     AV6   STAT_UW_CL_FINAL_DMG(...,  AND($AY$70, $AY$61))
 *     AX7   STAT_UW_SM_FINAL_QTY(...,  AND($AY$61, $AY$69))
 *     AV8   STAT_UW_SL_FINAL_DMG(...,  AND($AY$61, $AY$68))
 *     AX10  STAT_UW_ILM_FINAL_QTY(..., AND($AY$61, $AY$71))
 *
 * A model that reads the perk toggle without the master reports a perk as
 * active while the panel has perks switched off — the stat moves, the sheet
 * does not, and the difference looks like a formula error somewhere else.
 */
const PERK_GATED_STATS = [
  'stat.eDamage.deathWaveQuantity',
  'stat.eDamage.chainLightningDamage',
  'stat.eDamage.smartMissilesQuantity',
  'stat.eDamage.spotlightDamage',
  'stat.eDamage.innerLandMinesQuantity',
] as const

describe('eDamage perk gating', () => {
  const graph = loadEpGraph()
  const readsFrom = (id: string) => graph.edges
    .filter(edge => edge.from === id && edge.kind === 'reads')
    .map(edge => edge.to)

  it('every perk-fed stat reads the Perks master as well as its perk', () => {
    for (const stat of PERK_GATED_STATS) {
      expect(graph.nodes[stat], stat).toBeTruthy()
      const targets = readsFrom(stat)

      // RETYPED. AY61 is =NOT(EQ(AX20, "Tourney")) — perks are on for every run
      // type except Tourney, and nobody sets it. It was a `control` here until a
      // capture script wrote to it and read back a formula.
      expect(targets, stat).toContain('display.eDamage.perksMaster')
      expect(
        targets.filter(id => id.startsWith('control.eDamage.perk')).length,
        stat,
      ).toBe(1)
    }
  })

  it('every perk node records the gating as a trap, not just as an edge', () => {
    // An edge is only found by someone already querying the graph. The trap is
    // what reaches someone reading the node.
    const perks = Object.values(graph.nodes)
      .filter(node => node.id.startsWith('control.eDamage.perk'))

    expect(perks.length).toBe(5)
    for (const perk of perks) {
      expect(perk.traps.length, perk.id).toBeGreaterThan(0)
      expect(perk.traps.some(trap => trap.note.includes('AY61')), perk.id).toBe(true)
    }
  })

  it('Spotlight Missiles inherits its controls through Spotlight damage', () => {
    // AV9 reads $AV$8 rather than the controls directly, so the dependency is
    // one hop away. A reader looking only at AV9 sees no perk dependency at all.
    const targets = readsFrom('stat.eDamage.spotlightMissilesDamage')
    expect(targets).toEqual(['stat.eDamage.spotlightDamage'])
    expect(readsFrom('stat.eDamage.spotlightDamage'))
      .toContain('control.eDamage.perkSpotlightDamageBonus')
  })

  it('Game Speed and the boss interval both read Run Type', () => {
    // The control the panel reader could not see, now with two consumers
    // recorded against it.
    for (const consumer of ['display.eDamage.gameSpeed', 'display.eDamage.bossWaveInterval']) {
      expect(readsFrom(consumer), consumer).toContain('control.eDamage.runType')
    }
  })

  it('every edge carries the cell its formula was read from', () => {
    for (const edge of graph.edges) {
      const cells = edge.evidence.sourceCells ?? []
      const named = cells.length > 0 || !!edge.evidence.wikiTitle || !!edge.evidence.lambdaName
      expect(named, edge.id).toBe(true)
    }
  })
})

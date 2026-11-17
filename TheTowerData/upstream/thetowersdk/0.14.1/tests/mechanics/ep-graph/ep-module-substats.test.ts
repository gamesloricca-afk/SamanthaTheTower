import { describe, expect, it } from 'vitest'

import { loadEpGraph } from '../../../src/mechanics/ep-graph'

/**
 * How module cores reach the ultimate weapon numbers.
 *
 * Every UW stat on eDamage sums `AM<n> + AR<n>`, and the two halves are not
 * alike:
 *
 *     AM26 = IDS_MOD_CORE_SUBSTAT(IDS_MOD_CORE_NAME($AX$15), AK26)          primary
 *     AR26 = AO26 * $AO$24                                                  assist
 *     AO24 = IF(AN23, '_IDS'!BV5 + BF48, 0)                                 effectiveness
 *     AN23 = AND('_IDS'!BV2, IDS_MOD_CORE_ASSIST_NAME($AX$15) <> "")        enabled
 *
 * The primary core's substat is used at face value. The assist core's is
 * multiplied by an effectiveness factor that is ZERO unless an assist is both
 * enabled and set — so adding the assist column straight onto the primary
 * overstates every ultimate by an entire substat.
 */
describe('module substats reaching UW stats', () => {
  const graph = loadEpGraph()
  const readsFrom = (id: string) => graph.edges
    .filter(edge => edge.from === id && edge.kind === 'reads')
    .map(edge => edge.to)

  const UW_STATS = [
    'stat.eDamage.deathWaveQuantity',
    'stat.eDamage.chainLightningDamage',
    'stat.eDamage.smartMissilesQuantity',
    'stat.eDamage.spotlightDamage',
    'stat.eDamage.innerLandMinesQuantity',
  ] as const

  it('every UW stat depends on the module preset and on assist effectiveness', () => {
    for (const stat of UW_STATS) {
      const reads = readsFrom(stat)
      expect(reads, stat).toContain('display.eDamage.presetModules')
      expect(reads, stat).toContain('stat.eDamage.assistEffectiveness')
    }
  })

  it('assist effectiveness is gated, and the gate needs both halves', () => {
    expect(readsFrom('stat.eDamage.assistEffectiveness')).toContain('gate.eDamage.assistEnabled')
    expect(readsFrom('gate.eDamage.assistEnabled')).toContain('display.eDamage.presetModules')

    const gate = graph.nodes['gate.eDamage.assistEnabled']
    expect(gate?.traps.some(trap => trap.note.includes('Either alone is not enough'))).toBe(true)
  })

  it('records that the assist half can be worth zero', () => {
    // The failure this prevents is silent: with no assist enabled the assist
    // substats are all still visible on the sheet, and a model that reads them
    // gets a number the sheet never uses.
    const node = graph.nodes['stat.eDamage.assistEffectiveness']
    expect(node?.traps.some(trap => trap.note.includes('ZERO'))).toBe(true)
    expect(node?.traps.some(trap => trap.note.includes('not additive at face value'))).toBe(true)
  })

  it('flags the floor on quantity substats and only on those', () => {
    // AR27, AR32, AR35 and AR40 are FLOOR(AO<n>*$AO$24); every other row is
    // unfloored. The floored rows are exactly the quantity stats, so missing it
    // grants fractional extra missiles and mines.
    const floored = ['deathWaveQuantity', 'smartMissilesQuantity', 'innerLandMinesQuantity']
    const unfloored = ['chainLightningDamage', 'spotlightDamage']

    for (const key of floored) {
      const node = graph.nodes[`stat.eDamage.${key}`]
      expect(node?.traps.some(trap => trap.note.includes('FLOOR')), key).toBe(true)
    }
    for (const key of unfloored) {
      const node = graph.nodes[`stat.eDamage.${key}`]
      expect(node?.traps.some(trap => trap.note.includes('FLOOR')), key).toBe(false)
    }
  })
})

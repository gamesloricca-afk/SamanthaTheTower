import { describe, expect, it } from 'vitest'

import { loadEpGraph } from '../../../src/mechanics/ep-graph'

/**
 * The eHP Total Value block, which lives outside the control panel.
 *
 * `inspect_tab_ui` reads a tab's label/value panel — AT/AY for eHP. These
 * controls are in column AM, rows 20 to 26, and are invisible to it and to the
 * captured control surface. The prose inventory knew about them; nothing
 * machine-readable did.
 *
 * One of them is not a control:
 *
 *     AM20  false                          Wall Health        input
 *     AM23  false                          Max Recovery       input
 *     AM24  false                          Chain Thunder      input
 *     AM25  =IDS_UW_OWN("Death Wave")      Death Wave Health  DERIVED
 *     AM26  false                          Chrono Field       input
 *
 * A column of checkboxes with a formula in the middle of it is the same shape
 * as eDamage `BH34`, and it fails the same way: offered as a switch, it lets a
 * user turn on something the account does not have.
 */
describe('eHP Total Value block', () => {
  const graph = loadEpGraph()

  it('models the four real toggles as controls', () => {
    for (const id of [
      'control.eHP.wallHealth',
      'control.eHP.maxRecovery',
      'control.eHP.chainThunder',
      'control.eHP.chronoField',
    ]) {
      const node = graph.nodes[id]
      expect(node, id).toBeTruthy()
      expect(node?.type, id).toBe('control')
    }
  })

  it('models Death Wave Health as a gate, not a toggle', () => {
    const node = graph.nodes['gate.eHP.deathWaveHealthAvailable']
    expect(node?.type).toBe('gate')
    expect(node?.traps.some(trap => trap.note.includes('IDS_UW_OWN'))).toBe(true)
    expect(graph.nodes['control.eHP.deathWaveHealth']).toBeUndefined()
  })

  it('records that all of them are outside the control panel', () => {
    // The reason they were missing, attached to each node rather than left in
    // a commit message.
    const ids = [
      'control.eHP.wallHealth',
      'control.eHP.maxRecovery',
      'control.eHP.chainThunder',
      'control.eHP.chronoField',
      'gate.eHP.deathWaveHealthAvailable',
    ]
    for (const id of ids) {
      expect(graph.nodes[id]?.traps.some(trap => trap.note.includes('Total Value')), id).toBe(true)
    }
  })

  it('keeps the four totals as displays of another cell', () => {
    // AN16 is FORMAT_NUMBER(AP16) and the rest read AP17-AP19 directly, so the
    // value lives in AP and AN is a view of it. Reading AN as the number is
    // fine; writing to it would be writing to a formula.
    for (const id of [
      'stat.eHP.totalHealth',
      'stat.eHP.totalHealthRegen',
      'stat.eHP.totalDefenseAbsolute',
      'stat.eHP.totalDefensePercent',
    ]) {
      const node = graph.nodes[id]
      expect(node, id).toBeTruthy()
      expect(node?.traps.some(trap => trap.kind === 'display-only'), id).toBe(true)
    }
  })
})

describe('what only the rendered sheet shows', () => {
  const graph = loadEpGraph()

  it('records the merged checkbox governing three wall rows', () => {
    // AM20 is one box spanning rows 20-22. From a cell read AM21 and AM22 are
    // empty, which is indistinguishable from three rows where two are blank.
    const node = graph.nodes['control.eHP.wallHealth']
    expect(node?.label).toBe('Wall Health / Fortification / Regen')
    expect(node?.traps.some(t => t.note.includes('ONE CHECKBOX FOR THREE LABELS'))).toBe(true)
  })

  it('records that the derived checkbox is visually identical to the real ones', () => {
    // The trap cuts both ways: the formula says AM25 is computed, the pixels
    // say it is a checkbox like its neighbours. Either source alone misleads.
    const node = graph.nodes['gate.eHP.deathWaveHealthAvailable']
    expect(node?.traps.some(t => t.note.includes('RENDERS AS A CHECKBOX'))).toBe(true)
  })

  it('records the assist column greying and the collapsed column beside it', () => {
    const node = graph.nodes['display.eDamage.assistColumn']
    expect(node?.traps.some(t => t.note.includes('GREYS'))).toBe(true)
    expect(node?.traps.some(t => t.note.includes('COLLAPSED'))).toBe(true)
  })

  it('keeps the author disclaimer, which lives in no cell', () => {
    const node = graph.nodes['display.eDamage.authorDisclaimer']
    expect(node?.traps.some(t => t.note.includes('not trust these paths blindly'))).toBe(true)
    expect(node?.traps.some(t => t.note.includes('not automatically a bug in the port'))).toBe(true)
  })
})

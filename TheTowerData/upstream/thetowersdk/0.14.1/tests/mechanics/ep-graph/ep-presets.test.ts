import { describe, expect, it } from 'vitest'

import { loadEpGraph } from '../../../src/mechanics/ep-graph'

/**
 * The preset selectors, which are not selectors.
 *
 * eHP `AX3:AX7` and eDamage `AX12:AX16` each look like five preset dropdowns.
 * They are spill results — the formula is one column left, in AW:
 *
 *     AW4  ={"", IDS_PRESET_PRESET(AX$3, AT4)}
 *
 * which spills two cells, so the AX cell holds output. A value read shows a
 * preset name and a formula read of AX shows nothing, which is exactly how they
 * came to be modelled as controls.
 *
 * The two tabs differ in what drives them, and that difference is the useful
 * part: eHP hard-codes `"Farming"` in `AW3`, while eDamage `AW12` SWITCHes on
 * `AX19` — the Run Type control. So on eDamage the presets are downstream of
 * Run Type, and eHP has no run-type input at all.
 */
describe('EP preset selectors', () => {
  const graph = loadEpGraph()
  const edgesFrom = (id: string) => graph.edges.filter(edge => edge.from === id)

  it('are modelled as displays on both tabs', () => {
    for (const id of [
      'display.eHP.presetsMaster', 'display.eHP.presetWorkshop', 'display.eHP.presetCards',
      'display.eHP.presetModules', 'display.eHP.presetPerks',
      'display.eDamage.presetsMaster', 'display.eDamage.presetWorkshop',
      'display.eDamage.presetCards', 'display.eDamage.presetModules', 'display.eDamage.presetPerks',
    ]) {
      const node = graph.nodes[id]
      expect(node, id).toBeTruthy()
      expect(node?.type, id).toBe('display')
      expect(node?.traps.some(trap => trap.kind === 'spilled-range'), id).toBe(true)
    }
    expect(Object.keys(graph.nodes).some(id => id.startsWith('control.eHP.preset'))).toBe(false)
    expect(Object.keys(graph.nodes).some(id => id.startsWith('control.eDamage.preset'))).toBe(false)
  })

  it('makes the eDamage presets downstream of Run Type', () => {
    const master = edgesFrom('display.eDamage.presetsMaster')
    expect(master.map(edge => edge.to)).toContain('control.eDamage.runType')

    for (const key of ['presetWorkshop', 'presetCards', 'presetModules', 'presetPerks']) {
      const derives = edgesFrom(`display.eDamage.${key}`)
        .filter(edge => edge.kind === 'derives')
        .map(edge => edge.to)
      expect(derives, key).toContain('display.eDamage.presetsMaster')
    }
  })

  it('does not give eHP a Run Type it does not have', () => {
    // eHP's master is a literal inside AW3. Copying eDamage's chain onto it
    // would invent a control the tab has no cell for.
    const master = edgesFrom('display.eHP.presetsMaster')
    expect(master.map(edge => edge.to)).not.toContain('control.eDamage.runType')
    expect(Object.keys(graph.nodes)).not.toContain('control.eHP.runType')
  })

  it('keeps the module substat chain pointing at the preset that feeds it', () => {
    // The UW substat edges were written against `control.eDamage.presetModules`
    // before it was known to be a spill. Retyping it must not break the chain:
    // the module identity still comes from that cell, it is simply derived.
    const consumers = graph.edges
      .filter(edge => edge.to === 'display.eDamage.presetModules' && edge.kind === 'reads')
      .map(edge => edge.from)
    expect(consumers.length).toBeGreaterThanOrEqual(5)
    expect(consumers).toContain('stat.eDamage.deathWaveQuantity')
  })
})

describe('the "show" controls are level horizons', () => {
  const graph = loadEpGraph()

  it('parses a dropdown label into a number, not a boolean', () => {
    // EPG_MODULE_LEVEL_LIMIT splits on space and takes the first token:
    // "none" -> 0, "all" -> 300, a numeric token -> itself, anything else -> 0.
    // So "All         | Show all labs levels on Coin path" is 300.
    const lambda = graph.nodes['lambda.workbook.moduleLevelLimit']
    expect(lambda?.lambdaName).toBe('EPG_MODULE_LEVEL_LIMIT')
    expect(lambda?.formula).toContain('raw="all", 300')
    expect(lambda?.formula).toContain('raw="none", 0')
    expect(lambda?.formula).toContain('ISNUMBER(raw), raw')
  })

  it('reaches the path only through that parse', () => {
    // The consumers use the number as a HORIZON — level$5 + limit <= level
    // blanks the column — so these controls cap how far ahead the path plans.
    // Modelling them as on/off loses every value between 0 and 300.
    const parsed = graph.edges
      .filter(e => e.to === 'lambda.workbook.moduleLevelLimit')
      .map(e => e.from)
      .sort()
    expect(parsed).toEqual([
      'control.eDamage.showLabsOnCoinPath',
      'control.eEcon.showLabs',
      'display.eDamage.moduleLevelHorizon',
    ])
    for (const id of parsed) {
      const note = graph.nodes[id]?.traps.map(t => t.note).join(' ') ?? ''
      expect(note, id).toMatch(/HORIZON|horizon|plans NOTHING/)
    }
  })

  it('has TWO horizons per damage tab, and only one of them is a control', () => {
    // eDamage Coins passes AL$4 for its module columns and $AY$27 for its lab
    // and mastery columns. They are different cells with different meanings,
    // and only AY27 is something a player sets: AL4 and eHP!AM4 are FORMULAS
    // that yield "All" once the module passes level 159 and an empty string
    // below it, which EPG_MODULE_LEVEL_LIMIT reads as 0.
    expect(graph.nodes['control.eDamage.showLabsOnCoinPath']?.type).toBe('control')
    expect(graph.nodes['display.eDamage.moduleLevelHorizon']?.type).toBe('display')
    expect(graph.nodes['display.eDamage.moduleLevelHorizon']?.formula).toContain("'Master Sheet'!I7>159")
    expect(graph.nodes['display.eHP.showLevelsOnPath']?.formula).toContain("'Master Sheet'!I23>159")
    // eEcon's is the only literal, and so the only one a player can change.
    expect(graph.nodes['control.eEcon.showLabs']?.type).toBe('control')
  })

  it('falls back to zero, which is indistinguishable from "none"', () => {
    // A renamed or reordered dropdown option plans NOTHING rather than
    // erroring. The failure is silent and looks like a deliberate setting.
    const note = graph.nodes['lambda.workbook.moduleLevelLimit']?.traps
      .map(t => t.note).join(' ') ?? ''
    expect(note).toContain('silently plans nothing')
  })
})

describe('eDamage Coins ROI denominators', () => {
  it('measures Cash Bonus against a different baseline', () => {
    // One column of twenty-five divides by $CT5; the other twenty-four divide
    // by $EC5, the current eDMG. Nothing in the shape says so — it is a single
    // cell reference apart from its neighbours, which is why reading five
    // columns and generalising would have missed it.
    const node = loadEpGraph().nodes['stat.eDamageCoins.cashBonusRoi']
    expect(node?.formula).toContain('$CT5')
    expect(node?.formula).not.toContain('$EC5-1')
  })
})

import { describe, expect, it } from 'vitest'

import { loadEpGraph } from '../../../src/mechanics/ep-graph'
import sweptRaw from '../../../src/mechanics/ep-controls/data/swept-regions.v1.json'

/**
 * What has actually been read, as opposed to what has been counted.
 *
 * The control surface capture covers each tab's control panel. That is a
 * sample, and treating it as the surface is how "53 of 175" came to read like a
 * completeness figure. This file records the windows that have been swept cell
 * by cell, so any claim about a tab's total can be checked against how much of
 * that tab anyone has looked at.
 *
 * eHP, eRegen and eDamage are swept, each for a named window. eEcon has had its
 * eight modelled cells verified but its area not enumerated, and the difference
 * is recorded rather than rounded up to "swept".
 *
 * No tab is swept whole. Every entry names what it covered and what it did not,
 * because on this sheet the parts nobody read are where the corrections came
 * from — a mirror, two spills, and sixteen controls in an unread column.
 *
 * The eRegen sweep is why this file exists. Its panel had eleven controls wired
 * into the graph, and the sweep found `AL3 = {eHP!AL3:BM37}` — the whole panel
 * is a spilled mirror and eRegen has no controls of its own there. Wiring had
 * run ahead of reading.
 */
interface SweptRegion { columns: string, contains: string, controls: number }
interface SweptTab { tab: string, window: string, verification?: string, regions: SweptRegion[] }
interface SatelliteTab {
  tab: string
  mirrorsFrom: string
  anchors: string[]
  offset: string
  readsControls: string[]
  cellsRead: string
  notSwept: string
}
interface Swept {
  sheetVersion: string
  sweptAt: string
  note: string
  tabs: SweptTab[]
  satelliteNote: string
  satelliteTabs: SatelliteTab[]
}

const SWEPT = sweptRaw as Swept

describe('swept regions', () => {
  it('names what was read, in the form that matches what kind of read it was', () => {
    // Two kinds of entry, and conflating them was the first thing this test got
    // wrong: a SWEEP covers an area and names an A1 range, a VERIFICATION
    // checks named cells and names them. Requiring a range of both would have
    // pushed the eEcon check into claiming an area nobody enumerated.
    expect(SWEPT.tabs.length).toBeGreaterThan(0)
    for (const tab of SWEPT.tabs) {
      expect(tab.regions.length, tab.tab).toBeGreaterThan(0)
      if (tab.verification) {
        expect(tab.window, tab.tab).toMatch(/[A-Z]+\d+/)
        continue
      }
      expect(tab.window, tab.tab).toMatch(/[A-Z]+\d+:[A-Z]+\d+/)
    }
  })

  it('accounts for every column band, including the ones with no controls', () => {
    // A band recorded as holding nothing is a result, not an omission: it is
    // what stops the same columns being read again, and what bounds where else
    // to look.
    const eHP = SWEPT.tabs.find(tab => tab.tab === 'eHP')
    expect(eHP).toBeTruthy()
    expect(eHP?.regions.some(region => region.controls === 0)).toBe(true)
    for (const region of eHP?.regions ?? []) {
      expect(region.contains.length, region.columns).toBeGreaterThan(0)
    }
  })

  it('the off-panel controls it found are in the graph', () => {
    // The sweep is only worth recording if what it found got modelled.
    const graph = loadEpGraph()
    for (const id of [
      'control.eHP.wallHealth',
      'control.eHP.maxRecovery',
      'control.eHP.chainThunder',
      'control.eHP.chronoField',
      'gate.eHP.deathWaveHealthAvailable',
      'control.eHP.rowsCalculated',
    ]) {
      expect(graph.nodes[id], id).toBeTruthy()
    }
  })

  it('records that input_ranges points Rows Calculated at its label', () => {
    // Label AJ21, value AJ22. input_ranges cites AJ22 and is correct; this
    // assertion existed to pin a 'fix' that was itself the error.
    const graph = loadEpGraph()
    const node = graph.nodes['control.eHP.rowsCalculated']
    expect(node?.sourceCells[0]?.cell).toBe('AJ22')
    expect(node?.traps.some(trap => trap.note.includes('AJ22'))).toBe(true)
  })

  it('does not claim a swept window for the tabs nobody has swept', () => {
    // The honest gap. If this ever lists all four, the claim has to be earned
    // rather than assumed.
    const swept = new Set(SWEPT.tabs.map(tab => tab.tab))
    expect(swept.has('eHP')).toBe(true)
    expect(swept.has('eRegen')).toBe(true)
    expect(swept.has('eDamage')).toBe(true)

    // eEcon appears, but as a verification of named cells rather than a sweep
    // of an area — the entry has to say which, and its window names the cells.
    const eEcon = SWEPT.tabs.find(tab => tab.tab === 'eEcon')
    expect(eEcon?.verification).toBeTruthy()
    expect(eEcon?.regions.some(region => region.contains.includes('NOT SWEPT'))).toBe(true)
  })

  it('records eRegen as a mirror rather than as a tab with no controls', () => {
    // "No controls found" and "the controls belong to another tab" are
    // different results, and only the second explains why the panel looks full.
    const eRegen = SWEPT.tabs.find(tab => tab.tab === 'eRegen')
    expect(eRegen).toBeTruthy()
    expect(eRegen?.regions.some(region => region.contains.includes('mirror'))).toBe(true)

    const graph = loadEpGraph()
    expect(graph.nodes['display.eRegen.mirroredPanel']).toBeTruthy()
    expect(Object.keys(graph.nodes).some(id => id.startsWith('control.eRegen.'))).toBe(false)
  })

  it('records the eEcon check as a clean result, not an absent one', () => {
    // The oldest wiring in the graph, inherited and never verified. Three
    // different cell shapes had already produced wrong models elsewhere today,
    // so "nothing found here" is only worth anything if it says what was
    // looked at: eight cells, formula-read, every one a literal.
    const eEcon = SWEPT.tabs.find(tab => tab.tab === 'eEcon')
    expect(eEcon?.verification).toContain('literal')
    expect(eEcon?.window).toContain('AU3:AZ50')

    const checked = (eEcon?.regions ?? []).reduce((sum, region) => sum + region.controls, 0)
    expect(checked).toBe(9)

    const graph = loadEpGraph()
    for (const id of [
      'control.eEcon.hideNonUnlockedLabs', 'control.eEcon.showLabs', 'control.eEcon.showEnhancements',
      'control.eEcon.hideRetroactiveDiscountLabs', 'control.eEcon.keepUwCdSynced',
      'control.eEcon.cardsMaster', 'control.eEcon.perksMaster', 'control.eEcon.costMode',
    ]) {
      expect(graph.nodes[id], id).toBeTruthy()
      expect(graph.nodes[id]?.type, id).toBe('control')
    }
  })

  it('every entry says what it did not cover', () => {
    // The habit that matters more than the coverage. An entry claiming only
    // what it read is checkable; one that stops at what it found reads as
    // completeness.
    for (const tab of SWEPT.tabs) {
      const declaresGap = tab.regions.some(region =>
        region.contains.includes('NOT SWEPT') || region.contains.includes('mirror'))
      expect(declaresGap, tab.tab).toBe(true)
    }
  })

  it('models both Rows Calculated controls, at the cells that hold values', () => {
    // The same control on two tabs, label ABOVE the value on both: eDamage
    // AI20/AI21 and eHP AJ21/AJ22. input_ranges cites both correctly. The
    // opposite pairing does exist on this sheet — eDamage PS Beta Testing has
    // its label BELOW its value — which is why the pairing is read per cell.
    const graph = loadEpGraph()
    expect(graph.nodes['control.eDamage.rowsCalculated']?.sourceCells[0]?.cell).toBe('AI21')
    expect(graph.nodes['control.eHP.rowsCalculated']?.sourceCells[0]?.cell).toBe('AJ22')
  })

  it('records that a visual pass found what the window missed', () => {
    // The eEcon window started at row 14 and a block sits at rows 3-13. It was
    // found by opening the sheet and looking, not by any read. The entry says
    // so, because "swept" has to mean something a later reader can check.
    const eEcon = SWEPT.tabs.find(tab => tab.tab === 'eEcon')
    expect(eEcon?.window).toContain('AJ3:AK13')
    expect(eEcon?.regions.some(region => region.contains.includes('VISUAL'))).toBe(true)
  })

  it('lists every tab the graph reads from', () => {
    // DERIVED, so it cannot go stale quietly. Modelling a cell on a tab that
    // is neither swept nor recorded as a satellite fails here — which is the
    // check that would have existed had anyone known the satellites read
    // controls at all.
    const graph = loadEpGraph()
    const referenced = new Set<string>()
    for (const node of Object.values(graph.nodes)) {
      for (const cell of node.sourceCells ?? []) referenced.add(cell.sheet)
    }
    for (const edge of graph.edges) {
      for (const cell of edge.evidence?.sourceCells ?? []) referenced.add(cell.sheet)
    }

    const accounted = new Set([
      ...SWEPT.tabs.map(tab => tab.tab),
      ...SWEPT.satelliteTabs.map(tab => tab.tab),
      // Not a planner tab and not a satellite: the IDS import the whole
      // workbook reads from. Named rather than filtered out silently.
      '_IDS',
    ])
    expect([...referenced].filter(tab => !accounted.has(tab)).sort()).toEqual([])
  })

  it('records the satellites as unswept, and says which controls they read', () => {
    // The five controls that closed last were ALL read on a satellite. So the
    // interesting number here is not what these tabs contain, it is that
    // nobody has enumerated them: four of the seven have been read at named
    // cells only, and three have not been opened.
    expect(SWEPT.satelliteTabs.length).toBe(7)
    for (const tab of SWEPT.satelliteTabs) {
      expect(tab.notSwept.length, tab.tab).toBeGreaterThan(0)
    }

    // All seven have now been opened. The three that had not been -- eDamage
    // Keys, eHP Stone, eHP Coins -- were swept on 2026-08-19 and every one
    // read at least one control, which is what the entry for an unopened tab
    // had predicted. Kept as an assertion rather than deleted: if a satellite
    // is ever added, it starts unread and has to say so.
    const untouched = SWEPT.satelliteTabs.filter(tab => tab.cellsRead === 'none')
    expect(untouched.map(tab => tab.tab)).toEqual([])
    for (const tab of SWEPT.satelliteTabs) {
      expect(tab.cellsRead, tab.tab).toMatch(/[A-Z]+\d+/)
      expect(tab.anchors.length, tab.tab).toBeGreaterThan(0)
      expect(tab.readsControls.length, tab.tab).toBeGreaterThan(0)
    }

    // Every control the graph attributes to a satellite is claimed by exactly
    // one satellite entry, so the record and the graph cannot drift apart.
    const graph = loadEpGraph()
    const satelliteSheets = new Set(SWEPT.satelliteTabs.map(tab => tab.tab))
    const readFromSatellites = new Set(
      graph.edges
        .filter(edge => (edge.evidence?.sourceCells ?? []).some(c => satelliteSheets.has(c.sheet)))
        .map(edge => edge.to)
        .filter(id => id.startsWith('control.')),
    )
    const claimed = new Set(
      SWEPT.satelliteTabs.flatMap(tab => tab.readsControls).map(cell => {
        const [sheet] = cell.split('!')
        return sheet
      }),
    )
    expect(readFromSatellites.size).toBeGreaterThanOrEqual(5)
    expect([...claimed].sort()).toEqual(['eDamage', 'eEcon', 'eHP'])
  })

  it('records the offset mirror as an offset, not as a mirror', () => {
    // eEcon Discount spills from eEcon!AM3 into AL3, so its AY is eEcon's AZ.
    // Every other mirror on this sheet is column-aligned, which is exactly why
    // one that is not has to be stated rather than assumed.
    const offsets = SWEPT.satelliteTabs.filter(tab => tab.offset.includes('ONE COLUMN'))
    expect(offsets.map(tab => tab.tab)).toEqual(['eEcon Discount'])
    expect(offsets[0]?.anchors.join(' ')).toContain('={eEcon!AM3:AZ50}')
  })
})

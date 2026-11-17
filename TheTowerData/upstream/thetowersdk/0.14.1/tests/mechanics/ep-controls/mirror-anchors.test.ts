import { describe, expect, it } from 'vitest'

import sweptRaw from '../../../src/mechanics/ep-controls/data/swept-regions.v1.json'

/**
 * The spill anchors, DERIVED rather than listed.
 *
 * `mirror_map` on the MCP resolves a satellite-tab cell to the planner cell it
 * mirrors, and it reads this list. The tool exists because a formula-mode read
 * of a spilled band comes back empty, so a `$AY$24` reference on a satellite
 * reads as pointing at nothing — which is how five controls stayed unwired
 * through an entire port.
 *
 * ## Why the list is generated
 *
 * It used to be hand-kept, with a prose copy beside it and a test asserting the
 * two agreed. They did agree, and they were both wrong: `eEcon Discount` was
 * recorded with one anchor and has four, and `eDamage Stone!BC3` was recorded
 * at a cell that has no formula — the real anchor is `BB3`. Two hand-written
 * copies of the same fact can only ever confirm each other.
 *
 * `scripts/effective-paths/scan-mirror-anchors.mjs` now reads every cell of
 * every tab in formula mode and takes the anchors the sheet actually has: 46,
 * against 15 recorded. Re-run it after a sheet version bump; it is idempotent.
 *
 * What is asserted here is therefore not "the list is complete" — the scan owns
 * that — but the properties a consumer depends on.
 */
interface Anchor { tab: string, anchor: string, source: string, window: string }
interface SatelliteTab {
  tab: string
  anchors: string[]
  mirrorsFrom: string
  offset: string
  levelSource: string
}
interface Swept { satelliteTabs: SatelliteTab[], mirrorAnchors: Anchor[], mirrorAnchorNote: string }

const SWEPT = sweptRaw as unknown as Swept

const PLANNER_TABS = ['eHP', 'eDamage', 'eEcon']

function columnIndex(letters: string): number {
  return [...letters].reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0)
}

function columnName(index: number): string {
  let out = ''
  for (let i = index; i > 0; i = Math.floor((i - 1) / 26)) {
    out = String.fromCharCode(65 + ((i - 1) % 26)) + out
  }
  return out
}

function split(cell: string): { col: number, row: number } {
  const m = /^([A-Z]{1,3})(\d{1,4})$/.exec(cell)
  if (!m) throw new Error(`not a cell: ${cell}`)
  return { col: columnIndex(m[1]), row: Number(m[2]) }
}

/** Column offset between where a mirror lands and where it comes from. */
function offsetOf(a: Anchor): number {
  return split(a.window.split(':')[0]).col - split(a.anchor).col
}

/** The same arithmetic `mirror_map` runs, so the tool's answers are testable. */
function resolve(tab: string, cell: string): string[] {
  const target = split(cell)
  return SWEPT.mirrorAnchors
    .filter(a => a.tab === tab)
    .flatMap((a) => {
      const anchor = split(a.anchor)
      const [from, to] = a.window.split(':').map((part) => {
        // An open-ended window like `AL149:AM` has no end row.
        const m = /^([A-Z]{1,3})(\d{1,4})?$/.exec(part)!
        return { col: columnIndex(m[1]), row: m[2] ? Number(m[2]) : Number.MAX_SAFE_INTEGER }
      })
      const dCol = target.col - anchor.col
      const dRow = target.row - anchor.row
      if (dCol < 0 || dRow < 0) return []
      if (dCol > to.col - from.col || dRow > to.row - from.row) return []
      return [`${a.source}!${columnName(target.col + offsetOf(a))}${from.row + dRow}`]
    })
}

describe('mirror anchors', () => {
  it('is generated, and says so', () => {
    // If this ever reads like a hand-kept list again, the failure mode that
    // produced 15-of-46 is back.
    expect(SWEPT.mirrorAnchorNote).toContain('DERIVED')
    expect(SWEPT.mirrorAnchorNote).toContain('scan-mirror-anchors')
    expect(SWEPT.mirrorAnchors.length).toBeGreaterThanOrEqual(46)
  })

  it('finds offsets to be the norm, not the exception', () => {
    // TWICE CORRECTED, and the second correction is the interesting one.
    //
    // First: the hand-kept record named `eDamage Stone!BC3` as an offset
    // mirror. There is no formula at BC3 — the anchor is BB3, and it is
    // aligned. Recorded from a ragged array read, off by one column.
    //
    // Second, and larger: I then described eEcon Discount as "the one offset
    // mirror". Scanning the workbook says 30 of 46 anchors are offset, by as
    // much as 36 columns. Alignment is the special case. `mirror_map` has to do
    // arithmetic for every lookup, not just for one tab that was called out.
    const offset = SWEPT.mirrorAnchors.filter(a => offsetOf(a) !== 0)
    expect(offset.length).toBeGreaterThanOrEqual(30)
    expect(Math.max(...offset.map(a => Math.abs(offsetOf(a))))).toBeGreaterThanOrEqual(36)

    // The cell that was wrong is now right.
    expect(SWEPT.mirrorAnchors.some(a => a.tab === 'eDamage Stone' && a.anchor === 'BC3')).toBe(false)
    expect(SWEPT.mirrorAnchors.some(a => a.tab === 'eDamage Stone' && a.anchor === 'BB3')).toBe(true)

    // eEcon Discount is still worth pinning: it is the only satellite whose
    // CONTROL PANEL is offset, which is what made a plausible-looking cell
    // reference resolve to the wrong control rather than to nothing at all.
    const panel = SWEPT.mirrorAnchors.find(a => a.tab === 'eEcon Discount' && a.anchor === 'AL3')!
    expect(offsetOf(panel)).toBe(1)
    for (const tab of ['eDamage Stone', 'eHP Stone', 'eHP Coins', 'eEcon Stones']) {
      const panels = SWEPT.mirrorAnchors.filter(
        a => a.tab === tab && /^(AT12|AL3|AM3)$/.test(a.anchor))
      expect(panels.length, `${tab} panel anchor`).toBeGreaterThan(0)
      for (const p of panels) expect(offsetOf(p), `${tab}!${p.anchor}`).toBe(0)
    }
  })

  it('finds that the planner tabs mirror the satellites BACK', () => {
    // The direction I had in my head was one-way: planner computes, satellite
    // reads. It is not. `eDamage!N3 = ={eDamage Stone!C3:H}` — the SATELLITE
    // computes the path table and the planner DISPLAYS it. Every planner tab
    // does this for each of its satellites.
    //
    // This matters for a port: "the eDamage path" is computed on eDamage Stone,
    // Coins and Keys, not on eDamage.
    const backwards = SWEPT.mirrorAnchors.filter(a => PLANNER_TABS.includes(a.tab))
    expect(backwards.length).toBeGreaterThanOrEqual(10)
    for (const anchor of backwards) {
      expect(PLANNER_TABS, `${anchor.tab}!${anchor.anchor} sources from a planner tab`)
        .not.toContain(anchor.source)
    }
  })

  it('gives every satellite at least one anchor', () => {
    for (const tab of SWEPT.satelliteTabs) {
      expect(
        SWEPT.mirrorAnchors.some(a => a.tab === tab.tab),
        `${tab.tab} reads controls but has no anchor`,
      ).toBe(true)
      // and the prose is generated from the same scan, so it cannot drift
      expect(tab.anchors.length).toBe(SWEPT.mirrorAnchors.filter(a => a.tab === tab.tab).length)
    }
  })

  it('resolves the cells that were actually got wrong', () => {
    // The retraction this whole apparatus exists to prevent.
    expect(resolve('eEcon Discount', 'AY14')).toEqual(['eEcon!AZ14'])
    // and the cell in the same formula that confirms the offset is real
    expect(resolve('eEcon Discount', 'AY11')).toEqual(['eEcon!AZ11'])
    // aligned mirrors resolve to themselves
    expect(resolve('eDamage Stone', 'AY24')).toContain('eDamage!AY24')
    expect(resolve('eEcon Stones', 'AZ18')).toContain('eEcon!AZ18')
    // a native cell resolves to NOTHING rather than to a plausible guess
    expect(resolve('eDamage Stone', 'BO5')).toEqual([])
  })

  it('records how each satellite gets its levels, because it is never the same way twice', () => {
    // Six mechanisms across seven tabs: a two-character string parse, a direct
    // mirrored cell, a DIVISION of a stat by its per-level step, a cross-tab
    // read of the Master Sheet, a cross-tab read into the source tab's calc
    // row, and function calls. "The level column" is not one thing, and a port
    // that writes one reader for all of them is wrong six ways.
    for (const tab of SWEPT.satelliteTabs) {
      expect(tab.levelSource, `${tab.tab} has no recorded level source`).toBeTruthy()
    }
    const sources = SWEPT.satelliteTabs.map(t => t.levelSource)
    expect(sources.filter(s => s.includes('VALUE(LEFT'))).toHaveLength(1)
    expect(sources.filter(s => s.includes('DIVISION'))).toHaveLength(1)
    expect(sources.filter(s => s.includes('Master Sheet'))).toHaveLength(1)
    expect(new Set(sources).size).toBeGreaterThanOrEqual(5)
  })
})

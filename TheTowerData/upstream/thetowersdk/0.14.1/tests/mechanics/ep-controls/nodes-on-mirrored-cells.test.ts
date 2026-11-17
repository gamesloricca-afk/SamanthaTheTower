import { describe, expect, it } from 'vitest'

import { loadEpGraph } from '../../../src/mechanics/ep-graph'
import sweptRaw from '../../../src/mechanics/ep-controls/data/swept-regions.v1.json'

/**
 * No graph node may sit on a mirrored cell without saying that it does.
 *
 * A cell inside a spill window holds another tab's value. Modelling one as if
 * it belonged to the tab it appears on attributes a satellite's number to the
 * planner — the same confusion that had five controls looking unwired, pointed
 * the other way.
 *
 * This is only checkable now that the anchors are scanned rather than listed
 * (`scripts/effective-paths/scan-mirror-anchors.mjs`): against the hand-kept
 * list of 15 it would have passed by missing two thirds of the windows.
 *
 * Three nodes DO sit on mirrored cells, deliberately, and each one exists to
 * model the mirror itself. They are named below, so a fourth has to be argued
 * for rather than merely added.
 */
interface Anchor { tab: string, anchor: string, source: string, window: string }
const ANCHORS = (sweptRaw as unknown as { mirrorAnchors: Anchor[] }).mirrorAnchors

const DELIBERATE = new Set([
  // The offset mirror, modelled as a hop so the translation is visible.
  'display.eEconDiscount.mirroredHideRetroactive',
  // eHP AH6 is eRegen J6 — the node's whole subject is that import.
  'display.eHP.regenImport',
  // The eRegen panel, which is eHP's panel and nothing of its own.
  'display.eRegen.mirroredPanel',
])

function columnIndex(letters: string): number {
  return [...letters].reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0)
}

function split(cell: string): { col: number, row: number } | null {
  const m = /^([A-Z]{1,3})(\d{1,4})?$/.exec(cell)
  if (!m) return null
  return { col: columnIndex(m[1]), row: m[2] ? Number(m[2]) : Number.MAX_SAFE_INTEGER }
}

/** Which tabs' data actually lives at `sheet!cell`, if any. */
function mirrorSourcesFor(sheet: string, cell: string): string[] {
  const target = split(cell)
  if (!target) return []
  return ANCHORS.filter((a) => {
    if (a.tab !== sheet) return false
    const anchor = split(a.anchor)
    const [from, to] = a.window.split(':').map(split)
    if (!anchor || !from || !to) return false
    const dCol = target.col - anchor.col
    const dRow = target.row - anchor.row
    return dCol >= 0 && dRow >= 0
      && dCol <= to.col - from.col
      && dRow <= to.row - from.row
  }).map(a => a.source)
}

describe('graph nodes versus mirrored cells', () => {
  const graph = loadEpGraph()

  it('models no cell as native when it holds another tab\'s value', () => {
    const offenders: string[] = []
    for (const [id, node] of Object.entries(graph.nodes)) {
      if (DELIBERATE.has(id)) continue
      for (const cell of node.sourceCells ?? []) {
        const sources = mirrorSourcesFor(cell.sheet, cell.cell)
        if (sources.length) {
          offenders.push(`${id} at ${cell.sheet}!${cell.cell} is mirrored from ${sources.join(', ')}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('the deliberate three really are on mirrored cells', () => {
    // Otherwise the allow-list quietly becomes a list of names nobody checks,
    // and a node that moved off its mirror keeps an exemption it no longer
    // needs.
    for (const id of DELIBERATE) {
      const node = graph.nodes[id]
      expect(node, id).toBeTruthy()
      const mirrored = (node!.sourceCells ?? [])
        .some(c => mirrorSourcesFor(c.sheet, c.cell).length > 0)
      expect(mirrored, `${id} is exempted but sits on no mirror`).toBe(true)
    }
  })
})

/**
 * Join coverage: sheet-graph required leaves ↔ ep-graph byCell.
 *
 * sheet-graph is the mechanical formula DAG; ep-graph is the curated relation
 * SoT. Every required leaf cellKey must resolve to ≥1 ep-graph node (join by
 * `tab!cell`). PRESETS/ids_derived masters may be allowlisted.
 *
 * Extending relations further = `feeds` / control.* edges via ep_graph_mutate,
 * not a new disconnected graph family.
 */
import { describe, expect, it } from 'vitest'

import { buildEpGraphIndex, loadEpGraph } from '../../../src/mechanics/ep-graph'
import {
  epSheetGraphNodes,
  epSheetGraphRequiredInputLeaves,
} from '../../../src/mechanics/ep-controls'

/** Leaves that are IDS/PRESETS spill masters — not free panel toggles. */
const JOIN_ALLOWLIST = new Set([
  'eEcon!AZ4',
  'eHP!AX3',
  'eDamage!AX12',
])

describe('sheet-graph ↔ ep-graph join coverage', () => {
  it('joins every required INPUT_LEAF cell to an ep-graph node', () => {
    const index = buildEpGraphIndex(loadEpGraph())
    const nodes = epSheetGraphNodes()
    const required = epSheetGraphRequiredInputLeaves().filter(id => !JOIN_ALLOWLIST.has(id))

    const missing = required
      .filter(id => !(index.byCell[id]?.length))
      .map(id => `${id} ${nodes[id]?.label ?? ''}`.trim())

    expect(missing).toEqual([])
    expect(required.length).toBeGreaterThan(40)
  })
})

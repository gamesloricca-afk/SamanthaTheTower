import { describe, expect, it } from 'vitest'
import { loadEpGraph, validateEpGraph } from '../../../src/mechanics/ep-graph'
import {
  epControlHasAffectsPath,
  epDependsOnCycles,
  epSatelliteReadsMissingFeeds,
  epTabBoundControlsMissingAffectsPath,
} from '../../../src/mechanics/ep-controls/control-relations'

describe('ep-graph cycle detection ignores feeds↔reads pairs', () => {
  it('reports no 2-cycles (feeds are skipped in the DFS)', () => {
    const graph = loadEpGraph()
    const { errors, warnings } = validateEpGraph(graph)
    expect(errors).toEqual([])
    const twoCycles = warnings.filter((w) => {
      const parts = w.replace(/^cycle involving /, '').split(' -> ')
      return parts.length === 3 && parts[0] === parts[2]
    })
    expect(twoCycles, twoCycles.join('\n')).toEqual([])
  })
})

describe('ep-graph dependsOn + affectsPath', () => {
  const graph = loadEpGraph()

  it('records dependsOn for eDamage presetsMaster → runType', () => {
    const hit = graph.edges.find(e =>
      e.kind === 'dependsOn'
      && e.from === 'display.eDamage.presetsMaster'
      && e.to === 'control.eDamage.runType')
    expect(hit, 'presetsMaster dependsOn runType').toBeTruthy()
  })

  it('gives Hide UW Cooldown an affectsPath into the damage path hub', () => {
    const hit = graph.edges.find(e =>
      e.kind === 'affectsPath'
      && e.from === 'control.eDamage.hideUwCooldown'
      && e.to === 'path.eDamage.itemName')
    expect(hit).toBeTruthy()
  })

  it('covers every control node with at least one affectsPath', () => {
    const controls = Object.values(graph.nodes).filter(n => n.type === 'control')
    const missing = controls
      .map(c => c.id)
      .filter(id => !epControlHasAffectsPath(id, graph))
    expect(missing, missing.join('\n')).toEqual([])
  })

  it('keeps the dependsOn subgraph acyclic', () => {
    const cycles = epDependsOnCycles(graph)
    expect(cycles, cycles.join('\n')).toEqual([])
  })
})

describe('ControlRelation compiler gates', () => {
  it('requires affectsPath for every tab-placed bound sheet-AST control', () => {
    const missing = epTabBoundControlsMissingAffectsPath()
    expect(missing, missing.join('\n')).toEqual([])
  })

  it('requires feeds for every satellite readsControls cell', () => {
    const missing = epSatelliteReadsMissingFeeds()
    expect(missing, missing.join('\n')).toEqual([])
  })

  it('feeds Hide Retroactive Discount Labs through the Discount mirror hop', () => {
    const graph = loadEpGraph()
    const hit = graph.edges.find(e =>
      e.kind === 'feeds'
      && e.from === 'control.eEcon.hideRetroactiveDiscountLabs'
      && e.to === 'hide.eEconDiscount.retroactiveLabColumn')
    expect(hit, 'feeds via derives hop from mirrored AY14').toBeTruthy()
  })
})

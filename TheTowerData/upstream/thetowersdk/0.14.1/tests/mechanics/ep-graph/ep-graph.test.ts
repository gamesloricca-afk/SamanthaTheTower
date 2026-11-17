import { describe, expect, it } from 'vitest'
import {
  applyEpGraphMutations,
  buildEpGraphIndex,
  filterEpGraph,
  loadEpGraph,
  renderEpGraphMermaidSlices,
  renderEpRelationsNarrative,
  validateEpGraph,
} from '../../../src/mechanics/ep-graph'

describe('ep-graph', () => {
  it('loads and validates the seeded eEcon graph', () => {
    const graph = loadEpGraph()
    expect(graph.schemaVersion).toBe(1)
    expect(graph.contentVersion).toBeGreaterThanOrEqual(1)
    expect(Object.keys(graph.nodes).length).toBeGreaterThan(10)
    expect(validateEpGraph(graph).errors).toEqual([])
  })

  it('rejects a mutation without evidence', () => {
    const graph = loadEpGraph()
    const result = applyEpGraphMutations(graph, [{
      op: 'addNode',
      node: {
        id: 'control.eEcon.fake',
        family: 'eEcon',
        type: 'control',
        label: 'Fake',
        sourceCells: [{ sheet: 'eEcon', cell: 'ZZ99', kind: 'control' }],
        status: 'researching',
      },
      reason: 'test',
      evidence: {},
    }])
    expect(result.applied).toBe(0)
    expect(result.issues.length).toBeGreaterThan(0)
  })

  it('applies an atomic addEdge and bumps contentVersion', () => {
    const graph = loadEpGraph()
    const before = graph.contentVersion
    const result = applyEpGraphMutations(graph, [{
      op: 'addEdge',
      edge: {
        id: 'e.test.reads',
        from: 'control.eEcon.showLabs',
        to: 'control.eEcon.showEnhancements',
        kind: 'reads',
        evidence: {
          sourceCells: [{ sheet: 'eEcon', cell: 'AZ12', kind: 'control' }],
        },
      },
      reason: 'unit test edge',
    }])
    expect(result.issues).toEqual([])
    expect(result.applied).toBe(1)
    expect(result.contentVersion).toBe(before + 1)
    expect(result.graph.edges.some(e => e.id === 'e.test.reads')).toBe(true)
  })

  it('indexes cells for Show Enhancements', () => {
    const index = buildEpGraphIndex(loadEpGraph())
    expect(index.byCell['eEcon!AZ13']).toContain('control.eEcon.showEnhancements')
    expect(index.byLambda.WSPUTILITY_TOTAL_COINS_INVESTED?.length).toBeGreaterThan(0)
  })

  it('filters by family', () => {
    const sub = filterEpGraph(loadEpGraph(), { family: 'eEcon' })
    expect(Object.values(sub.nodes).every(n => n.family === 'eEcon')).toBe(true)
  })

  it('renders mermaid slices and narrative without throwing', () => {
    const graph = loadEpGraph()
    const slices = renderEpGraphMermaidSlices(graph)
    expect(slices.some(s => s.name === 'eEcon')).toBe(true)
    expect(slices.some(s => s.name === 'eEcon.controls')).toBe(true)
    const narrative = renderEpRelationsNarrative(graph)
    expect(narrative).toContain('Do not hand-edit')
    expect(narrative).toContain('control.eEcon.showEnhancements')
  })

  it('forbids invented formulas without formulaSource', () => {
    const graph = loadEpGraph()
    const result = applyEpGraphMutations(graph, [{
      op: 'addNode',
      node: {
        id: 'hide.eEcon.fake',
        family: 'eEcon',
        type: 'hide',
        label: 'fake',
        sourceCells: [{ sheet: 'eEcon', cell: 'ZZ1', kind: 'hide' }],
        formula: '1+1',
        status: 'researching',
      },
      reason: 'should fail',
      evidence: { sourceCells: [{ sheet: 'eEcon', cell: 'ZZ1', kind: 'hide' }] },
    }])
    expect(result.applied).toBe(0)
  })
})

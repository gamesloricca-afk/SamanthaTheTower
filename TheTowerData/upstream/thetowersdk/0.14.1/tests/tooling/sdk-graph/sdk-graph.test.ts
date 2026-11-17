import { describe, expect, it } from 'vitest'
import {
  buildSdkGraphContextPack,
  buildSdkGraphIndex,
  filterSdkGraph,
  loadSdkGraph,
  validateSdkGraph,
} from '../../../tooling/sdk-graph'

describe('sdk-graph', () => {
  it('merges core + EP module without collisions', () => {
    const graph = loadSdkGraph()
    expect(Object.keys(graph.nodes).length).toBeGreaterThan(20)
    expect(graph.nodes['control.eEcon.showEnhancements']?.family).toBe('ep.eEcon')
    expect(graph.nodes['workshop.enhancement.utilitySpend']?.family).toBe('workshop')
    expect(validateSdkGraph(graph).errors).toEqual([])
  })

  it('indexes wiki and code symbols', () => {
    const index = buildSdkGraphIndex(loadSdkGraph())
    expect(index.byWiki['Workshop Enhancement/Utility/Coin Bonus']?.length).toBeGreaterThan(0)
    expect(index.bySymbol.workshopEnhancementCoinsInvested?.length).toBeGreaterThan(0)
    expect(index.byModule.ep?.length).toBeGreaterThan(10)
    expect(index.byModule.core?.length).toBeGreaterThan(0)
  })

  it('builds a context pack for MCP mount', () => {
    const graph = loadSdkGraph()
    const pack = buildSdkGraphContextPack(graph, buildSdkGraphIndex(graph), ['ep.eEcon', 'workshop'])
    expect(pack.nodes.every(n => n.family === 'ep.eEcon' || n.family === 'workshop')).toBe(true)
    expect(pack.edges.length).toBeGreaterThan(0)
  })

  it('filters by module', () => {
    const epOnly = filterSdkGraph(loadSdkGraph(), { module: 'ep' })
    expect(Object.values(epOnly.nodes).every(n => n.module === 'ep')).toBe(true)
  })
})

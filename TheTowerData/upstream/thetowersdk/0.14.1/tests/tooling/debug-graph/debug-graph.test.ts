import { describe, expect, it } from 'vitest'
import {
  buildDebugGraphIndex,
  loadDebugGraph,
  validateDebugGraph,
} from '../../../tooling/debug-graph'
import { loadSdkGraphWithTrust } from '../../../tooling/sdk-graph'
import { debugSymbolId } from '../../../tooling/debug-graph/schema'

describe('debug-graph', () => {
  it('loads and validates', () => {
    const graph = loadDebugGraph()
    expect(validateDebugGraph(graph).errors).toEqual([])
    expect(Object.keys(graph.nodes).length).toBeGreaterThan(100)
  })

  it('indexes exports', () => {
    const index = buildDebugGraphIndex(loadDebugGraph())
    expect(Object.keys(index.byExport).length).toBeGreaterThan(50)
  })

  it('covers every mechanics codeSymbol', () => {
    const dbg = loadDebugGraph()
    const { graph } = loadSdkGraphWithTrust({ mode: 'degraded' })
    for (const node of Object.values(graph.nodes)) {
      for (const sym of node.codeSymbols ?? []) {
        expect(dbg.nodes[debugSymbolId(sym)], `${node.id} → ${sym}`).toBeTruthy()
      }
    }
  })
})

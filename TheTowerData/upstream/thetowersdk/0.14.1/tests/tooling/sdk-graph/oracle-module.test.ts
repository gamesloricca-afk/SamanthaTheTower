import { describe, expect, it } from 'vitest'

import { GAME_KNOWLEDGE } from '../../../src/knowledge'
import { loadSdkGraphWithTrust } from '../../../tooling/sdk-graph'
import {
  ORACLE_NODE_ID_PREFIX,
  oracleGraphToSdkModule,
  oracleModuleNodeCount,
  sdkNodeIdForOracleNode,
} from '../../../tooling/sdk-graph/oracle-module'

/**
 * The join between the knowledge oracle and the SDK graph.
 *
 * Before this, the trust and coverage layer could see 24 nodes while the oracle
 * held 306. Everything below exists to stop the two drifting apart again — the
 * count is derived from the oracle rather than written down, so adding a
 * compartment node cannot leave the projection behind.
 */
describe('oracle module', () => {
  it('carries every oracle node, counted from the oracle itself', () => {
    const { nodes } = oracleGraphToSdkModule()
    const fromOracle = GAME_KNOWLEDGE.compartments.reduce((sum, c) => sum + c.nodes.length, 0)

    expect(Object.keys(nodes).length).toBe(fromOracle)
    expect(oracleModuleNodeCount()).toBe(fromOracle)
    expect(fromOracle).toBeGreaterThan(200)
  })

  it('namespaces every id so nothing can collide with core or ep', () => {
    // `mergeSdkGraphs` throws on a cross-module id collision, so this is what
    // keeps the merge from becoming a load-time failure the day an oracle node
    // is named after a spreadsheet node.
    const { nodes } = oracleGraphToSdkModule()
    for (const [id, node] of Object.entries(nodes)) {
      expect(id.startsWith(ORACLE_NODE_ID_PREFIX)).toBe(true)
      expect(id).toBe(sdkNodeIdForOracleNode(node.oracleNodeId as string))
      expect(node.module).toBe('oracle')
    }
  })

  it('every node keeps a pointer back to the claim it came from', () => {
    // The projection is read-only, so `oracleNodeId` is the only way back to
    // the sources, and it is also what satisfies the provenance requirement.
    const { nodes } = oracleGraphToSdkModule()
    const oracleIds = new Set(
      GAME_KNOWLEDGE.compartments.flatMap(c => c.nodes.map(n => n.id)),
    )

    for (const node of Object.values(nodes)) {
      expect(node.oracleNodeId).toBeTruthy()
      expect(oracleIds.has(node.oracleNodeId as string)).toBe(true)
    }
  })

  it('emits no edges, and says so rather than emitting wrong ones', () => {
    // Oracle edge kinds do not map onto SDK edge kinds. `independentOf` records
    // a relationship that does NOT exist; there is no SDK kind for that, and
    // the nearest one would assert its opposite.
    const { edges } = oracleGraphToSdkModule()
    expect(edges).toEqual([])
  })

  it('emits no codeSymbols, because the debug graph does not know them', () => {
    // `implementedBy` names real exports, but the debug graph is narrower than
    // the oracle and `code-symbol-missing-debug` is an error-severity
    // invariant. Emitting them would fail every strict load.
    const { nodes } = oracleGraphToSdkModule()
    for (const node of Object.values(nodes)) {
      expect(node.codeSymbols).toEqual([])
    }
  })

  it('loads into the merged graph in strict mode with no invariant errors', () => {
    const { graph, report, trust } = loadSdkGraphWithTrust({ mode: 'strict' })
    const byModule: Record<string, number> = {}
    for (const node of Object.values(graph.nodes)) {
      byModule[node.module] = (byModule[node.module] ?? 0) + 1
    }

    expect(trust).toBe('ok')
    expect(report.invariants.filter(i => i.severity === 'error')).toEqual([])
    expect(byModule.oracle).toBe(oracleModuleNodeCount())
    expect(byModule.core).toBeGreaterThan(0)
    expect(byModule.ep).toBeGreaterThan(0)
  })

  it('is the largest module in the graph, which was the point', () => {
    // Stated as "largest", not as a share. A share falls when the ep module
    // grows, so it would read as a regression every time the EP port makes
    // progress — the join is about the oracle being visible at all, not about
    // it staying dominant.
    const { graph } = loadSdkGraphWithTrust({ mode: 'strict' })
    const byModule: Record<string, number> = {}
    for (const node of Object.values(graph.nodes)) {
      byModule[node.module] = (byModule[node.module] ?? 0) + 1
    }

    const largest = Math.max(...Object.values(byModule))
    expect(byModule.oracle).toBe(largest)
    expect(byModule.oracle).toBeGreaterThan(250)
  })
})

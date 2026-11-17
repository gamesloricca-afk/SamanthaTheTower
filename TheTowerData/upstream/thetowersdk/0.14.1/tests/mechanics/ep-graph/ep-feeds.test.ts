/**
 * Every control that something `reads` must `feeds` that consumer.
 *
 * `feeds` is the ControlRelation walk direction (control → consumer). It is
 * derived from evidenced `reads`→control edges — never invented by hand.
 */
import { describe, expect, it } from 'vitest'
import { loadEpGraph } from '../../../src/mechanics/ep-graph'

describe('ep-graph feeds ControlRelation edges', () => {
  const graph = loadEpGraph()

  it('defines the feeds edge kind', () => {
    expect(graph.edges.some(e => e.kind === 'feeds')).toBe(true)
  })

  it('mirrors every reads→control edge as feeds control→consumer', () => {
    const feeds = new Set(
      graph.edges.filter(e => e.kind === 'feeds').map(e => `${e.from}→${e.to}`),
    )
    const missing: string[] = []
    for (const edge of graph.edges) {
      if (edge.kind !== 'reads') continue
      let controlId: string | null = null
      const direct = graph.nodes[edge.to]
      if (direct?.type === 'control') {
        controlId = edge.to
      } else {
        const derive = graph.edges.find(e =>
          e.kind === 'derives'
          && e.from === edge.to
          && graph.nodes[e.to]?.type === 'control')
        if (derive) controlId = derive.to
      }
      if (!controlId) continue
      const pair = `${controlId}→${edge.from}`
      if (!feeds.has(pair)) missing.push(`${edge.id} (${pair})`)
    }
    expect(missing).toEqual([])
  })

  it('gives every control with incoming reads at least one outgoing feeds', () => {
    const withIncomingReads = new Set(
      graph.edges
        .filter(e => e.kind === 'reads' && graph.nodes[e.to]?.type === 'control')
        .map(e => e.to),
    )
    const withOutgoingFeeds = new Set(
      graph.edges.filter(e => e.kind === 'feeds').map(e => e.from),
    )
    const missing = [...withIncomingReads].filter(id => !withOutgoingFeeds.has(id))
    expect(missing).toEqual([])
    expect(withIncomingReads.size).toBeGreaterThan(40)
  })
})

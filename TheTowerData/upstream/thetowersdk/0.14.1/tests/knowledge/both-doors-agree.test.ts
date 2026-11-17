import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { GAME_KNOWLEDGE, allNodes } from '../../src/knowledge'

/**
 * The graph must look the same whichever door you come through.
 *
 * There are two: the TypeScript API, and `knowledge-graph.v1.json` — which is what a tool in
 * another language reads, and what the WebAssembly build serves. They are built from the same
 * content, so they should answer the same questions the same way.
 *
 * They did not. `claimType` and `verification` are optional and default to `objective` and
 * `verified_here`; the emitter applied those defaults when writing the JSON and the API did not.
 * So every node in the file carried both fields while 91 nodes read through the API carried
 * neither, and `node.claimType === 'objective'` quietly dropped a third of the graph — 215 against
 * 306. Both numbers were produced by correct code reading identical content.
 *
 * A default that is written down in a comment and implemented in one of two readers is not a
 * default. It is a convention that one half of the codebase keeps.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url))
const EMITTED = path.resolve(HERE, '../../dist/knowledge/knowledge-graph.v1.json')

interface EmittedNode {
  id: string
  claimType?: string
  verification?: string
}

function emitted(): EmittedNode[] {
  return JSON.parse(readFileSync(EMITTED, 'utf8')).nodes as EmittedNode[]
}

describe.skipIf(!existsSyncSafe(EMITTED))('the API and the emitted graph agree', () => {
  const fromApi = allNodes(GAME_KNOWLEDGE)

  it('holds the same nodes', () => {
    expect(fromApi.map(node => node.id).sort()).toEqual(emitted().map(node => node.id).sort())
  })

  it('gives every node a claimType, through either door', () => {
    expect(fromApi.filter(node => node.claimType === undefined).map(node => node.id)).toEqual([])
    expect(emitted().filter(node => node.claimType === undefined).map(node => node.id)).toEqual([])
  })

  it('gives every node a verification, through either door', () => {
    expect(fromApi.filter(node => node.verification === undefined).map(node => node.id)).toEqual([])
    expect(emitted().filter(node => node.verification === undefined).map(node => node.id)).toEqual([])
  })

  it('counts each claimType and verification identically', () => {
    const tally = (nodes: { claimType?: string, verification?: string }[], field: 'claimType' | 'verification') => {
      const counts: Record<string, number> = {}
      for (const node of nodes) counts[node[field] ?? 'absent'] = (counts[node[field] ?? 'absent'] ?? 0) + 1
      return counts
    }

    expect(tally(fromApi, 'claimType')).toEqual(tally(emitted(), 'claimType'))
    expect(tally(fromApi, 'verification')).toEqual(tally(emitted(), 'verification'))
  })

  it('agrees on the same value for each individual node', () => {
    /*
     * The tallies could match while two nodes had their values swapped, which is the kind of
     * agreement that is worse than a disagreement.
     */
    const byId = new Map(emitted().map(node => [node.id, node]))
    const differing = fromApi
      .filter((node) => {
        const other = byId.get(node.id)
        return other && (other.claimType !== node.claimType || other.verification !== node.verification)
      })
      .map(node => node.id)

    expect(differing).toEqual([])
  })
})

/** The emitted graph is a build artifact; skip rather than fail when it has not been built. */
function existsSyncSafe(file: string): boolean {
  try {
    readFileSync(file)
    return true
  } catch {
    return false
  }
}

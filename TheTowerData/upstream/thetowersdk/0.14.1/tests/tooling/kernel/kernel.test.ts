import { describe, expect, it } from 'vitest'
import { loadMechanicsContext } from '../../../tooling/kernel/load'
import { validateMechanicsKernel } from '../../../tooling/kernel/validate'
import { buildMechanicsRegistry } from '../../../tooling/registry'
import { getMcpContract, MCP_TOOL_CATALOG } from '../../../tooling/mcp-contract'

describe('mechanics kernel', () => {
  it('loads a MechanicsContext with constitution + graph summaries', () => {
    const ctx = loadMechanicsContext({ includeDoctor: true })
    expect(ctx.constitution).toBe('docs/AGENT_MECHANICS_CONSTITUTION.md')
    expect(ctx.graphs.sdk.nodeCount).toBeGreaterThan(0)
    expect(ctx.graphs.ep.nodeCount).toBeGreaterThan(0)
    expect(ctx.graphs.debug.nodeCount).toBeGreaterThan(0)
    expect(ctx.graphs.save.nodeCount).toBeGreaterThan(0)
    expect(ctx.ok).toBe(true)
  })

  it('validateMechanicsKernel is green on current tree', () => {
    const result = validateMechanicsKernel({ includeDoctor: true })
    expect(result.ok).toBe(true)
    expect(result.trust.ok).toBe(true)
    expect(result.errors).toEqual([])
  })
})

describe('mechanics registry', () => {
  it('includes doc contracts and mcp tools', () => {
    const reg = buildMechanicsRegistry({
      includeDoctor: false,
      kind: 'docContract',
    })
    expect(reg.entries.some(e => e.id === 'doc.constitution')).toBe(true)
    expect(reg.countsByKind.docContract).toBeGreaterThan(5)
  })

  it('lists mechanic nodes from merged sdk graph', () => {
    const reg = buildMechanicsRegistry({
      includeDoctor: false,
      kind: 'mechanicNode',
      maxPerKind: 50,
    })
    expect(reg.entries.length).toBeGreaterThan(0)
    expect(reg.entries.every(e => e.kind === 'mechanicNode')).toBe(true)
  })
})

describe('mcp contract', () => {
  it('exposes categories and doctor tools', () => {
    const contract = getMcpContract()
    expect(contract.categories).toContain('kernel')
    expect(contract.categories).toContain('doctor')
    expect(contract.categories).toContain('commit')
    expect(contract.tools.some(t => t.name === 'commit_authorize')).toBe(true)
    expect(contract.tools.some(t => t.name === 'sdk_kernel_load')).toBe(true)
    expect(contract.tools.some(t => t.name === 'mcp_contract')).toBe(true)
    expect(MCP_TOOL_CATALOG.length).toBe(contract.tools.length)
  })
})

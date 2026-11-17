import { describe, expect, it } from 'vitest'
import { runMechanicsSandbox, runTowerVm } from '../../../tooling/sandbox'

describe('mechanics sandbox / tower vm', () => {
  it('runTowerVm traces kernel + decode + planner eval without inventing', () => {
    const result = runTowerVm({
      request: {
        family: 'eEcon',
        utilityLevels: { 'Cash Bonus': 3 },
      },
    })
    expect(result.ok).toBe(true)
    expect(result.traces.some(t => t.step === 'vm.kernel' && t.ok)).toBe(true)
    expect(result.traces.some(t => t.step === 'vm.planner.eval-bindings' && t.ok)).toBe(true)
    const evalTrace = result.traces.find(t => t.step === 'vm.planner.eval-bindings')
    const detail = evalTrace?.detail as { bindingCount?: number; results?: Array<{ ok: boolean }> }
    expect((detail?.bindingCount ?? 0)).toBeGreaterThanOrEqual(3)
    expect(detail?.results?.every(r => r.ok)).toBe(true)
  })

  it('sandbox mode=vm wraps runTowerVm', () => {
    const result = runMechanicsSandbox({
      request: { mode: 'vm', family: 'eEcon' },
    })
    expect(result.ok).toBe(true)
    expect(result.mode).toBe('vm')
    expect(result.traces.some(t => t.step === 'vm.run' && t.ok)).toBe(true)
  })
})

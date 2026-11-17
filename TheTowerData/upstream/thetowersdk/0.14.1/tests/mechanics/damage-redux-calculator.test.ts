import { describe, expect, it } from 'vitest'
import {
  applyDamageReduxLayerStack,
  effectiveRelativeDefenseReductionPct,
} from '../../src/mechanics/combat/damage-redux-calculator'
import { applyRelativeDefense, computeDamageReductionResult } from '../../src/mechanics/combat/damage-reduction'

describe('damage-redux-calculator', () => {
  it('uses linear defense percent capped at 98%', () => {
    expect(applyRelativeDefense(100, 98)).toBeCloseTo(2, 8)
    expect(applyRelativeDefense(100, 50)).toBeCloseTo(50, 8)
    expect(effectiveRelativeDefenseReductionPct(98)).toBeCloseTo(98, 2)
    expect(effectiveRelativeDefenseReductionPct(120)).toBeCloseTo(98, 2)
  })

  it('applies multiplicative reductions before flat defense, with sequential display steps', () => {
    const { final, steps } = applyDamageReduxLayerStack(1000, {
      useDefense: true,
      defenseRel: 98,
      useDefAbs: true,
      defenseAbsolute: 100,
      useChrono: true,
      chronoReductionPct: 25,
      useFlameBot: true,
      flameBotReductionPct: 95,
      useNmp: true,
      nmpTotalReductionPct: 50,
      usePc: true,
      pcReductionPct: 80,
      useChainThunder: true,
      chainThunderReductionPct: 30,
    })
    expect(steps.map(step => step.key)).toEqual([
      'chainThunder',
      'chrono',
      'flameBot',
      'nmp',
      'pc',
      'defenseRel',
      'defenseAbsolute',
    ])
    let expected = 1000 * 0.70 * 0.75
    expected *= 0.05
    expected *= 0.50
    expected *= 0.20
    expected = applyRelativeDefense(expected, 98)
    expected = Math.max(0, expected - 100)
    expect(final).toBeCloseTo(expected, 6)
  })

  it('matches the retained native raw-times-reductions-minus-flat vector, not post-flat mitigation', () => {
    const config = { useDefense: true, defenseRel: 50, useDefAbs: true, defenseAbsolute: 100,
      useChrono: false, chronoReductionPct: 0, useFlameBot: false, flameBotReductionPct: 0,
      useNmp: false, nmpTotalReductionPct: 0, usePc: false, pcReductionPct: 0,
      useChainThunder: true, chainThunderReductionPct: 50 }
    const result = applyDamageReduxLayerStack(1000, config)
    // Exact binary fractions: 1000 * (1-.5) * (1-.5) - 100 = 150.
    expect(result.final).toBe(150)
    expect(result.steps.map(row => row.key)).toEqual(['chainThunder', 'defenseRel', 'defenseAbsolute'])
    expect(result.steps.reduce((sum, row) => sum + row.reduced, 0)).toBe(850)
    expect(computeDamageReductionResult({ rawDamage: 1000, defenseRel: 50,
      defenseAbsolute: 100, chronoDamageReductionMult: .5 })).toBe(150)
    expect(applyDamageReduxLayerStack(100, config).final).toBe(0)
  })
})

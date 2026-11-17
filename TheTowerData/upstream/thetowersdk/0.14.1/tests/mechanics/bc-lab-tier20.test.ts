import { describe, expect, it } from 'vitest'
import {
  buildTierSkipChanceAdjustments,
  computeEffectiveEnemySkipPctWithBcLabs,
  computeElsBcSkipReductionDisplayPct,
  globalBcReductionBenefitFraction,
} from '../../src/mechanics/labs/bc-counter-labs'
import { buildStandardTierBattleConditions } from '../../src/mechanics/battle-conditions/config'
import { computeElsInRunEffectiveSkipChances } from '../../src/mechanics/modules/els-upgrade-path'

describe('tier 20 BC counter labs', () => {
  const tierBcs = buildStandardTierBattleConditions(20)
  const bcMax = { battle_condition_reduction: 10, enemy_level_skip_reduction: 10 }
  const bcZero = { battle_condition_reduction: 0, enemy_level_skip_reduction: 0 }

  it('global BC lab is 20% at level 10', () => {
    expect(globalBcReductionBenefitFraction(bcMax)).toBeCloseTo(0.2, 6)
    expect(globalBcReductionBenefitFraction(bcZero)).toBe(0)
  })

  it('ELS BC tooltip skip reduction matches in-game at level 55 with max labs', () => {
    expect(computeElsBcSkipReductionDisplayPct(55, bcMax)).toBeCloseTo(19.3, 1)
    expect(computeElsBcSkipReductionDisplayPct(55, bcZero)).toBeCloseTo(27.5, 1)
  })

  it('ELS BC tooltip skip reduction drops when counter labs increase (tier 20 wave 7324 heat level 55)', () => {
    const zero = computeElsBcSkipReductionDisplayPct(55, bcZero)
    const max = computeElsBcSkipReductionDisplayPct(55, bcMax)
    expect(max).toBeLessThan(zero)
    expect(zero).toBeCloseTo(27.5, 1)
    expect(max).toBeCloseTo(19.3, 1)
  })

  it('BC labs change effective skip at tier 20 reference build', () => {
    const levels = { attackUtilityLevel: 699, healthUtilityLevel: 699, enhancementLevel: 60 }
    const sources = {
      vaultAttackStars: 2,
      vaultHealthStars: 3,
      primaryAttackPct: 8,
      assistAttackPct: 8,
      primaryHealthPct: 8,
      assistHealthPct: 8,
      labAttackBenefitIncrease: 0.1,
      labHealthBenefitIncrease: 0.1,
    }
    const adj0 = buildTierSkipChanceAdjustments(20, bcZero, false, null, 2, [])
    const adj10 = buildTierSkipChanceAdjustments(20, bcMax, false, null, 2, [])
    const eff0 = computeElsInRunEffectiveSkipChances(levels, sources, adj0)
    const eff10 = computeElsInRunEffectiveSkipChances(levels, sources, adj10)
    expect(eff10.healthPct).not.toBe(eff0.healthPct)
    expect(eff10.healthPct).toBeCloseTo(71.15, 1)
  })

  it('BC labs change tier-adjusted skip % at high wave', () => {
    const stored = 84
    const zero = computeEffectiveEnemySkipPctWithBcLabs(stored, bcZero, 20, 6966, false, null, tierBcs)
    const max = computeEffectiveEnemySkipPctWithBcLabs(stored, bcMax, 20, 6966, false, null, tierBcs)
    expect(max).not.toBe(zero)
    expect(max).toBeGreaterThan(zero)
  })
})

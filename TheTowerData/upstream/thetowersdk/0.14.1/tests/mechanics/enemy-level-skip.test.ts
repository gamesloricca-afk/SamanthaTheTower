import { describe, expect, it } from 'vitest'
import { getBasicEnemyWaveStats } from '../../src/mechanics/enemies/wave-stats'
import {
  applyTierBattleConditionsToSkipChance,
  buildLevelSkipChanceRaw,
  computeLevelSkipChance,
  deterministicSkipLevelsFromChance,
  enemyStatLevelFromRunWave,
  estimatedEnemyStatLevelFromSkip,
  expectedEnemyStatWave,
  getOutOfRoundLevelSkipChancePreview,
  LAB_SKIP_INCREASE_SCALE,
  LEVEL_SKIP_LAB_BENEFIT_INCREASE_RATE,
  levelSkipEnhancementMultiplier,
  levelSkipEnhancementMultiplierFromField,
  levelSkipProcProbability,
  levelSkipRollModifier,
  levelSkipWavePolynomial,
  levelSkipWaveScale,
  levelSkipWaveTierAdd,
  levelSkipWorkshopBase,
  rollEnemyLevelSkip,
  simulateEnemyLevelSkips,
  storeAttackLevelSkipChanceTerm,
  workshopLevelSkipStat,
} from '../../src/mechanics/enemies/level-skip'
import {
  enemyHeaderDisplayMultipliers,
  tradeOffPresetAllExceptEnemyDmgMinus50,
} from '../../src/mechanics/enemies/stat-display'
import { computeElsReductionHeatLevel } from '../../src/mechanics/battle-conditions/tournament-heat-bc'

describe('mechanics/enemy-level-skip', () => {
  it('workshop base matches workshop.json value[L] (0.0005 + L × 0.0005)', () => {
    expect(levelSkipWorkshopBase(699)).toBeCloseTo(0.35, 6)
    expect(levelSkipWorkshopBase(680)).toBeCloseTo(0.3405, 6)
    expect(levelSkipWorkshopBase(699) - levelSkipWorkshopBase(680)).toBeCloseTo(0.0095, 6)
    expect(workshopLevelSkipStat(0.0005, 0.0005, 10)).toBeCloseTo(0.0055, 6)
  })

  it('ELS+ enhancement multiplies base skip (1 + field, field = level × 0.01)', () => {
    expect(levelSkipEnhancementMultiplier(160)).toBeCloseTo(2.6, 6)
    expect(levelSkipEnhancementMultiplierFromField(1.6)).toBeCloseTo(2.6, 6)
  })

  it('lab benefit increase adds to workshop before enhancement', () => {
    const base = buildLevelSkipChanceRaw({
      kind: 'attack',
      utilityLevel: 100,
      moduleClusterBenefit: 0,
      enhancementLevel: 60,
    })
    const withLab = buildLevelSkipChanceRaw({
      kind: 'attack',
      utilityLevel: 100,
      moduleClusterBenefit: 0,
      enhancementLevel: 60,
      labBenefitIncrease: LEVEL_SKIP_LAB_BENEFIT_INCREASE_RATE,
    })
    expect(withLab - base).toBeCloseTo(
      LEVEL_SKIP_LAB_BENEFIT_INCREASE_RATE * LAB_SKIP_INCREASE_SCALE * 1.6,
      6,
    )
  })

  it('live probe breakdown: workshop + cluster + enhancement', () => {
    const shared = {
      kind: 'attack' as const,
      moduleClusterBenefit: 0.16,
      enemyLevelSkipEnhancement: 0.01,
    }
    const battle = buildLevelSkipChanceRaw({ ...shared, utilityLevel: 699 })
    const preview = buildLevelSkipChanceRaw({ ...shared, utilityLevel: 680 })
    expect(battle).toBeCloseTo(0.5151, 4)
    expect(getOutOfRoundLevelSkipChancePreview({ ...shared, utilityLevel: 680 })).toBeCloseTo(preview, 6)
    expect(battle - preview).toBeCloseTo(0.00955, 4)
  })

  it('chance clamps to [0, 1]', () => {
    const high = computeLevelSkipChance({
      kind: 'attack',
      utilityLevel: 1300,
      enemyLevelSkipEnhancement: 10,
      moduleClusterBenefit: 0.2,
      cardBonus: 0.1,
    })
    expect(high).toBe(1)
  })

  it('wave polynomial grows with wave', () => {
    expect(levelSkipWavePolynomial(500)).toBeGreaterThan(levelSkipWavePolynomial(10))
  })

  it('wave scale includes pow(1.004, wave) tail', () => {
    const s10 = levelSkipWaveScale(10)
    const s100 = levelSkipWaveScale(100)
    expect(s100).toBeGreaterThan(s10)
  })

  it('attack skip raw sum matches workshop curve + cluster + enhancement', () => {
    expect(storeAttackLevelSkipChanceTerm(699, 0.16, 1)).toBeCloseTo(0.5151, 4)
    expect(storeAttackLevelSkipChanceTerm(680, 0.16, 1)).toBeCloseTo(0.50555, 4)
  })

  it('roll uses waveScale × skipChance × roll modifier as threshold', () => {
    const r = rollEnemyLevelSkip({
      wave: 100,
      skipChance: 0.5,
      roll: 0.99,
      rollContext: { waveTierField: 14 },
    })
    expect(r.rollModifier).toBeCloseTo(1.5 + 0.36, 6)
    expect(r.threshold).toBeCloseTo(r.waveScale * 0.5 * r.rollModifier, 5)
    expect(r.skip).toBe(0.99 < r.threshold)
  })

  it('wave-tier add table matches game constants', () => {
    expect(levelSkipWaveTierAdd(9)).toBe(0)
    expect(levelSkipWaveTierAdd(10)).toBeCloseTo(0.01, 6)
    expect(levelSkipWaveTierAdd(14)).toBeCloseTo(0.36, 6)
    expect(levelSkipWaveTierAdd(18)).toBeCloseTo(0.51, 6)
  })

  it('ELS reduction subtract is absolute: modifier × heat ÷ 315 × 0.005 (campaign)', () => {
    const adjusted = applyTierBattleConditionsToSkipChance(0.88, { elsReductionLevel: 5 })
    const subtract = (5 / 315) * 0.005
    expect(adjusted).toBeCloseTo(0.88 - subtract, 6)
  })

  it('tournament ELS Reduction ramps with wave (heat complement of resistance retention)', () => {
    expect(computeElsReductionHeatLevel('Legend', 0)).toBe(0)
    expect(computeElsReductionHeatLevel('Legend', 350)).toBe(0)
    expect(computeElsReductionHeatLevel('Legend', 1000)).toBe(0)
    expect(computeElsReductionHeatLevel('Gold', 1000)).toBe(0)
    const adjusted = applyTierBattleConditionsToSkipChance(0.88, {
      elsReductionLevel: 48,
      elsReductionUseCampaignHeatScale: false,
    })
    expect(adjusted).toBeCloseTo(0.88 - 48 * 0.005, 4)
  })

  it('expected enemy stat wave drops when per-wave skip threshold exceeds 1', () => {
    const highWave = expectedEnemyStatWave(100, 0.88, { waveTierField: 18 })
    const lowWave = expectedEnemyStatWave(100, 0, { waveTierField: 18 })
    expect(highWave).toBeLessThan(lowWave)
    expect(highWave).toBeGreaterThanOrEqual(1)
  })

  it('header stat level uses fractional counter simulation', () => {
    expect(estimatedEnemyStatLevelFromSkip(4774, 0.904)).toBe(459)
    expect(estimatedEnemyStatLevelFromSkip(4774, 0.896)).toBe(497)
    expect(estimatedEnemyStatLevelFromSkip(10, 0.5)).toBe(6)
    expect(simulateEnemyLevelSkips(4774, 0.904).totalSkips).toBe(4315)
    expect(enemyStatLevelFromRunWave(4774, 4315)).toBe(459)
  })

  it('round(wave × chance) approximation remains available', () => {
    const healthSkip = deterministicSkipLevelsFromChance(4774, 0.904)
    expect(healthSkip.statLevel).toBe(458)
    expect(healthSkip.totalSkips).toBe(4316)
    expect(healthSkip.counterRemainder).toBeCloseTo(-0.304, 6)
    expect(enemyStatLevelFromRunWave(4774, 4316)).toBe(458)
  })

  it('T10 W6194 skip counters: stored 0.9054/0.893 → 5608/5531', () => {
    const hpSkips = simulateEnemyLevelSkips(6194, 0.9054).totalSkips
    const atkSkips = simulateEnemyLevelSkips(6194, 0.893).totalSkips
    expect(hpSkips).toBe(5608)
    expect(atkSkips).toBe(5531)
    const toggles = tradeOffPresetAllExceptEnemyDmgMinus50()
    const mult = enemyHeaderDisplayMultipliers({
      enemyType: 'Basic',
      toggles,
      tradeOffImproveMult: 1.04,
    })
    expect(mult.damage).toBeGreaterThan(1)
    expect(getBasicEnemyWaveStats(10, 6194 - hpSkips, false).hp).toBeGreaterThan(0)
  })

  it('proc probability caps at 1', () => {
    expect(levelSkipProcProbability(100, 0.88, { waveTierField: 18 })).toBe(1)
  })

  it('roll modifier includes 1.5 base plus tier add', () => {
    expect(levelSkipRollModifier({ waveTierField: 18 })).toBeCloseTo(2.01, 6)
  })
})

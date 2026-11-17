import { describe, expect, it } from 'vitest'
import { bonusDamageFromImpetus } from '../../src/mechanics/combat/impetus'
import { botTowerFactor, getFlameBotDamageReduction, getThunderBotLinger } from '../../src/mechanics/bots/effective-range'
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
  enemyHeaderTradeOffLabels,
  formatHeaderPerkMultiplier,
  perkBenefitUp,
  TRADE_OFF_ENEMY_HP_BENEFIT_BASE,
  tradeOffImproveMultFromLabPercent,
  tradeOffPresetAllExceptEnemyDmgMinus50,
  waveBaseDamageForHeader,
  waveInfoDisplayMultipliers,
} from '../../src/mechanics/enemies/stat-display'
import {
  computeElsReductionHeatLevel,
  GUARANTEED_ELS_REDUCTION_MAX,
} from '../../src/mechanics/battle-conditions/tournament-heat-bc'
import {
  getTierSelection,
  getTournamentLeagueTierBase,
  normalizeTierSelection,
  BOT_PLUS_BASE_BENEFIT_V29,
  BOT_PLUS_BENEFIT_PER_LEVEL_V29,
  BOT_PLUS_MAX_LEVEL_V29,
  BOT_PLUS_INDEX_THUNDER_TITAN_SHOCK,
  TOURNAMENT_HEAT_PROFILES,
  TOURNAMENT_PROMOTION_RULES,
} from '../../src/data'
import { getBasicEnemyWaveStats } from '../../src/mechanics/enemies/wave-stats'
import { getEnemyWaveStats, getWaveBaseStats } from '../../src/mechanics/enemies/wave-stats'
import { skipDecayWaveInterval } from '../../src/mechanics/battle-conditions/conditions'
import { chronoSlowStrength, chronoLoopMotion } from '../../src/mechanics/combat/chrono-field'
import { shockwaveFrequencySeconds } from '../../src/mechanics/combat/shockwave'
import { rangeSoftCap } from '../../src/mechanics/combat/tower-range'
import { poisonSwampTickDamage, swampStunRoll } from '../../src/mechanics/combat/poison-swamp'
import {
  blackHoleBounceInRange,
  BOUNCE_RANGE_HALF_MULT,
  buildTargetPriorityWinners,
  enemyTypePriorityBucket,
  findNextBounceTargetByDistance,
  normalizeBounceAngleDegrees,
  orderedTargetPriorityList,
  priorityMaskIncludesType,
  selectMultishotTargetsByScanOrder,
} from '../../src/mechanics/combat/multishot-bounce'
import {
  applyDamageStatRatioStep,
  projectileDamageWithImpetus,
  projectileHitDamage,
  waveBaseStatRatio,
} from '../../src/mechanics/combat/projectile-damage'
import {
  getOutOfRoundCriticalMultiplier,
  workshopDamageCurve,
} from '../../src/mechanics/workshop/attack-stats'
import {
  applyUltimateAbsorbPool,
  isLightningEliteType,
  lightningDamageWithStack,
  ultimateModuleMultiplier,
} from '../../src/mechanics/combat/ultimates'
import { getDropLandmineDamage } from '../../src/mechanics/combat/land-mines'
import { rendArmorMultiplier } from '../../src/mechanics/combat/rend-armor'
import { thornAccumulatorNext, thornDamageOnHit } from '../../src/mechanics/combat/thorns'
import { knockbackImpulseApplied } from '../../src/mechanics/combat/knockback'
import {
  applyTitanShockAttackCooldown,
  titanShockAttackSpeedDivider,
  titanShockMassFactor,
  titanShockReduction,
  computeBotPlusBenefit,
  resolveTitanShockAttackSpeedSlow,
} from '../../src/mechanics/combat/crowd-control'
import {
  applyDamageReductionStats,
  computeDamageReductionResult,
} from '../../src/mechanics/combat/damage-reduction'
import {
  getOutOfRoundOrbSpeedPreview,
  healthRegenCurve,
} from '../../src/mechanics/workshop/defense-stats'
import {
  getOutOfRoundAttackSpeedPreview,
  getOutOfRoundFreeUpgradeChancePreview,
  getOutOfRoundLifestealPreview,
} from '../../src/mechanics/workshop/utility-stats'
import { getWildfireAmplification, getWildfireDuration } from '../../src/mechanics/combat/wildfire'
import { towerFireRapidFireEligible } from '../../src/mechanics/combat/tower-fire'

describe('mechanics/enemy-wave-stats', () => {
  it('wave 1 tier-1 basic matches non-tournament body (a=0.05, b=0.8, c=1.5)', () => {
    const base = getWaveBaseStats(1)
    expect(base.hp).toBe(2)
    expect(base.damage).toBeGreaterThan(0)
  })

  it('boss HP multiplier applies', () => {
    const basic = getEnemyWaveStats(1, 100, 'Basic')
    const boss = getEnemyWaveStats(1, 100, 'Boss')
    expect(basic).not.toBeNull()
    expect(boss).not.toBeNull()
    expect(boss!.hp).toBe(basic!.hp * 20)
  })
})

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

  it('tournament ELS Reduction is absent in v29 (heatLevel[22] never set)', () => {
    expect(computeElsReductionHeatLevel('Legend', 0)).toBe(0)
    expect(computeElsReductionHeatLevel('Legend', 350)).toBe(0)
    expect(computeElsReductionHeatLevel('Legend', 1000)).toBe(0)
    expect(computeElsReductionHeatLevel('Gold', 1000)).toBe(0)
    // Campaign-style subtract still uses an explicit level when provided.
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

describe('mechanics/enemy-stat-display', () => {
  it('PerkBenefitUp returns 1 − (base + increase × level) × improveMult', () => {
    const mult = perkBenefitUp({
      index: 42,
      tables: {
        upBase: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5],
        upIncrease: [],
        down: [],
        perkLevel: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      },
      tradeOffImproveMult: 1.1,
    })
    expect(mult).toBeCloseTo(0.45, 6)
  })

  it('tradeOffImproveMultFromLabPercent matches lab +1%/level', () => {
    expect(tradeOffImproveMultFromLabPercent(10)).toBeCloseTo(1.1, 6)
    expect(tradeOffImproveMultFromLabPercent(0)).toBe(1)
  })

  it('enemyHeaderTradeOffLabels use lab-0 base and scale with improve lab (no double-count)', () => {
    expect(enemyHeaderTradeOffLabels(0).enemyHpMinus50).toBe('Enemy HP −50.0%')
    expect(enemyHeaderTradeOffLabels(10).enemyHpMinus50).toBe('Enemy HP −55.0%')
    expect(enemyHeaderTradeOffLabels(0).enemyDmgMinus50).toBe('Enemies Damage −50.0%')
    expect(enemyHeaderTradeOffLabels(10).enemyDmgMinus50).toBe('Enemies Damage −55.0%')
    expect(enemyHeaderTradeOffLabels(0).bossHpMinus70).toBe('Boss HP −70%')
    expect(enemyHeaderTradeOffLabels(10).bossHpMinus70).toBe('Boss HP −70%')
    expect(enemyHeaderTradeOffLabels(10).enemyDmgX25).toBe('Enemies Damage ×2.50')
    expect(enemyHeaderTradeOffLabels(10).rangedDmgX3).toBe('Ranged Damage ×3.00')
  })

  it('boss HP −70% and improve lab are independent (PerkBenefitDown path)', () => {
    const toggles = {
      perkEnemyHpMinus50: false,
      perkBossHpX8: false,
      perkBossHpMinus70: true,
      perkEnemyDmgMinus50: false,
      perkEnemyDmgX25: false,
      perkRangedDmgX3: false,
    }
    const lab0 = enemyHeaderDisplayMultipliers({ enemyType: 'Boss', toggles, improveTradeOffLabPct: 0 })
    const lab10 = enemyHeaderDisplayMultipliers({ enemyType: 'Boss', toggles, improveTradeOffLabPct: 10 })
    expect(lab0.hp).toBeCloseTo(0.3, 6)
    expect(lab10.hp).toBeCloseTo(0.3, 6)
  })

  it('formatHeaderPerkMultiplier rounds to 2 decimals', () => {
    expect(formatHeaderPerkMultiplier(0.44999999999999996)).toBe('0.45')
    expect(formatHeaderPerkMultiplier(1)).toBe('1.00')
    expect(formatHeaderPerkMultiplier(2.5)).toBe('2.50')
  })

  it('PerkBenefitUp at lab 0 uses base benefit only (improve mult applied once at lab > 0)', () => {
    const multLab0 = perkBenefitUp({
      index: 42,
      tables: {
        upBase: Array.from({ length: 43 }, (_, i) => (i === 42 ? TRADE_OFF_ENEMY_HP_BENEFIT_BASE : 0)),
        upIncrease: [],
        down: [],
        perkLevel: Array.from({ length: 43 }, (_, i) => (i === 42 ? 1 : 0)),
      },
      tradeOffImproveMult: 1,
    })
    expect(multLab0).toBeCloseTo(0.5, 6)
  })

  it('trade-off preset enables all except Enemies/Tower −50% dmg', () => {
    expect(tradeOffPresetAllExceptEnemyDmgMinus50()).toEqual({
      perkEnemyHpMinus50: true,
      perkBossHpX8: true,
      perkBossHpMinus70: true,
      perkEnemyDmgMinus50: false,
      perkEnemyDmgX25: true,
      perkRangedDmgX3: true,
    })
  })

  it('wave info perks apply after type rules; improve lab scales only enabled PerkBenefitUp perks', () => {
    const toggles = tradeOffPresetAllExceptEnemyDmgMinus50()
    const basicOn = waveInfoDisplayMultipliers({ enemyType: 'Basic', toggles, improveTradeOffLabPct: 10 })
    const basicOff = waveInfoDisplayMultipliers({
      enemyType: 'Basic',
      toggles: { ...toggles, perkEnemyDmgX25: false, perkEnemyHpMinus50: false },
      improveTradeOffLabPct: 10,
    })
    const allOff = waveInfoDisplayMultipliers({
      enemyType: 'Basic',
      toggles: {
        perkEnemyHpMinus50: false,
        perkBossHpX8: false,
        perkBossHpMinus70: false,
        perkEnemyDmgMinus50: false,
        perkEnemyDmgX25: false,
        perkRangedDmgX3: false,
      },
      improveTradeOffLabPct: 10,
    })
    const vampire = waveInfoDisplayMultipliers({ enemyType: 'Vampire', toggles, improveTradeOffLabPct: 10 })
    const protector = waveInfoDisplayMultipliers({ enemyType: 'Protector', toggles, improveTradeOffLabPct: 10 })
    const overcharge = waveInfoDisplayMultipliers({ enemyType: 'Overcharge', toggles, improveTradeOffLabPct: 10 })
    const bossOn = waveInfoDisplayMultipliers({ enemyType: 'Boss', toggles, improveTradeOffLabPct: 10 })
    expect(basicOn.damage).toBe(2.5)
    expect(basicOn.hp).toBeCloseTo(0.45, 6)
    expect(basicOff.damage).toBe(1)
    expect(basicOff.hp).toBeCloseTo(2, 6)
    expect(allOff.hp).toBe(1)
    expect(allOff.damage).toBe(1)
    expect(bossOn.hp).toBeCloseTo((0.3 * 8 * 0.45) / 0.559897, 2)
    expect(vampire.damage).toBe(1)
    expect(vampire.hp).toBeCloseTo(0.45, 6)
    expect(protector.damage).toBe(2.5)
    expect(overcharge.damage).toBe(2.5)
  })

  it('×2.5 applies to all types; ×3 applies to Ranged only (NewWave + spawn path)', () => {
    const toggles = tradeOffPresetAllExceptEnemyDmgMinus50()
    const basic = enemyHeaderDisplayMultipliers({ enemyType: 'Basic', toggles })
    const ranged = enemyHeaderDisplayMultipliers({ enemyType: 'Ranged', toggles })
    expect(basic.damage).toBe(2.5)
    expect(ranged.damage).toBe(7.5)
  })

  it('improve lab does not affect wave-info when all trade-off perks are off', () => {
    const toggles = {
      perkEnemyHpMinus50: false,
      perkBossHpX8: false,
      perkBossHpMinus70: false,
      perkEnemyDmgMinus50: false,
      perkEnemyDmgX25: false,
      perkRangedDmgX3: false,
    }
    const lab0 = waveInfoDisplayMultipliers({ enemyType: 'Basic', toggles, improveTradeOffLabPct: 0 })
    const lab10 = waveInfoDisplayMultipliers({ enemyType: 'Basic', toggles, improveTradeOffLabPct: 10 })
    expect(lab0.hp).toBe(1)
    expect(lab10.hp).toBe(1)
    expect(lab0.damage).toBe(1)
    expect(lab10.damage).toBe(1)
  })

  it('improve lab scales Enemy HP perk only when that perk is on', () => {
    const toggles = { ...tradeOffPresetAllExceptEnemyDmgMinus50(), perkEnemyDmgX25: false }
    const lab0 = waveInfoDisplayMultipliers({ enemyType: 'Basic', toggles, improveTradeOffLabPct: 0 })
    const lab10 = waveInfoDisplayMultipliers({ enemyType: 'Basic', toggles, improveTradeOffLabPct: 10 })
    expect(lab0.hp).toBeCloseTo(0.5, 6)
    expect(lab10.hp).toBeCloseTo(0.45, 6)
  })

  it('wave info damage ignores Enemies Damage −% (workshop row already matches panel)', () => {
    const togglesOn = { ...tradeOffPresetAllExceptEnemyDmgMinus50(), perkEnemyDmgMinus50: true }
    const togglesOff = tradeOffPresetAllExceptEnemyDmgMinus50()
    const on = waveInfoDisplayMultipliers({ enemyType: 'Basic', toggles: togglesOn, improveTradeOffLabPct: 10 })
    const off = waveInfoDisplayMultipliers({ enemyType: 'Basic', toggles: togglesOff, improveTradeOffLabPct: 10 })
    expect(on.damage).toBe(2.5)
    expect(off.damage).toBe(2.5)
  })

  it('wave info workshop damage ×2.5 when Enemy HP trade-off is on (×2.5 toggle off)', () => {
    const toggles = {
      perkEnemyHpMinus50: true,
      perkBossHpX8: false,
      perkBossHpMinus70: false,
      perkEnemyDmgMinus50: true,
      perkEnemyDmgX25: false,
      perkRangedDmgX3: false,
    }
    const basic = waveInfoDisplayMultipliers({ enemyType: 'Basic', toggles, improveTradeOffLabPct: 10 })
    const vampire = waveInfoDisplayMultipliers({ enemyType: 'Vampire', toggles, improveTradeOffLabPct: 10 })
    expect(basic.damage).toBe(2.5)
    expect(vampire.damage).toBe(1)
  })

  it('perk toggles change header mults', () => {
    const none = enemyHeaderDisplayMultipliers({
      enemyType: 'Basic',
      toggles: {
        perkEnemyHpMinus50: false,
        perkBossHpX8: false,
        perkBossHpMinus70: false,
        perkEnemyDmgMinus50: false,
        perkEnemyDmgX25: false,
        perkRangedDmgX3: false,
      },
    })
    const all = enemyHeaderDisplayMultipliers({
      enemyType: 'Boss',
      toggles: tradeOffPresetAllExceptEnemyDmgMinus50(),
    })
    expect(none.hp).toBe(1)
    expect(none.damage).toBe(1)
    expect(all.hp).toBeCloseTo(0.5 * 0.3 * 8, 6)
    expect(all.damage).toBe(2.5)
  })

  it('T20 W6192 wave base computes finite positive stats', () => {
    const hp = getBasicEnemyWaveStats(20, 6192, false).hp
    const dmg = getBasicEnemyWaveStats(20, 6192, false).damage
    expect(Number.isFinite(hp)).toBe(true)
    expect(Number.isFinite(dmg)).toBe(true)
    expect(hp).toBeGreaterThan(0)
    expect(dmg).toBeGreaterThan(0)
    expect(dmg).toBeLessThan(hp)
  })

  it('improve trade-off lab scales header HP only (not ×2.5 damage)', () => {
    const toggles = {
      perkEnemyHpMinus50: true,
      perkBossHpX8: false,
      perkBossHpMinus70: false,
      perkEnemyDmgMinus50: false,
      perkEnemyDmgX25: true,
      perkRangedDmgX3: false,
    }
    const baseHp = getBasicEnemyWaveStats(10, 624, false).hp
    const baseDmg = waveBaseDamageForHeader(getBasicEnemyWaveStats(10, 624, false).damage)
    const at0 = enemyHeaderDisplayMultipliers({ enemyType: 'Basic', toggles, improveTradeOffLabPct: 0 })
    const at8 = enemyHeaderDisplayMultipliers({ enemyType: 'Basic', toggles, improveTradeOffLabPct: 8 })
    expect(baseHp * at8.hp).toBeLessThan(baseHp * at0.hp)
    expect(baseDmg * at0.damage).toBeCloseTo(baseDmg * at8.damage, -2)
  })

  it('waveBaseDamageForHeader passes through the base damage model', () => {
    const raw = getBasicEnemyWaveStats(10, 695, false).damage
    expect(waveBaseDamageForHeader(raw)).toBe(raw)
  })

  it('improve lab scales displayed HP via PerkBenefitUp only', () => {
    const toggles = {
      perkEnemyHpMinus50: true,
      perkBossHpX8: false,
      perkBossHpMinus70: false,
      perkEnemyDmgMinus50: false,
      perkEnemyDmgX25: false,
      perkRangedDmgX3: false,
    }
    const rawHp = getBasicEnemyWaveStats(10, 458, false).hp
    const at0 = enemyHeaderDisplayMultipliers({ enemyType: 'Basic', toggles, tradeOffImproveMult: 1 })
    const at8 = enemyHeaderDisplayMultipliers({ enemyType: 'Basic', toggles, improveTradeOffLabPct: 80 })
    expect(rawHp * at8.hp).toBeLessThan(rawHp * at0.hp)
  })
})

describe('tournaments/tier selection', () => {
  it('maps each league to its tier+ base', () => {
    expect(getTournamentLeagueTierBase('Copper')).toBe(1)
    expect(getTournamentLeagueTierBase('Silver')).toBe(3)
    expect(getTournamentLeagueTierBase('Gold')).toBe(5)
    expect(getTournamentLeagueTierBase('Platinum')).toBe(8)
    expect(getTournamentLeagueTierBase('Champion')).toBe(12)
    expect(getTournamentLeagueTierBase('Legend')).toBe(17)
    expect(getTournamentLeagueTierBase('Mythic')).toBe(23)
  })

  it('resolves league selections as tournament runs', () => {
    const champion = getTierSelection('Champion')
    expect(champion.tournament).toBe(true)
    expect(champion.tier).toBe(12)
    expect(champion.league).toBe('Champion')
    expect(GUARANTEED_ELS_REDUCTION_MAX[champion.league!]).toBe(0)
  })

  it('wires v29 Mythic heat and promotion', () => {
    const mythic = getTierSelection('Mythic')
    expect(mythic.tournament).toBe(true)
    expect(mythic.tier).toBe(23)
    expect(GUARANTEED_ELS_REDUCTION_MAX.Mythic).toBe(0)
    expect(computeElsReductionHeatLevel('Mythic', 1000)).toBe(0)
    const heat = TOURNAMENT_HEAT_PROFILES.find(row => row.league === 'Mythic')
    expect(heat?.moreBossesEveryWaves).toBe(4)
    expect(heat?.randomBattleConditionCount).toBe(6)
    const legendPromo = TOURNAMENT_PROMOTION_RULES.find(row => row.league === 'Legend')
    const mythicPromo = TOURNAMENT_PROMOTION_RULES.find(row => row.league === 'Mythic')
    expect(legendPromo?.promotesTo).toBe('Mythic')
    expect(legendPromo?.demotedRankMin).toBe(25)
    expect(mythicPromo?.promotesTo).toBeNull()
    expect(mythicPromo?.demotedRankMin).toBe(25)
    expect(mythicPromo?.demotesTo).toBe('Legend')
    expect(mythicPromo?.promotedRankMax).toBe(4)
  })

  it('migrates legacy t11/t14/t17/t23 aliases to leagues', () => {
    expect(getTierSelection(normalizeTierSelection('t11')).league).toBe('Champion')
    expect(getTierSelection(normalizeTierSelection('t14')).league).toBe('Legend')
    expect(getTierSelection(normalizeTierSelection('t17')).league).toBe('Legend')
    expect(getTierSelection(normalizeTierSelection('t23')).league).toBe('Mythic')
  })

  it('prefers explicit standard tier over legacy tournamentLeague field', () => {
    expect(normalizeTierSelection(12, 'Legend')).toBe(12)
    expect(getTierSelection(normalizeTierSelection(12, 'Legend')).tournament).toBe(false)
    expect(normalizeTierSelection(undefined, 'Legend')).toBe('Legend')
  })
})

describe('mechanics/shockwave', () => {
  it('frequency floors at 7 seconds', () => {
    expect(shockwaveFrequencySeconds({ workshopBase: 100, moduleBonus: 0, enhancementLevel: 0 })).toBe(7)
  })
})

describe('mechanics/chrono-field', () => {
  it('mid knot returns 0.75 slow strength', () => {
    expect(chronoSlowStrength(0.5)).toBe(0.75)
  })
  it('separates level-eight rotation from its measured forty-percent radial slow', () => {
    expect(chronoLoopMotion({ unlocked: true, level: 8 })).toEqual({
      radialSpeedMultiplier: 0.6, hiddenSlowFraction: 0.4, rotationRadiansPerSecond: 0.25,
    })
  })
  it('distinguishes locked from unlocked level zero and validates measured bounds', () => {
    expect(chronoLoopMotion({ unlocked: false, level: 0 }).radialSpeedMultiplier).toBe(1)
    expect(chronoLoopMotion({ unlocked: true, level: 0 }).radialSpeedMultiplier).toBe(0.975)
    expect(chronoLoopMotion({ unlocked: true, level: 13 }).hiddenSlowFraction).toBe(0.65)
    expect(() => chronoLoopMotion({ unlocked: true, level: 14 })).toThrow(RangeError)
  })
})

describe('mechanics/battle-conditions', () => {
  it('skip decay interval', () => {
    expect(skipDecayWaveInterval(10, 0.1)).toBe(9)
  })
})

describe('mechanics/impetus', () => {
  it('matches live-probed shape at d=20.10 extra=0.05', () => {
    const mult = bonusDamageFromImpetus({
      impetus: 3797.8,
      distanceMeters: 20.1,
      extraMultiplier: 0.05,
      distanceMultiplier: 1,
    })
    expect(mult).toBeCloseTo(39.17, 1)
  })
})

describe('mechanics/tower-range', () => {
  it('soft cap knee at internal 8', () => {
    expect(rangeSoftCap(6)).toBe(6)
    expect(rangeSoftCap(8)).toBe(8)
    expect(rangeSoftCap(15)).toBeCloseTo(16.2, 1)
  })
})

describe('mechanics/bots', () => {
  it('towerFactor at 30m and 120m', () => {
    expect(botTowerFactor(3)).toBeCloseTo(0.7, 5)
    expect(botTowerFactor(12)).toBeCloseTo(1.3, 5)
  })
})

describe('mechanics/multishot-bounce', () => {
  it('GetEnemyTargetIndex jump table maps Ray (7) to bucket 8', () => {
    expect(enemyTypePriorityBucket(7)).toBe(8)
    expect(enemyTypePriorityBucket(10, 'sort')).toBe(0)
  })

  it('priority mask tier bit test matches expected shape', () => {
    expect(priorityMaskIncludesType(0x2c0, 7, 1)).toBe(true)
    expect(priorityMaskIncludesType(0x2c0, 0, 1)).toBe(false)
  })

  it('bucket winners pick closest per type (mode 2)', () => {
    const winners = buildTargetPriorityWinners([
      { index: 0, distanceFromTower: 50, enemyType: 0, alive: true, priorityEligible: true },
      { index: 1, distanceFromTower: 30, enemyType: 0, alive: true, priorityEligible: true },
      { index: 2, distanceFromTower: 20, enemyType: 7, alive: true, priorityEligible: true },
    ], 2)
    expect(winners.primaryIndex).toBe(2)
    expect(winners.bucketWinners.get(1)?.index).toBe(1)
    expect(winners.bucketWinners.get(8)?.index).toBe(2)
  })

  it('ordered list puts primary first then bucket order', () => {
    const winners = buildTargetPriorityWinners([
      { index: 0, distanceFromTower: 10, enemyType: 0, alive: true },
      { index: 1, distanceFromTower: 40, enemyType: 7, alive: true },
    ], 2)
    const ordered = orderedTargetPriorityList(winners, 2, [8, 1])
    expect(ordered[0]).toBe(0)
    expect(ordered).toContain(1)
  })

  it('multishot scan skips primary, blocked, and type 10', () => {
    const picked = selectMultishotTargetsByScanOrder({
      candidates: [
        { index: 0, distanceFromTower: 5, enemyType: 0, alive: true },
        { index: 1, distanceFromTower: 6, enemyType: 10, alive: true },
        { index: 2, distanceFromTower: 7, enemyType: 1, alive: true, blocked: true },
        { index: 3, distanceFromTower: 8, enemyType: 2, alive: true },
      ],
      maxDistance: 100,
      multishotTargets: 2,
      primaryTargetIndex: 0,
      alreadyShot: new Set(),
    })
    expect(picked).toEqual([3])
  })

  it('bounce target picks closest within half-range squared', () => {
    const half = BOUNCE_RANGE_HALF_MULT
    const next = findNextBounceTargetByDistance({
      fromX: 0,
      fromY: 0,
      bounceRange: 10,
      alreadyHit: new Set([1]),
      candidates: [
        { index: 1, x: 1, y: 0, alive: true },
        { index: 2, x: 3, y: 0, alive: true },
        { index: 3, x: 0, y: 0.1, alive: true },
      ],
    })
    expect(next).toBe(3)
    expect((3 * half) ** 2).toBeGreaterThan(0.01)
  })
})

describe('mechanics/projectile-damage', () => {
  it('hit damage multiplies hit × base × impetus × floor × crit', () => {
    expect(projectileHitDamage({
      baseDamage: 100,
      hitMultiplier: 1.5,
      impetusMult: 2,
      enemyDamageFloor: 0.5,
      critMultiplier: 3,
    })).toBe(900)
  })

  it('wires impetus at reference probe distance', () => {
    const dmg = projectileDamageWithImpetus({
      baseDamage: 1000,
      hitMultiplier: 1,
      impetus: 3797.8,
      distanceMeters: 20.1,
      extraImpetusMultiplier: 0.05,
    })
    expect(dmg).toBeCloseTo(1000 * 39.17, -1)
  })

  it('wave base ratio for level scaling', () => {
    expect(waveBaseStatRatio(200, 100)).toBe(2)
    expect(applyDamageStatRatioStep(50, 2)).toBe(100)
  })
})

describe('mechanics/workshop-attack-stats', () => {
  it('damage curve core at L=100', () => {
    expect(workshopDamageCurve(100)).toBeCloseTo(283.01, 2)
  })

  it('adds tier pow term above 999', () => {
    const low = workshopDamageCurve(1000)
    const at = workshopDamageCurve(999)
    expect(low).toBeGreaterThan(at)
  })

  it('crit mult combines level term and upgrade slot', () => {
    const mult = getOutOfRoundCriticalMultiplier({
      workshopLevel: 10,
      workshopStat28: 5,
      moduleCriticalMultiplier: 100,
      upgradeSlot18: 8,
      cardMult: 1,
      relicMult: 1,
    })
    expect(mult).toBe(((10 * 0.1 + 1.2) * 5 + 100) * 9)
  })
})

describe('mechanics/multishot-bounce/geometry', () => {
  it('normalizes bounce angle across ±180', () => {
    expect(normalizeBounceAngleDegrees(270, false)).toBe(-90)
    expect(normalizeBounceAngleDegrees(-200, false)).toBe(160)
  })

  it('black hole range uses squared reach', () => {
    expect(blackHoleBounceInRange({ dx: 1, dy: 0, effectiveReach: 2 })).toBe(true)
    expect(blackHoleBounceInRange({ dx: 3, dy: 0, effectiveReach: 2 })).toBe(false)
  })
})

describe('mechanics/thorns', () => {
  it('applies 0.01 lab scale ', () => {
    const dmg = thornDamageOnHit({
      enemyFactor: 100,
      thornMultiplier: 5,
      contactDamage: 10,
      thornLabActive: true,
    })
    expect(dmg).toBeCloseTo(50, 5)
  })

  it('accumulator adds mult + 1', () => {
    expect(thornAccumulatorNext(2, 3)).toBe(6)
  })
})

describe('mechanics/ultimates', () => {
  it('module mult is bonus + 1', () => {
    expect(ultimateModuleMultiplier(2.5)).toBe(3.5)
  })

  it('absorb pool spills overflow', () => {
    const r = applyUltimateAbsorbPool({ incomingDamage: 50, absorbPool: 20 })
    expect(r.damageApplied).toBe(20)
    expect(r.overflow).toBe(30)
  })

  it('lightning elite stack uses hitCount²', () => {
    const dmg = lightningDamageWithStack({
      baseDamage: 100,
      moduleBonus: 0,
      labValue: 0.5,
      hitCount: 2,
      isEliteType: true,
      labActive: true,
    })
    expect(dmg).toBe(300)
    expect(isLightningEliteType(7)).toBe(true)
  })
})

describe('mechanics/land-mines', () => {
  it('caps mine damage at 100 before 0.01 scale', () => {
    const dmg = getDropLandmineDamage({
      mineDamage: 200,
      mineDamageAux: 0,
      mineField: 0,
      mineScalar: 0,
      workshopMineBase: 10,
      storedCoeff: 1,
    })
    expect(dmg).toBeCloseTo(10, 5)
  })
})

describe('mechanics/rend-armor', () => {
  it('stacks workshop upgrade terms', () => {
    const mult = rendArmorMultiplier({
      workshopUpgrade18: 1,
      workshopUpgrade12: 2,
      rendArmorStat: 1.5,
      rendLabActive: true,
      rendRoll: 0.1,
      rendThreshold: 0.5,
    })
    expect(mult).toBe(2 * 3 * 1.5)
  })
})

describe('mechanics/knockback', () => {
  it('impulse must exceed existing velocity', () => {
    expect(knockbackImpulseApplied({ knockbackForce: 5, massScale: 1, existingVelocity: 10 })).toBe(0)
    expect(knockbackImpulseApplied({ knockbackForce: 15, massScale: 1, existingVelocity: 10 })).toBe(15)
  })
})

describe('mechanics/bots/flame-thunder', () => {
  it('flame bot elite path uses 1 − pow(1 − mult, exp)', () => {
    const mult = getFlameBotDamageReduction({
      eliteFlamePath: true,
      damageMultiplier: 0.8,
      powExponent: 1,
    })
    expect(mult).toBeCloseTo(0.8, 6)
  })

  it('thunder linger multiplies base when active', () => {
    expect(getThunderBotLinger({ lingerActive: true, lingerBase: 10, lingerMult: 1.5 })).toBe(15)
    expect(getThunderBotLinger({ lingerBase: 10 })).toBe(10)
  })
})

describe('mechanics/damage-reduction', () => {
  it('accumulates seven reduction stat lanes', () => {
    const next = applyDamageReductionStats(
      { accum0: 1, accum1: 2, accum2: 3, accum3: 4, accum4: 5, accum5: 6, accum6: 7 },
      { lane0: 1, lane1: 2, lane2: 3, lane3: 4, lane4: 5, lane5: 6, lane6: 7 },
    )
    expect(next.accum3).toBe(5)
    expect(next.accum0).toBe(7)
  })

  it('uses precomputed flame bot mult when provided', () => {
    const dmg = computeDamageReductionResult({
      rawDamage: 100,
      flameBotDamageMult: 0.5,
    })
    expect(dmg).toBe(50)
  })
})

describe('mechanics/workshop-utility-stats', () => {
  it('attack speed stacks level × 0.05 + 1', () => {
    const speed = getOutOfRoundAttackSpeedPreview({
      workshopLevel: 100,
      workshopCurveMult: 0,
      catalogMult: 1,
      moduleMult: 1,
      labMult: 0,
      storedMult: 0,
      cardMult: 1,
    })
    expect(speed).toBe(6)
  })

  it('lifesteal adds tier sqrt term', () => {
    const ls = getOutOfRoundLifestealPreview({ catalogTier: 4, workshopCurveValue: 1 })
    expect(ls).toBe(1 + 4 * 0.1 * 2)
  })

  it('free upgrade chance adds lab + 1', () => {
    const ch = getOutOfRoundFreeUpgradeChancePreview({
      workshopCurveValue: 0.1,
      levelField: 0,
      labMult: 0.5,
      cardMultA: 1,
      cardMultB: 1,
    })
    expect(ch).toBeCloseTo(1.6, 5)
  })
})

describe('mechanics/wildfire', () => {
  it('duration scales 0.25 per bot level', () => {
    expect(getWildfireDuration(4)).toBe(2)
  })

  it('amplification multiplies when wildfire active', () => {
    expect(getWildfireAmplification({ wildfireActive: true, statBase: 2, statMult: 1.5 })).toBe(3)
  })
})

describe('mechanics/tower-fire', () => {
  it('rapid fire requires lab and both flags', () => {
    expect(towerFireRapidFireEligible({ labRapidFireMult: 1, rapidFireFlagA: true, rapidFireFlagB: false })).toBe(false)
    expect(towerFireRapidFireEligible({ labRapidFireMult: 1, rapidFireFlagA: true, rapidFireFlagB: true })).toBe(true)
  })
})

describe('mechanics/workshop-defense-stats', () => {
  it('health regen curve adds tier249 pow above 249', () => {
    const low = healthRegenCurve(200)
    const high = healthRegenCurve(300)
    expect(high).toBeGreaterThan(low)
  })

  it('orb speed combines level scale + lab + card', () => {
    const speed = getOutOfRoundOrbSpeedPreview({
      workshopLevel: 100,
      workshopCurveMult: 0,
      labMult: 0.5,
      cardMult: 2,
    })
    expect(speed).toBeCloseTo((100 * 0.015 + 0.04) * 1.5 * 2, 5)
  })
})

describe('mechanics/crowd-control/titan-shock', () => {
  it('attack speed divider scales with floor duration', () => {
    const div = titanShockAttackSpeedDivider(1, 2.7, 0.5)
    expect(div).toBe(1 * (0.5 * 3 + 1))
  })

  it('mass factor is log10(max(mass,1))+1 (v29 log10f)', () => {
    expect(titanShockMassFactor(0.5)).toBeCloseTo(1, 10)
    expect(titanShockMassFactor(1)).toBeCloseTo(1, 10)
    expect(titanShockMassFactor(10)).toBeCloseTo(2, 10)
    expect(titanShockMassFactor(100)).toBeCloseTo(3, 10)
  })

  it('reduction multiplies mass factor by attack-speed slow', () => {
    expect(titanShockReduction(10, 0.25)).toBeCloseTo(2 * 0.25, 10)
  })

  it('ApplyTitanShock multiplies cooldown by reduction+1', () => {
    expect(applyTitanShockAttackCooldown(2, 10, 0.5)).toBeCloseTo(2 * (2 * 0.5 + 1), 10)
  })

  it('GetBotPlusBenefit is base + perLevel * level', () => {
    expect(computeBotPlusBenefit(0.05, 0.01, 20)).toBeCloseTo(0.25, 10)
  })

  it('Bot+ V29 ladders pin Thunder Titan Shock 5%…25% over 0…20', () => {
    expect(BOT_PLUS_MAX_LEVEL_V29).toEqual([20, 20, 25, 9, 20])
    expect(BOT_PLUS_BASE_BENEFIT_V29).toEqual([1.5, 0.05, 1.25, 3.0, 1.25])
    expect(BOT_PLUS_BENEFIT_PER_LEVEL_V29).toEqual([0.1, 0.01, 0.05, 1.0, 0.05])
    const i = BOT_PLUS_INDEX_THUNDER_TITAN_SHOCK
    expect(computeBotPlusBenefit(BOT_PLUS_BASE_BENEFIT_V29[i], BOT_PLUS_BENEFIT_PER_LEVEL_V29[i], 0)).toBeCloseTo(0.05, 10)
    expect(computeBotPlusBenefit(BOT_PLUS_BASE_BENEFIT_V29[i], BOT_PLUS_BENEFIT_PER_LEVEL_V29[i], 20)).toBeCloseTo(0.25, 10)
    expect(computeBotPlusBenefit(BOT_PLUS_BASE_BENEFIT_V29[i], BOT_PLUS_BENEFIT_PER_LEVEL_V29[i], 10)).toBeCloseTo(0.15, 10)
  })

  it('AttackSpeedSlow reads plusBenefit[1], × plusBenefit[4] when boosted', () => {
    const plusBenefit = [1.5, 0.15, 1.75, 6, 1.5]
    expect(resolveTitanShockAttackSpeedSlow(plusBenefit, false, true)).toBeCloseTo(0.15, 10)
    expect(resolveTitanShockAttackSpeedSlow(plusBenefit, true, true)).toBeCloseTo(0.15 * 1.5, 10)
    expect(resolveTitanShockAttackSpeedSlow(plusBenefit, false, false)).toBe(1)
  })
})

describe('mechanics/poison-swamp', () => {
  it('rend mult scales with stacks', () => {
    const dmg1 = poisonSwampTickDamage({
      poisonSwampDamage: 100,
      modulePoisonMult: 1,
      globalUwMult: 1,
      uwScalarA: 1,
      uwScalarB: 0,
      uwScalarC: 0,
      uwScalarD: 0,
      stackCount: 2,
      rendLabValue: 1.5,
      rendLabActive: true,
    })
    const dmg0 = poisonSwampTickDamage({
      poisonSwampDamage: 100,
      modulePoisonMult: 1,
      globalUwMult: 1,
      uwScalarA: 1,
      uwScalarB: 0,
      uwScalarC: 0,
      uwScalarD: 0,
      stackCount: 0,
      rendLabActive: false,
    })
    expect(dmg1).toBeGreaterThan(dmg0)
  })

  it('stun debt raises full gate', () => {
    const low = swampStunRoll({
      ccRating: 5,
      labMult: 1,
      inputMult: 1,
      stunDebt: 0,
      roll: 0.5,
    })
    const high = swampStunRoll({
      ccRating: 5,
      labMult: 1,
      inputMult: 1,
      stunDebt: 0.5,
      roll: 0.5,
    })
    expect(high.fullGate).toBeGreaterThan(low.fullGate)
  })
})

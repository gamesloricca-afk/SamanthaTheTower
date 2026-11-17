import { describe, expect, it } from 'vitest'
import {
  applyElsTierSkipAdjustments,
  buildElsBudgetAllocation,
  buildElsUpgradePath,
  computeElsEnhancementLevel,
  computeElsInRunEffectiveSkipChances,
  computeWorkshopSkipChances,
  ELS_ATTACK_WORKSHOP_KEY,
  ELS_ENHANCEMENT_KEY,
  ELS_HEALTH_WORKSHOP_KEY,
  enhancementElsCoinUpgradeCost,
  findElsLeadFromWorkshopBlob,
  formatElsMarginalSkipLevels,
  formatElsRoiPct,
  formatElsRoiPerLevel,
  formatElsSkipPctDelta,
  listElsMarginalUpgrades,
  marginalSkipLevelsAtWave,
  standardElsCoinUpgradeCost,
} from '../../src/mechanics/modules/els-upgrade-path'
import { computeElsTrackSkipChance } from '../../src/mechanics/modules/els-module-cluster'
import { levelSkipWorkshopBase } from '../../src/mechanics/enemies/level-skip'

describe('els-upgrade-path', () => {
  it('matches workshop base skip formula for standard ELS levels', () => {
    const snapshot = computeWorkshopSkipChances({
      attackUtilityLevel: 699,
      healthUtilityLevel: 680,
      enhancementLevel: 0,
    })
    expect(snapshot.attack).toBeCloseTo(levelSkipWorkshopBase(699), 6)
    expect(snapshot.health).toBeCloseTo(levelSkipWorkshopBase(680), 6)
  })

  it('increments skip chance by 0.05% per utility level (workshop.json)', () => {
    const start = computeWorkshopSkipChances({
      attackUtilityLevel: 0,
      healthUtilityLevel: 0,
      enhancementLevel: 0,
    })
    const after13 = computeWorkshopSkipChances({
      attackUtilityLevel: 13,
      healthUtilityLevel: 0,
      enhancementLevel: 0,
    })
    expect(start.attackPct).toBeCloseTo(0.05, 6)
    expect(after13.attackPct).toBeCloseTo(0.7, 6)
    expect(after13.attackPct - start.attackPct).toBeCloseTo(0.65, 6)
  })

  it('multiplies both tracks when ELS+ enhancement increases', () => {
    const without = computeWorkshopSkipChances({
      attackUtilityLevel: 100,
      healthUtilityLevel: 100,
      enhancementLevel: 0,
    })
    const withEnh = computeWorkshopSkipChances({
      attackUtilityLevel: 100,
      healthUtilityLevel: 100,
      enhancementLevel: 10,
    })
    const attackDelta = withEnh.attack - without.attack
    const healthDelta = withEnh.health - without.health
    expect(attackDelta).toBeCloseTo(without.attack * 0.1, 6)
    expect(healthDelta).toBeCloseTo(without.health * 0.1, 6)
  })

  it('returns positive coin costs for early upgrades', () => {
    expect(standardElsCoinUpgradeCost('Enemy Attack Level Skip', 0, 0)).toBeGreaterThan(0)
    expect(enhancementElsCoinUpgradeCost(0, 0, 0)).toBeGreaterThan(0)
  })

  it('ranks next clicks by ROI % (best coin efficiency first)', () => {
    const options = listElsMarginalUpgrades({
      attackUtilityLevel: 0,
      healthUtilityLevel: 0,
      enhancementLevel: 0,
      referenceWave: 1000,
      focus: 'combined',
      utilityDiscountPct: 0,
    })
    expect(options.length).toBeGreaterThan(1)
    for (let i = 1; i < options.length; i += 1) {
      expect(options[i - 1].roiPct).toBeGreaterThanOrEqual(options[i].roiPct)
    }
  })

  it('relative ROI per level still diminishes at higher utility levels', () => {
    const early = listElsMarginalUpgrades({
      attackUtilityLevel: 0,
      healthUtilityLevel: 0,
      enhancementLevel: 0,
      referenceWave: 1000,
      focus: 'attack',
      utilityDiscountPct: 0,
    })
    const late = listElsMarginalUpgrades({
      attackUtilityLevel: 200,
      healthUtilityLevel: 0,
      enhancementLevel: 0,
      referenceWave: 1000,
      focus: 'attack',
      utilityDiscountPct: 0,
    })
    const earlyAttack = early.find(opt => opt.kind === 'attack')
    const lateAttack = late.find(opt => opt.kind === 'attack')
    expect(earlyAttack?.roiPerLevel).toBeCloseTo(100, 2)
    expect(lateAttack?.roiPerLevel).toBeLessThan(earlyAttack!.roiPerLevel)
    expect(lateAttack?.roiPerLevel).toBeCloseTo(0.497, 2)
  })

  it('vault stars increase skip chance additively before ELS+ mult', () => {
    const noVault = computeWorkshopSkipChances({
      attackUtilityLevel: 100,
      healthUtilityLevel: 100,
      enhancementLevel: 10,
    })
    const withVault = computeWorkshopSkipChances({
      attackUtilityLevel: 100,
      healthUtilityLevel: 100,
      enhancementLevel: 10,
    }, {
      vaultAttackStars: 3,
      vaultHealthStars: 3,
    })
    expect(withVault.attack).toBeGreaterThan(noVault.attack)
    expect(withVault.health).toBeGreaterThan(noVault.health)
    expect(withVault.attack - noVault.attack).toBeCloseTo(0.015 * 1.1, 4)
  })

  it('values ELS+ more highly when utility ELS base is larger', () => {
    const lowUtility = listElsMarginalUpgrades({
      attackUtilityLevel: 0,
      healthUtilityLevel: 0,
      enhancementLevel: 0,
      referenceWave: 1000,
      focus: 'combined',
    })
    const highUtility = listElsMarginalUpgrades({
      attackUtilityLevel: 200,
      healthUtilityLevel: 200,
      enhancementLevel: 0,
      referenceWave: 1000,
      focus: 'combined',
      modulePrimaryAttackPct: 8,
      moduleAssistAttackPct: 8,
      modulePrimaryHealthPct: 8,
      moduleAssistHealthPct: 8,
    })
    const lowEnh = lowUtility.find(opt => opt.kind === 'enhancement')!
    const highEnh = highUtility.find(opt => opt.kind === 'enhancement')!
    expect(highEnh.marginalSkipLevels).toBeGreaterThan(lowEnh.marginalSkipLevels)
  })

  it('builds a non-empty path when upgrades are affordable', () => {
    const result = buildElsUpgradePath({
      attackUtilityLevel: 10,
      healthUtilityLevel: 10,
      enhancementLevel: 0,
      referenceWave: 200,
      maxSteps: 5,
      focus: 'combined',
    })
    expect(result.steps.length).toBeGreaterThan(0)
    expect(result.totalCoinCost).toBeGreaterThan(0)
    expect(result.nextBest).not.toBeNull()
  })

  it('marginal skip levels increase with higher chance', () => {
    const low = marginalSkipLevelsAtWave(1000, 0.5, 0.51)
    const high = marginalSkipLevelsAtWave(1000, 0.5, 0.6)
    expect(high).toBeGreaterThan(low)
  })

  it('reference wave scales skip levels; ROI % reflects wave in the formula', () => {
    const base = {
      attackUtilityLevel: 50,
      healthUtilityLevel: 50,
      enhancementLevel: 0,
      focus: 'combined' as const,
    }
    const lowWave = listElsMarginalUpgrades({ ...base, referenceWave: 500 })
    const highWave = listElsMarginalUpgrades({ ...base, referenceWave: 5000 })
    const lowAttack = lowWave.find(opt => opt.kind === 'attack')!
    const highAttack = highWave.find(opt => opt.kind === 'attack')!
    expect(highAttack.marginalSkipLevels).toBeGreaterThan(lowAttack.marginalSkipLevels)
    expect(lowAttack.roiPct).not.toBeCloseTo(highAttack.roiPct, 6)
  })

  it('formats skip % deltas for display', () => {
    expect(formatElsSkipPctDelta(0.05)).toBe('+0.0500%')
    expect(formatElsSkipPctDelta(0, { signed: false })).toBe('0%')
  })

  it('formats relative ROI per level for display', () => {
    expect(formatElsRoiPerLevel(10)).toBe('10.0%')
    expect(formatElsRoiPerLevel(0.912)).toBe('0.912%')
  })

  it('formats ROI % and marginal skip levels for display', () => {
    expect(formatElsMarginalSkipLevels(2.456)).toBe('+2.46')
    expect(formatElsRoiPct(12.5)).toBe('12.5%')
    expect(formatElsRoiPct(0.912)).toBe('0.912%')
    expect(formatElsRoiPct(0.0000103)).not.toBe('0%')
  })

  it('keeps positive economy-scaled ROI at high ELS levels', () => {
    const options = listElsMarginalUpgrades({
      attackUtilityLevel: 680,
      healthUtilityLevel: 680,
      enhancementLevel: 55,
      referenceWave: 5000,
      focus: 'combined',
    })
    expect(options.length).toBeGreaterThan(0)
    for (const option of options) {
      expect(option.roiPct).toBeGreaterThan(0)
      expect(formatElsRoiPct(option.roiPct)).not.toBe('0%')
    }
  })

  it('uses a fixed path-start reference cost across upgrade path steps', () => {
    const path = buildElsUpgradePath({
      attackUtilityLevel: 680,
      healthUtilityLevel: 680,
      enhancementLevel: 55,
      referenceWave: 5000,
      focus: 'combined',
      maxSteps: 5,
    })
    expect(path.steps.length).toBeGreaterThan(0)
    for (const step of path.steps) {
      expect(step.roiPct).toBeGreaterThan(0)
      expect(formatElsRoiPct(step.roiPct)).not.toBe('0%')
    }
  })

  it('allocates coin budget across tracks until funds are exhausted', () => {
    const aggregated = buildElsBudgetAllocation({
      attackUtilityLevel: 0,
      healthUtilityLevel: 0,
      enhancementLevel: 0,
      referenceWave: 1000,
      focus: 'combined',
      coinBudget: 800e18,
    })
    expect(aggregated.length).toBeGreaterThan(0)
    const totalLevels = aggregated.reduce((sum, row) => sum + row.levels, 0)
    expect(totalLevels).toBeGreaterThan(25)
    expect(aggregated.some(row => row.kind === 'enhancement')).toBe(true)
    const totalCoin = aggregated.reduce((sum, row) => sum + row.totalCoinCost, 0)
    expect(totalCoin).toBeLessThanOrEqual(800e18)
  })

  it('resolves workshop tracker lead from tracker blob shape', () => {
    const lead = findElsLeadFromWorkshopBlob({
      progress: {
        levels: {
          [ELS_ATTACK_WORKSHOP_KEY]: 12,
          [ELS_HEALTH_WORKSHOP_KEY]: 8,
        },
        enhancementLevels: {
          [ELS_ENHANCEMENT_KEY]: 3,
        },
      },
      settings: {
        ui: {
          discountUtility: 15,
          enhancementDiscountUtility: 10,
          enhancementDiscountVault: 5,
        },
      },
    })
    expect(lead).toEqual({
      attackUtilityLevel: 12,
      healthUtilityLevel: 8,
      enhancementLevel: 3,
      utilityDiscountPct: 15,
      enhancementDiscountPct: 10,
      enhancementVaultDiscountPct: 5,
    })
  })

  it('resolves ELS+ level from save-import tracker alias keys', () => {
    expect(computeElsEnhancementLevel({
      'Enemy Level Skip +': 42,
    })).toBe(42)
    expect(computeElsEnhancementLevel({
      [ELS_ENHANCEMENT_KEY]: 10,
      'Enemy Level Skip +': 42,
    })).toBe(10)
  })

  it('path skip snapshots ignore tier BC (stored workshop % only)', () => {
    const baseInput = {
      attackUtilityLevel: 100,
      healthUtilityLevel: 100,
      enhancementLevel: 0,
      referenceWave: 1000,
      focus: 'combined' as const,
    }
    const noBc = buildElsUpgradePath(baseInput)
    const withTierBc = buildElsUpgradePath({
      ...baseInput,
      tierSkipAdjustments: { elsReductionLevel: 10 },
    })
    expect(withTierBc.starting.attackPct).toBeCloseTo(noBc.starting.attackPct, 6)
    expect(withTierBc.starting.healthPct).toBeCloseTo(noBc.starting.healthPct, 6)
  })

  it('path starting matches summary when resolved skip sources include vault and modules', () => {
    const sources = {
      vaultAttackStars: 3,
      vaultHealthStars: 3,
      primaryAttackPct: 8,
      assistAttackPct: 8,
      primaryHealthPct: 8,
      assistHealthPct: 8,
      labAttackBenefitIncrease: 2,
      labHealthBenefitIncrease: 2,
    }
    const levels = {
      attackUtilityLevel: 680,
      healthUtilityLevel: 680,
      enhancementLevel: 60,
    }
    const expected = computeWorkshopSkipChances(levels, sources)
    const path = buildElsUpgradePath({
      ...levels,
      referenceWave: 1000,
      focus: 'attack',
      maxSteps: 3,
      resolvedSkipSources: sources,
    })
    expect(path.starting.attackPct).toBeCloseTo(expected.attackPct, 4)
    expect(path.starting.healthPct).toBeCloseTo(expected.healthPct, 4)
    expect(path.steps[0]?.attackSkipPct).toBeGreaterThan(path.starting.attackPct)
    expect(path.ending.attackPct).toBeGreaterThan(path.starting.attackPct)
    expect(path.endingLevels.attackUtilityLevel).toBeGreaterThan(levels.attackUtilityLevel)
  })

  it('levelSkipWorkshopBase reads exact workshop.json float per level', () => {
    const fromJson = levelSkipWorkshopBase(680, 'attack')
    const linear = levelSkipWorkshopBase(680)
    expect(fromJson).toBeCloseTo(0.3404999971, 9)
    expect(fromJson).not.toBe(linear)
  })

  it('preserves fractional module assist pct through skip math', () => {
    const baseSources = {
      primaryAttackPct: 0,
      assistAttackPct: 0,
      primaryHealthPct: 0,
      assistHealthPct: 0,
    }
    const roundedAssist = computeElsTrackSkipChance('attack', 200, 0, {
      ...baseSources,
      assistAttackPct: 7.96,
    })
    const fullAssist = computeElsTrackSkipChance('attack', 200, 0, {
      ...baseSources,
      assistAttackPct: 7.964,
    })
    expect(fullAssist).toBeGreaterThan(roundedAssist)
    expect(fullAssist - roundedAssist).toBeCloseTo(0.00004, 6)
  })

  it('stored skip at max minus 1 EALS vault star (game term order)', () => {
    const sources = {
      vaultAttackStars: 2,
      vaultHealthStars: 3,
      primaryAttackPct: 8,
      assistAttackPct: 0,
      primaryHealthPct: 8,
      assistHealthPct: 0,
    }
    const levels = { attackUtilityLevel: 699, healthUtilityLevel: 699, enhancementLevel: 60 }
    const stored = computeWorkshopSkipChances(levels, sources)
    expect(stored.attackPct).toBeCloseTo(70.4, 2)
    expect(stored.healthPct).toBeCloseTo(71.2, 2)
  })

  it('in-run effective at tier 20 matches game run UI 70.35% / 71.15% (dropdown stays 83.36%)', () => {
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
    const levels = { attackUtilityLevel: 699, healthUtilityLevel: 699, enhancementLevel: 60 }
    const stored = computeWorkshopSkipChances(levels, sources)
    expect(stored.attackPct).toBeCloseTo(83.36, 2)
    expect(stored.healthPct).toBeCloseTo(84.16, 2)
    const effective = computeElsInRunEffectiveSkipChances(levels, sources, {
      elsReductionLevel: 35,
      elsReductionUseCampaignHeatScale: true,
      globalBcReductionBenefitIncrease: 0.1,
      elsSkipBcReductionBenefitIncrease: 0.001,
    })
    expect(effective.attackPct).toBeCloseTo(70.35, 2)
    expect(effective.healthPct).toBeCloseTo(71.15, 2)
  })

  it('maxed 4× Ancestral +8% build at L699 matches workshop dropdown 83.36% / 84.16%', () => {
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
    const stored = computeWorkshopSkipChances({
      attackUtilityLevel: 699,
      healthUtilityLevel: 699,
      enhancementLevel: 60,
    }, sources)
    expect(stored.attackPct).toBeCloseTo(83.36, 2)
    expect(stored.healthPct).toBeCloseTo(84.16, 2)
  })

  it('path summary matches stored workshop skip (not tier BC adjusted)', () => {
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
    const stored = computeWorkshopSkipChances({
      attackUtilityLevel: 699,
      healthUtilityLevel: 699,
      enhancementLevel: 60,
    }, sources)
    const path = buildElsUpgradePath({
      attackUtilityLevel: 699,
      healthUtilityLevel: 699,
      enhancementLevel: 60,
      referenceWave: 2,
      resolvedSkipSources: sources,
      tierSkipAdjustments: {
        elsReductionLevel: 35,
        globalBcReductionBenefitIncrease: 0.1,
        elsSkipBcReductionBenefitIncrease: 0.001,
      },
    })
    expect(path.starting.attackPct).toBeCloseTo(stored.attackPct, 4)
    expect(path.starting.healthPct).toBeCloseTo(stored.healthPct, 4)
  })

  it('tier BC subtract is separate from displayed workshop skip (wave stat lookup)', () => {
    const sources = {
      vaultAttackStars: 2,
      vaultHealthStars: 3,
      primaryAttackPct: 8,
      assistAttackPct: 0,
      primaryHealthPct: 8,
      assistHealthPct: 0,
    }
    const levels = { attackUtilityLevel: 699, healthUtilityLevel: 699, enhancementLevel: 60 }
    const stored = computeWorkshopSkipChances(levels, sources)
    const effective = applyElsTierSkipAdjustments(stored, {
      elsReductionLevel: 35,
      elsReductionUseCampaignHeatScale: true,
      globalBcReductionBenefitIncrease: 0.1,
      elsSkipBcReductionBenefitIncrease: 0.001,
    })
    expect(stored.attackPct).toBeCloseTo(70.4, 2)
    expect(effective.attackPct).toBeCloseTo(70.35, 2)
    expect(effective.healthPct).toBeCloseTo(71.15, 2)
  })

  it('matches in-game workshop order of ops at level 680', () => {
    const attack = computeElsTrackSkipChance('attack', 680, 60, {
      vaultAttackStars: 3,
      primaryAttackPct: 8,
      assistAttackPct: 0,
      primaryHealthPct: 0,
      assistHealthPct: 0,
    })
    // workshop.json 680 + vault 3★ + primary 8% (no assist), × ELS+60 — within 1pp of workshop UI 70.35%
    expect(attack * 100).toBeGreaterThan(69.5)
    expect(attack * 100).toBeLessThan(71)
    expect(Math.abs(attack * 100 - 70.35)).toBeLessThan(1)
  })

  it('maxed sources exceed 80% skip with ELS+ multiplier applied', () => {
    const attack = computeElsTrackSkipChance('attack', 699, 59, {
      vaultAttackStars: 3,
      primaryAttackPct: 8,
      assistAttackPct: 8,
      primaryHealthPct: 0,
      assistHealthPct: 0,
      labAttackBenefitIncrease: 2,
    })
    expect(attack).toBeGreaterThan(0.8)
    expect(attack).toBeLessThanOrEqual(1)

    const withoutEnhancement = computeElsTrackSkipChance('attack', 699, 0, {
      vaultAttackStars: 3,
      primaryAttackPct: 8,
      assistAttackPct: 8,
      primaryHealthPct: 0,
      assistHealthPct: 0,
    })
    expect(withoutEnhancement).toBeGreaterThan(0.5)
    expect(withoutEnhancement).toBeLessThan(0.6)
    expect(attack).toBeGreaterThan(withoutEnhancement * 1.5)
  })
})

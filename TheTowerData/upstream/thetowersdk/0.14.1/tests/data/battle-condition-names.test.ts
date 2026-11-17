import { describe, expect, it } from 'vitest'
import {
  canonicalBattleConditionName,
  ELS_REDUCTION_DEFINED_NAME,
  ELS_REDUCTION_TIER_NAME,
} from '../../src/data/battle-conditions/names'
import { V283_HEAT_BC_INDEX } from '../../src/data/generated'
import {
  explainTierBattleConditionLookup,
  getTierBattleConditionLevel,
  TIER_BATTLE_CONDITION_DEFINITIONS,
  TIER_BATTLE_CONDITION_ROWS,
} from '../../src/data/tiers/data'

/**
 * The tier table and the definitions table must agree on what things are called.
 *
 * The defect: `TIER_DATA` used `ELS Reduction` at eleven tiers, the definitions
 * table called the same condition `Skip Reduction - Subtract`, and looking it up
 * by its defined name returned 0 everywhere. Nothing errored.
 */

describe('every name a tier uses is a name that is defined', () => {
  it('leaves no tier condition without a definition', () => {
    const defined = new Set(
      TIER_BATTLE_CONDITION_DEFINITIONS.map(d => canonicalBattleConditionName(d.name)),
    )
    const orphans = [...new Set(TIER_BATTLE_CONDITION_ROWS.map(row => row.name))]
      .filter(name => !defined.has(canonicalBattleConditionName(name)))

    expect(orphans, `tier conditions with no definition: ${orphans.join(', ')}`).toEqual([])
  })

  it('resolves ELS Reduction under BOTH names, at the same level', () => {
    /*
     * The regression that matters. Before the alias, the second of these was 0
     * at every tier while the first was 55 at tier 24.
     */
    const byTierName = getTierBattleConditionLevel(24, ELS_REDUCTION_TIER_NAME)
    const byDefinedName = getTierBattleConditionLevel(24, ELS_REDUCTION_DEFINED_NAME)

    expect(byTierName).toBeGreaterThan(0)
    expect(byDefinedName).toBe(byTierName)
  })

  it('does not make the lookup tolerant of names that are simply wrong', () => {
    // A resolver that accepts anything hides the next drift. Nonsense stays 0.
    expect(getTierBattleConditionLevel(24, 'Elses Reduction')).toBe(0)
    expect(explainTierBattleConditionLookup(24, 'Elses Reduction')).toBe('unknown-condition')
  })
})

describe('a zero says which zero it is', () => {
  it('distinguishes absent, unknown tier, no conditions and a bad name', () => {
    /*
     * `getTierBattleConditionLevel` answers four questions with one number, and
     * only one of the four is a fact about the game. This is the function that
     * tells them apart.
     */
    expect(explainTierBattleConditionLookup(24, ELS_REDUCTION_TIER_NAME)).toBe('present')
    expect(explainTierBattleConditionLookup(24, 'Enemy Speed')).toBe('absent')
    expect(explainTierBattleConditionLookup(99, 'Orb Resistance')).toBe('unknown-tier')
    expect(explainTierBattleConditionLookup(1, 'Orb Resistance')).toBe('tier-has-no-conditions')
    expect(explainTierBattleConditionLookup(24, 'Not A Condition')).toBe('unknown-condition')
  })

  it('agrees with the level lookup wherever it says present', () => {
    for (const row of TIER_BATTLE_CONDITION_ROWS) {
      expect(explainTierBattleConditionLookup(row.tier, row.name)).toBe('present')
      expect(getTierBattleConditionLevel(row.tier, row.name)).toBe(row.level)
    }
  })
})

describe('the heat index map is one condition per slot', () => {
  it('claims no index twice', () => {
    /*
     * It DID, until 2026-08-18: 22, 23 and 27 were each claimed by two
     * conditions, because the map had been read off a per-getter list of every
     * index a function touches rather than the index it owns. Thirteen of
     * twenty-one entries were wrong. The map is now derived from the getter that
     * owns each index, and this test refuses a map with a duplicate.
     */
    const byIndex = new Map<number, string[]>()
    for (const [name, index] of Object.entries(V283_HEAT_BC_INDEX)) {
      byIndex.set(index, [...(byIndex.get(index) ?? []), name])
    }
    const collisions = [...byIndex.entries()]
      .filter(([, names]) => names.length > 1)
      .map(([index, names]) => `${index}: ${names.sort().join(' + ')}`)

    expect(collisions).toEqual([])
  })

  it('pins the condition indexes used by production calculations', () => {
    /*
     * These expected indexes pin the condition mapping used by the calculations.
     * They prevent adjacent conditions from silently exchanging meanings.
     *
     * `elsReduction` is the one used in anger, by tournament-heat-bc.ts. It was
     * already 22 and stayed 22; everything around it moved.
     */
    expect(V283_HEAT_BC_INDEX.elsReduction, 'GetEnemyLevelSkipReductionSubtract').toBe(22)
    expect(V283_HEAT_BC_INDEX.elsReductionMultiply, 'GetEnemyLevelSkipReductionMultiply').toBe(28)
    expect(V283_HEAT_BC_INDEX.rangedUltimate, 'GetRangedUltimateDuration').toBe(21)
    expect(V283_HEAT_BC_INDEX.bossUltimate, 'GetBossesUltimateDuration').toBe(18)
    expect(V283_HEAT_BC_INDEX.skipDecay, 'GetSkipDecayResistance').toBe(27)
    expect(V283_HEAT_BC_INDEX.energyShieldsDown, 'GetEnergyShieldModifier').toBe(12)
  })

  it('numbers the five resistances as one contiguous block with no gap', () => {
    /*
     * The old map had orb/deathRay/thorns/knockback at 1/2/3/8 and no Plasma
     * Cannon at all — the whole block shifted by one, with the fifth resistance
     * dropped. The expected resistance mapping covers all five conditions.
     */
    expect(V283_HEAT_BC_INDEX.orbResistance).toBe(0)
    expect(V283_HEAT_BC_INDEX.deathRayResistance).toBe(1)
    expect(V283_HEAT_BC_INDEX.thornsResistance).toBe(2)
    expect(V283_HEAT_BC_INDEX.knockbackResistance).toBe(3)
    expect(V283_HEAT_BC_INDEX.plasmaCannonResistance).toBe(8)
  })
})

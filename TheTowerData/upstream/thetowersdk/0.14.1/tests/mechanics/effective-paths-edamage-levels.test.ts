import { describe, expect, it } from 'vitest'
import { assistCapacityLevels, SHARED_ASSIST_LEVEL_KEYS, ZERO_EFFECTIVE_DAMAGE_LEVELS } from '../../src/mechanics/effective-paths/edamage-levels'
import { type EffectiveDamageLevels } from '../../src/mechanics/effective-paths/types'
import { EFFECTIVE_DAMAGE_CANDIDATES_BY_PATH } from '../../src/mechanics/effective-paths/edamage-candidates'
import { assistSubstatCap } from '../../src/mechanics/effective-paths/generics'

/**
 * The levels the damage paths move.
 *
 * The assist capacities are the trap here. Three paths list candidates with
 * the same names, and they are not all the same quantity: the lab and coin
 * paths move the *lab* level, the stone path moves a separate stone-bought
 * one, and the two add inside `EPG_ASSIST_SUB_CAP`.
 */

describe('the level shapes', () => {
  it('has one level per candidate on every path', () => {
    const counts = {
      lab: Object.keys(ZERO_EFFECTIVE_DAMAGE_LEVELS.lab).length,
      stone: Object.keys(ZERO_EFFECTIVE_DAMAGE_LEVELS.stone).length,
      coin: Object.keys(ZERO_EFFECTIVE_DAMAGE_LEVELS.coin).length,
      keys: Object.keys(ZERO_EFFECTIVE_DAMAGE_LEVELS.keys).length,
    }
    expect(counts.lab).toBe(EFFECTIVE_DAMAGE_CANDIDATES_BY_PATH.lab.length)
    expect(counts.stone).toBe(EFFECTIVE_DAMAGE_CANDIDATES_BY_PATH.stone.length)
    expect(counts.coin).toBe(EFFECTIVE_DAMAGE_CANDIDATES_BY_PATH.coin.length)
    expect(counts.keys).toBe(EFFECTIVE_DAMAGE_CANDIDATES_BY_PATH.keys.length)
  })

  it('starts every one of them at zero', () => {
    for (const group of Object.values(ZERO_EFFECTIVE_DAMAGE_LEVELS)) {
      for (const [key, value] of Object.entries(group)) {
        expect(value, key).toBe(0)
      }
    }
  })
})

describe('the assist capacities', () => {
  const levels = (): EffectiveDamageLevels => structuredClone(ZERO_EFFECTIVE_DAMAGE_LEVELS)

  it('keeps the stone capacity apart from the lab one', () => {
    // `eDamage Stone!CM5` reads BL41, a stone lookup. `eDamage!CN5` reads
    // BC49, a lab level. Summing them into one number double-counts.
    const state = levels()
    state.lab.assistBonusCannon = 12
    state.stone.assistBonusCannonStone = 40

    const { stoneCap, labCap } = assistCapacityLevels(state, 'assistBonusCannon')
    expect(labCap).toBe(12)
    expect(stoneCap).toBe(40)
    // They add inside the capacity, so the order they were bought in is moot.
    expect(assistSubstatCap(true, stoneCap, labCap)).toBeCloseTo(0.53, 12)
  })

  it('treats a coin-bought capacity as the same lab level', () => {
    // The coin path's candidate reads BC49 too, so it is the lab level under
    // a different currency rather than a third quantity.
    const viaLab = levels()
    viaLab.lab.assistSubstatCore = 20
    const viaCoin = levels()
    viaCoin.coin.assistSubstatCore = 20

    expect(assistCapacityLevels(viaLab, 'assistSubstatCore'))
      .toEqual(assistCapacityLevels(viaCoin, 'assistSubstatCore'))
  })

  it('names a stone twin for every shared capacity', () => {
    for (const key of SHARED_ASSIST_LEVEL_KEYS) {
      expect(ZERO_EFFECTIVE_DAMAGE_LEVELS.lab, key).toHaveProperty(key)
      expect(ZERO_EFFECTIVE_DAMAGE_LEVELS.stone, key).toHaveProperty(`${key}Stone`)
    }
  })

  it('has no Generator capacity, because no damage column reads one', () => {
    // The blank column on the lab matrix, and absent from every path.
    expect(SHARED_ASSIST_LEVEL_KEYS as readonly string[])
      .not.toContain('assistSubstatGenerator')
  })
})

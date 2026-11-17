import { describe, expect, it } from 'vitest'
import { zeroEffectiveEconomyConfig } from '../../src/mechanics/effective-paths/eecon-compute'
import { ZERO_EFFECTIVE_ECONOMY_LEVELS } from '../../src/mechanics/effective-paths/eecon-levels'
import {
  applyOneUwCdPurchase,
  isUwCdCandidateVisible,
  uwCdMaxCooldownSeconds,
  uwCdStoneCost,
  uwCdWeaponsBuyingNext,
  UW_CD_MIN_MAX_COOLDOWN_SECONDS,
} from '../../src/mechanics/effective-paths/eecon-uw-cd'
import { ultimateWeaponStoneCost } from '../../src/mechanics/effective-paths/edamage-costs'

function configWithWeapons(unlocked: {
  gt?: boolean
  bh?: boolean
  dw?: boolean
}) {
  const zero = zeroEffectiveEconomyConfig()
  return {
    ...zero,
    weapons: {
      ...zero.weapons,
      goldenTower: { ...zero.weapons.goldenTower, unlocked: unlocked.gt ?? false },
      blackHole: { ...zero.weapons.blackHole, unlocked: unlocked.bh ?? false },
      deathWave: { ...zero.weapons.deathWave, unlocked: unlocked.dw ?? false },
    },
  }
}

describe('UW CD composite (sheet DW5 / CA5 / DW2)', () => {
  it('matches CA5 = MAX of chart cooldowns among unlocked weapons', () => {
    // Oracle: GT/DW at level 0 are 300s, BH is 200s.
    const stone = ZERO_EFFECTIVE_ECONOMY_LEVELS.stone
    expect(uwCdMaxCooldownSeconds(configWithWeapons({ gt: true, bh: true, dw: true }), stone))
      .toBe(300)
    expect(uwCdMaxCooldownSeconds(configWithWeapons({ bh: true }), stone)).toBe(200)
    expect(uwCdMaxCooldownSeconds(configWithWeapons({}), stone)).toBe(0)
  })

  it('buys only weapons still at the shared maximum', () => {
    // At level 0 with all three: GT and DW sit at 300, BH at 200 — only GT+DW.
    const stone = ZERO_EFFECTIVE_ECONOMY_LEVELS.stone
    const buying = uwCdWeaponsBuyingNext(
      configWithWeapons({ gt: true, bh: true, dw: true }),
      stone,
    ).map(entry => entry.weapon)
    expect(buying).toEqual(['Golden Tower', 'Death Wave'])
  })

  it('prices the first step as the sum of those stone costs', () => {
    const config = configWithWeapons({ gt: true, bh: true, dw: true })
    const stone = ZERO_EFFECTIVE_ECONOMY_LEVELS.stone
    const expected = (ultimateWeaponStoneCost('Golden Tower', 'Cooldown', 1) ?? 0)
      + (ultimateWeaponStoneCost('Death Wave', 'Cooldown', 1) ?? 0)
    expect(uwCdStoneCost(config, stone)).toBe(expected)
    // Oracle: GT CD L1 = 10, DW CD L1 = 8.
    expect(expected).toBe(18)
  })

  it('advances those weapons one stone level', () => {
    const config = configWithWeapons({ gt: true, bh: true, dw: true })
    const next = applyOneUwCdPurchase(config, ZERO_EFFECTIVE_ECONOMY_LEVELS.stone)
    expect(next.goldenTowerCooldownStone).toBe(1)
    expect(next.deathWaveCooldownStone).toBe(1)
    expect(next.blackHoleCooldownStone).toBe(0)
  })

  it('hides when sync is off or CA5 is under 110', () => {
    const config = configWithWeapons({ gt: true, bh: true, dw: true })
    const stone = ZERO_EFFECTIVE_ECONOMY_LEVELS.stone
    expect(isUwCdCandidateVisible(config, stone, false)).toBe(false)
    expect(isUwCdCandidateVisible(config, stone, true)).toBe(true)

    // Drive CA5 below the sheet threshold.
    let low = { ...stone }
    while (uwCdMaxCooldownSeconds(config, low) >= UW_CD_MIN_MAX_COOLDOWN_SECONDS) {
      low = applyOneUwCdPurchase(config, low)
    }
    expect(isUwCdCandidateVisible(config, low, true)).toBe(false)
  })
})

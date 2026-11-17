import { describe, expect, it } from 'vitest'
import { WORKSHOP_DATA } from '../../src/data/workshop/table'
import {
  blackHoleCoinBonus,
  blackHoleCooldown,
  blackHoleDuration,
  coinsCard,
  coinsPerKill,
  coinsPerKillWorkshopValue,
  deathWaveCoinBonus,
  extraOrbMastery,
  freeUpgradeChance,
  galaxyCompressorTimeBoost,
  goldenCombo,
  goldenTowerBonus,
  goldenTowerCooldown,
  goldenTowerDuration,
  maxValueNukeCooldown,
  spotlightCoinBonus,
  spotlightCoverageAngle,
  spotlightQuantity,
  UNPORTED_ECONOMY_FUNCTIONS,
} from '../../src/mechanics/effective-paths/eecon-stats'
import {
  deathWaveCooldownFromStones,
  deathWaveQuantityFromStones,
  ECONOMY_FUNCTIONS_PORTED,
} from '../../src/mechanics/effective-paths/eecon-stats'
import { ultimateWeaponStatValue } from '../../src/mechanics/effective-paths/edamage-costs'
import fixtures from '../../fixtures/mechanics/effective-paths-eecon-stats.fixtures.json'

/**
 * The economy stats against the sheet's own `EPC_*` lambdas.
 *
 * Every expected value here was evaluated by the live sheet rather than worked
 * out by hand, so a disagreement is a porting error and not an argument about
 * rounding.
 */

const close = (actual: number, expected: number, what: string) =>
  expect(actual, what).toBeCloseTo(expected, 8)

describe('EPC_CPK', () => {
  for (const [index, c] of fixtures.coinsPerKill.entries()) {
    it(`matches case ${index}`, () => {
      close(coinsPerKill({
        workshopValue: c.wsVal,
        labLevel: c.labLvl,
        stoneCap: c.stoneCap,
        labCap: c.labCap,
        primarySubstat: c.prim,
        assistSubstat: c.ass,
        enhancementLevel: c.wse,
        hasCoinPerk: c.hasPerk,
        standardPerksBonusLabLevel: c.spb,
        hasCoinTradeOffPerk: c.hasCto,
        improveTradeOffPerksLabLevel: c.ito,
        vaultPct: c.vault,
      }), c.sheet, `case ${index}`)
    })
  }

  it('squares the coin enhancement, which nothing else does', () => {
    // Coins earn it twice, once per kill and once per wave. Every other
    // domain's enhancement is a single `1 + 0.01 × level`.
    const base = {
      workshopValue: 10, labLevel: 0, stoneCap: 0, labCap: 0,
      primarySubstat: 0, assistSubstat: 0, hasCoinPerk: false,
      standardPerksBonusLabLevel: 0, hasCoinTradeOffPerk: false,
      improveTradeOffPerksLabLevel: 0, vaultPct: 0,
    }
    expect(coinsPerKill({ ...base, enhancementLevel: 100 })).toBeCloseTo(10 * 4, 9)
  })
})

describe('EPC_CARD_COINS', () => {
  for (const [index, c] of fixtures.coinsCard.entries()) {
    it(`matches case ${index}`, () => {
      close(coinsCard(c.has, c.val, c.hasMastery, c.lvl), c.sheet, `case ${index}`)
    })
  }

  it('is one without the card, because it multiplies', () => {
    expect(coinsCard(false, 3, true, 9)).toBe(1)
  })
})

describe('EPC_CARD_EOM', () => {
  for (const [index, c] of fixtures.extraOrbMastery.entries()) {
    it(`matches case ${index}`, () => {
      close(extraOrbMastery(c.has, c.lvl, c.hit), c.sheet, `case ${index}`)
    })
  }

  it('caps the hit share at one', () => {
    expect(extraOrbMastery(true, 0, 1.4)).toBeCloseTo(extraOrbMastery(true, 0, 1), 12)
  })
})

describe('EPC_FUP', () => {
  for (const [index, c] of fixtures.freeUpgrade.entries()) {
    it(`matches case ${index}`, () => {
      close(freeUpgradeChance({
        workshopValue: c.wsVal,
        hasFreeUpgradesCard: c.hasCard,
        cardValue: c.cardVal,
        hasPerk: c.hasPerk,
        standardPerksBonusLabLevel: c.spb,
        stoneCap: c.stoneCap,
        labCap: c.labCap,
        primarySubstat: c.prim,
        assistSubstat: c.ass,
        enhancementLevel: c.wse,
        relicPct: c.relic,
        vaultPct: c.vault,
      }), c.sheet, `case ${index}`)
    })
  }
})

describe('EPC_GCOMP', () => {
  for (const [index, c] of fixtures.galaxyCompressor.entries()) {
    it(`matches case ${index}`, () => {
      close(galaxyCompressorTimeBoost({
        workshopValue: c.wsVal,
        labLevel: c.labLvl,
        hasRecoveryCard: c.hasCard,
        cardValue: c.cardVal,
        stoneCap: c.stoneCap,
        labCap: c.labCap,
        primarySubstat: c.prim,
        assistSubstat: c.ass,
        packageAfterBossLevel: c.pab,
        bossWave: c.bossWave,
        galaxyCompressorValue: c.gcomp,
        waveDurationSeconds: c.waveDur,
      }), c.sheet, `case ${index}`)
    })
  }

  it('does nothing without the module', () => {
    expect(galaxyCompressorTimeBoost({
      workshopValue: 0.2, labLevel: 10, hasRecoveryCard: true, cardValue: 0.15,
      stoneCap: 0, labCap: 0, primarySubstat: 0, assistSubstat: 0,
      packageAfterBossLevel: 0, bossWave: 10, galaxyCompressorValue: 0,
      waveDurationSeconds: 35,
    })).toBe(1)
  })
})

describe('the coin weapons', () => {
  const table = [
    ['EPC_GTB', fixtures.goldenTowerBonus, (c: Record<string, never>) => goldenTowerBonus({
      stoneLevel: c.stoneLvl, labLevel: c.labLvl, hasPerk: c.hasPerk,
      stoneCap: c.stoneCap, labCap: c.labCap, primarySubstat: c.prim, assistSubstat: c.ass,
    })],
    ['EPC_GTD', fixtures.goldenTowerDuration, (c: Record<string, never>) => goldenTowerDuration({
      stoneLevel: c.stoneLvl, labLevel: c.labLvl,
      stoneCap: c.stoneCap, labCap: c.labCap, primarySubstat: c.prim, assistSubstat: c.ass,
    })],
    ['EPC_GTCD', fixtures.goldenTowerCooldown, (c: Record<string, never>) => goldenTowerCooldown({
      hasGoldenTower: c.has, stoneLevel: c.stoneLvl,
      stoneCap: c.stoneCap, labCap: c.labCap, primarySubstat: c.prim, assistSubstat: c.ass,
    })],
    ['EPC_GTGC', fixtures.goldenCombo, (c: Record<string, never>) =>
      goldenCombo(c.has, c.stoneLvl, c.kps, c.gtd)],
    ['EPC_BHCB', fixtures.blackHoleCoinBonus, (c: Record<string, never>) =>
      blackHoleCoinBonus(c.labLvl, c.killShare)],
    ['EPC_BHD', fixtures.blackHoleDuration, (c: Record<string, never>) => blackHoleDuration({
      stoneLevel: c.stoneLvl, hasPerk: c.hasPerk,
      stoneCap: c.stoneCap, labCap: c.labCap, primarySubstat: c.prim, assistSubstat: c.ass,
    })],
    ['EPC_BHCD', fixtures.blackHoleCooldown, (c: Record<string, never>) => blackHoleCooldown({
      hasBlackHole: c.has, stoneLevel: c.stoneLvl,
      stoneCap: c.stoneCap, labCap: c.labCap, primarySubstat: c.prim, assistSubstat: c.ass,
    })],
    ['EPC_DWCB', fixtures.deathWaveCoinBonus, (c: Record<string, never>) =>
      deathWaveCoinBonus(c.labLvl)],
    ['EPC_SLCB', fixtures.spotlightCoinBonus, (c: Record<string, never>) =>
      spotlightCoinBonus(c.labLvl)],
    ['EPC_SLA', fixtures.spotlightAngle, (c: Record<string, never>) => spotlightCoverageAngle({
      stoneLevel: c.stoneLvl, stoneCap: c.stoneCap, labCap: c.labCap,
      primarySubstat: c.prim, assistSubstat: c.ass,
    })],
    ['EPC_SLQ', fixtures.spotlightQuantity, (c: Record<string, never>) =>
      spotlightQuantity(c.stoneLvl)],
  ] as const

  for (const [name, cases, run] of table) {
    describe(name, () => {
      for (const [index, c] of (cases as Array<Record<string, never>>).entries()) {
        it(`matches case ${index}`, () => {
          close(run(c), (c as { sheet: number }).sheet, `${name} case ${index}`)
        })
      }
    })
  }

  it('gives a locked weapon no cooldown at all, not its base', () => {
    // The caller divides by it, and a weapon that never fires has no cycle.
    const off = {
      stoneLevel: 10, stoneCap: 0, labCap: 0, primarySubstat: 0, assistSubstat: 0,
    }
    expect(goldenTowerCooldown({ ...off, hasGoldenTower: false })).toBe(0)
    expect(blackHoleCooldown({ ...off, hasBlackHole: false })).toBe(0)
  })
})

describe('EPC_MVN', () => {
  for (const [index, c] of fixtures.maxValueNuke.entries()) {
    it(`matches case ${index}`, () => {
      close(maxValueNukeCooldown({
        primaryModuleValue: c.mvn,
        assistModuleValue: c.assMvn,
        goldenTowerCooldown: c.gt,
        blackHoleCooldown: c.bh,
        deathWaveCooldown: c.dw,
        ultimateWeaponCount: c.count,
      }), c.sheet, `case ${index}`)
    })
  }

  it('rounds a half to even, which the sheet writes out longhand', () => {
    // 2.5 goes to 2 and 3.5 goes to 4 — `Math.round` would give 3 and 4.
    const at = (total: number) => maxValueNukeCooldown({
      primaryModuleValue: 0.5, assistModuleValue: 0,
      goldenTowerCooldown: total, blackHoleCooldown: 0, deathWaveCooldown: 0,
      ultimateWeaponCount: 1,
    })
    expect(at(2)).toBe(2)
    expect(at(3)).toBe(4)
  })

  it('is zero without the module', () => {
    expect(maxValueNukeCooldown({
      primaryModuleValue: 0, assistModuleValue: 0,
      goldenTowerCooldown: 300, blackHoleCooldown: 200, deathWaveCooldown: 300,
      ultimateWeaponCount: 3,
    })).toBe(0)
  })
})

describe('the assist share every one of them uses', () => {
  it('is the same quantity the other two domains already compute', () => {
    // The econ tabs spell `EPG_ASSIST_SUB_CAP` out inline rather than calling
    // it, so this checks the port reuses the shared helper instead of growing
    // a third copy that can drift. A maxed pair counts 91% of the assist half.
    const maxed = spotlightCoverageAngle({
      stoneLevel: 0, stoneCap: 60, labCap: 30, primarySubstat: 0, assistSubstat: 4,
    })
    expect(maxed).toBeCloseTo(30 + 4 + 4 * 0.91, 12)
  })
})

describe('EPU_DWCD and EPU_DWQ', () => {
  for (const [index, c] of fixtures.deathWaveCooldown.entries()) {
    it(`matches cooldown case ${index}`, () => {
      close(deathWaveCooldownFromStones({
        hasDeathWave: c.has, stoneLevel: c.stoneLvl,
        stoneCap: c.stoneCap, labCap: c.labCap,
        primarySubstat: c.prim, assistSubstat: c.ass,
      }), c.sheet, `cooldown ${index}`)
    })
  }

  for (const [index, c] of fixtures.deathWaveQuantity.entries()) {
    it(`matches quantity case ${index}`, () => {
      close(deathWaveQuantityFromStones({
        stoneLevel: c.stoneLvl, hasPerk: c.hasPerk,
        stoneCap: c.stoneCap, labCap: c.labCap,
        primarySubstat: c.prim, assistSubstat: c.ass,
      }), c.sheet, `quantity ${index}`)
    })
  }

  it('floors the assist half on its own, not the sum', () => {
    // `prim + FLOOR(ass × SAC)`. Flooring the sum would be a different number
    // whenever the primary has a fractional part, and nothing else in either
    // family floors anything.
    const shared = { stoneLevel: 0, hasPerk: false, stoneCap: 99, labCap: 0 }
    // SAC is 1.0 at a stone cap of 99, so the assist half is 1.7 → 1.
    expect(deathWaveQuantityFromStones({ ...shared, primarySubstat: 0.6, assistSubstat: 1.7 }))
      .toBeCloseTo(1 + 0.6 + 1, 9)
  })

  it('agrees with the stone chart about Death Wave’s cooldown', () => {
    /**
     * The two halves of the port derive the same stat differently — the damage
     * side reads the chart, the econ side computes `300 - 10 × level`. If those
     * ever disagree, one of the two domains is wrong about the same weapon.
     */
    for (const level of [0, 1, 5, 10, 15, 20]) {
      const chart = ultimateWeaponStatValue('Death Wave', 'Cooldown', level)
      if (chart === null) continue
      expect(chart, `level ${level}`).toBeCloseTo(300 - 10 * level, 9)
    }
  })
})

describe('the function inventory', () => {
  it('accounts for all twenty-six, ported or not', () => {
    // Enumerating `EPC_*` alone misses the two `EPU_*` the tab also calls,
    // which is how the first pass came to claim "17 of 24".
    expect(ECONOMY_FUNCTIONS_PORTED).toHaveLength(25)
    expect(UNPORTED_ECONOMY_FUNCTIONS).toHaveLength(1)

    const all = [...ECONOMY_FUNCTIONS_PORTED, ...UNPORTED_ECONOMY_FUNCTIONS.map(e => e.name)]
    expect(new Set(all).size, 'a name is listed twice').toBe(all.length)
    expect(all.filter(name => name.startsWith('EPC_'))).toHaveLength(24)
    expect(all.filter(name => name.startsWith('EPU_'))).toHaveLength(2)
  })

  it('says why each unported one needs more than arithmetic', () => {
    for (const entry of UNPORTED_ECONOMY_FUNCTIONS)
      expect(entry.reason.length, entry.name).toBeGreaterThan(20)
  })
})

describe('the Coins / Kill Bonus workshop value', () => {
  it('matches the game table at every level', () => {
    // `workshopStatValue` refuses this stat because `DVT_WS_VALUE`'s formula
    // for it is stale. The economy tab computes it inline instead, and that
    // form is the game's own curve — which is why deriving it here is sound.
    const rows = WORKSHOP_DATA['Coins / Kill Bonus']
    const levels = Object.keys(rows).map(Number).sort((a, b) => a - b)
    expect(levels.length).toBeGreaterThan(100)
    for (const level of levels)
      expect(coinsPerKillWorkshopValue(level), `level ${level}`)
        .toBeCloseTo(rows[String(level)].value, 9)
  })

  it('refuses to read a level as a discount', () => {
    expect(coinsPerKillWorkshopValue(-5)).toBe(1)
  })
})

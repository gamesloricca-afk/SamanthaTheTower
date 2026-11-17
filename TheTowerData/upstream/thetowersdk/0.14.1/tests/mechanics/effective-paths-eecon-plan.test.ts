import { describe, expect, it } from 'vitest'
import {
  DISCOUNT_PATH_UNSUPPORTED,
  EFFECTIVE_ECONOMY_UPGRADES,
  planEffectiveEconomyPath,
} from '../../src/mechanics/effective-paths/eecon-plan'
import type { EffectiveEconomyPlanVariant } from '../../src/mechanics/effective-paths/types'
import { EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH } from '../../src/mechanics/effective-paths/eecon-candidates'
import { ZERO_EFFECTIVE_ECONOMY_LEVELS } from '../../src/mechanics/effective-paths/eecon-levels'
import type { EffectiveEconomyLevels } from '../../src/mechanics/effective-paths/types'
import { zeroEffectiveEconomyConfig } from '../../src/mechanics/effective-paths/eecon-compute'
import type { EffectiveEconomyConfig } from '../../src/mechanics/effective-paths/types'

/**
 * The eEcon planner.
 *
 * The thing worth asserting is that nothing is dropped silently: every
 * candidate either gets a price and a cap, or appears in `excluded` with a
 * reason. Three of the stone tab's nineteen genuinely cannot be planned, and
 * saying which is more useful than quietly ranking eighteen.
 */

/** The three that are planned. `discount` is refused — see the test below. */
const VARIANTS: readonly EffectiveEconomyPlanVariant[] = ['time', 'coin', 'stone']

/** A player far enough along that most candidates are live. */
function developedConfig(): EffectiveEconomyConfig {
  const zero = zeroEffectiveEconomyConfig()
  return {
    ...zero,
    unlockedUltimateWeaponCount: 12,
    baseCoinsPerKill: 1,
    waveDurationSeconds: 35,
    timeMultiplier: 1,
    coinsPerKill: { value: 12, relicPct: 0.05, vaultPct: 0.05 },
    freeUpgradeAttack: { value: 0.1, relicPct: 0, vaultPct: 0 },
    freeUpgradeDefense: { value: 0.1, relicPct: 0, vaultPct: 0 },
    freeUpgradeUtility: { value: 0.1, relicPct: 0, vaultPct: 0 },
    recoveryPackageChance: { value: 0.05, relicPct: 0, vaultPct: 0 },
    generator: { bonus: 1.5, hasAssist: true, coreHasAssist: true, assistBonus: 1.3 },
    weapons: {
      goldenTower: { unlocked: true, bonus: 8, duration: 20, cooldown: 120, goldenCombo: 3 },
      blackHole: { unlocked: true, duration: 15, cooldown: 100 },
      deathWave: { unlocked: true, quantity: 2, cooldown: 150 },
      spotlight: { unlocked: true, angle: 30, quantity: 2 },
      goldBot: { unlocked: true, bonus: 3, duration: 20, cooldown: 90 },
    },
    estimates: {
      blackHoleKillShare: 0.8,
      killsPerSecond: 6,
      goldBotKillShare: 0.7,
      goldBotSyncRatio: 1,
      bossWaveInterval: 10,
      extraOrbTagShare: 0.9,
    },
  }
}

/** Levels high enough that the module candidates are in coin range. */
function developedLevels(): EffectiveEconomyLevels {
  const base = ZERO_EFFECTIVE_ECONOMY_LEVELS
  return {
    ...base,
    time: {
      ...base.time,
      primaryModuleGenerator: 200,
      assistModuleGenerator: 200,
      // `eEcon Stones!DQ2` / `DT2` hide BH and SL stone stats until these are ≥1.
      blackHoleCoinBonus: 1,
      spotlightCoinBonus: 1,
    },
  }
}

describe('the candidate lists pair with their levels', () => {
  it('covers every candidate on every path exactly once', () => {
    const total = EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH.time.length
      + EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH.stone.length
      + EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH.discount.length
    expect(EFFECTIVE_ECONOMY_UPGRADES).toHaveLength(total)
    expect(new Set(EFFECTIVE_ECONOMY_UPGRADES.map(u => u.id)).size)
      .toBe(EFFECTIVE_ECONOMY_UPGRADES.length)
  })

  it('gives the time path both prices and the others one', () => {
    const time = EFFECTIVE_ECONOMY_UPGRADES.filter(u => u.variants.includes('time'))
    expect(time).toHaveLength(EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH.time.length)
    for (const upgrade of time) expect(upgrade.variants).toContain('coin')
  })
})

describe('nothing is dropped without a reason', () => {
  for (const variant of VARIANTS) {
    it(`prices or explains every candidate on the ${variant} path`, () => {
      const plan = planEffectiveEconomyPath({
        config: developedConfig(),
        levels: developedLevels(),
        variant,
        steps: 1,
      })

      const offered = EFFECTIVE_ECONOMY_UPGRADES.filter(u => u.variants.includes(variant))
      const unpriced = plan.excluded.filter(e => e.reason === 'no maximum level known')

      // A candidate with no known cap is a hole in the cost mapping, as opposed
      // to the three that are excluded for reasons the sheet itself gives.
      expect(unpriced, JSON.stringify(unpriced)).toHaveLength(0)
      expect(offered.length).toBeGreaterThan(0)
    })
  }

  it('leaves UW CD off until cooldowns are kept synced', () => {
    const plan = planEffectiveEconomyPath({
      config: developedConfig(), levels: developedLevels(), variant: 'stone', steps: 1,
    })

    const reasons = new Map(plan.excluded.map(e => [e.sheetName, e.reason]))
    expect(reasons.get('UW CD')).toMatch(/individually/)
  })

  it('plans UW CD once cooldowns are kept synced', () => {
    const plan = planEffectiveEconomyPath({
      config: developedConfig(),
      levels: developedLevels(),
      variant: 'stone',
      steps: 5,
      keepCooldownsSynced: true,
    })
    const reasons = new Map(plan.excluded.map(e => [e.sheetName, e.reason]))
    expect(reasons.get('UW CD') ?? '').not.toMatch(/individually|110|more than one/)
    // With GT/BH/DW unlocked at CD level 0, CA5 is 300 — the composite is live.
    expect(plan.excluded.some(e => e.sheetName === 'UW CD')).toBe(false)
  })

  it('prices the five card masteries on the stone path when their cards are live', () => {
    const plan = planEffectiveEconomyPath({
      config: {
        ...developedConfig(),
        cards: {
          ...developedConfig().cards,
          coins: { active: true, value: 1.5, level: 5 },
          waveSkip: { active: true, value: 0.15, level: 5 },
          introSprint: { active: true, value: 20, level: 5 },
        },
      },
      levels: developedLevels(),
      variant: 'stone',
      steps: 5,
    })
    const reasons = new Map(plan.excluded.map(e => [e.sheetName, e.reason]))
    for (const mastery of [
      'Coins Mastery', 'Extra Orb Mastery', 'Wave Skip Mastery',
      'Intro Sprint Mastery', 'Wave Accelerator Mastery',
    ]) {
      expect(reasons.get(mastery) ?? '', mastery).not.toMatch(/unported|not equipped|already unlocked/)
    }
  })

  it('leaves a mastery off once the card mastery is unlocked', () => {
    const plan = planEffectiveEconomyPath({
      config: {
        ...developedConfig(),
        cards: {
          ...developedConfig().cards,
          coins: { active: true, value: 1.5, level: 5 },
          // `masteryUnlocked`, not `active`: the sheet's hide row reads
          // `IDS_CARD_MASTERY`, never the equipped toggle.
          coinsMastery: { active: true, value: 1, level: 1, masteryUnlocked: true },
          extraOrbMastery: { active: true, value: 1, level: 1, masteryUnlocked: true },
        },
      },
      levels: developedLevels(),
      variant: 'stone',
      steps: 5,
    })
    const reasons = new Map(plan.excluded.map(e => [e.sheetName, e.reason]))
    expect(reasons.get('Coins Mastery')).toMatch(/already unlocked/)
    expect(reasons.get('Extra Orb Mastery')).toMatch(/already unlocked/)
  })
})

describe('planning a path', () => {
  for (const variant of VARIANTS) {
    it(`produces improving steps on the ${variant} path`, () => {
      const plan = planEffectiveEconomyPath({
        config: developedConfig(),
        levels: developedLevels(),
        variant,
        steps: 12,
      })

      expect(plan.steps.length).toBeGreaterThan(0)
      for (const step of plan.steps) {
        expect(step.cost, `${variant} ${step.name}`).toBeGreaterThan(0)
        expect(Number.isFinite(step.roi), `${variant} ${step.name}`).toBe(true)
      }

      // Every step is on a path this variant is allowed to buy from.
      const allowed = new Set(
        EFFECTIVE_ECONOMY_UPGRADES.filter(u => u.variants.includes(variant)).map(u => u.id),
      )
      for (const step of plan.steps) expect(allowed.has(step.id), step.name).toBe(true)
    })
  }

  it('never goes backwards', () => {
    const plan = planEffectiveEconomyPath({
      config: developedConfig(), levels: developedLevels(), variant: 'time', steps: 25,
    })
    for (const [index, step] of plan.steps.entries()) {
      if (index === 0) continue
      expect(step.value, `step ${index + 1}`).toBeGreaterThanOrEqual(plan.steps[index - 1].value)
    }
  })

  it('takes the best return first', () => {
    const plan = planEffectiveEconomyPath({
      config: developedConfig(), levels: developedLevels(), variant: 'stone', steps: 20,
    })
    expect(plan.steps[0].roi).toBeGreaterThanOrEqual(plan.steps.at(-1)?.roi ?? 0)
  })

  it('respects a stop the player set', () => {
    const plan = planEffectiveEconomyPath({
      config: developedConfig(),
      levels: developedLevels(),
      variant: 'time',
      steps: 40,
      targetLevels: { 'time.coinsPerKillBonus': 0 },
    })
    expect(plan.steps.some(step => step.id === 'time.coinsPerKillBonus')).toBe(false)
  })

  it('leaves module levels alone below where coins beat shards', () => {
    const plan = planEffectiveEconomyPath({
      config: developedConfig(),
      levels: ZERO_EFFECTIVE_ECONOMY_LEVELS,
      variant: 'coin',
      steps: 5,
    })
    const reasons = plan.excluded
      .filter(e => e.sheetName.includes('Module - Generator'))
      .map(e => e.reason)
    expect(reasons).toHaveLength(2)
    for (const reason of reasons) expect(reason).toMatch(/shards are cheaper/)
  })
})

describe('the two prices of the time path', () => {
  it('ranks the same candidates whether measured in days or coins', () => {
    // One candidate list, two currencies — the paths can differ in order, but
    // neither may offer something the other cannot.
    const options = { config: developedConfig(), levels: developedLevels(), steps: 10 }
    const days = planEffectiveEconomyPath({ ...options, variant: 'time' })
    const coins = planEffectiveEconomyPath({ ...options, variant: 'coin' })

    expect(days.startingEffectiveEconomy).toBeCloseTo(coins.startingEffectiveEconomy, 9)
    expect(days.steps.length).toBe(coins.steps.length)
  })
})

describe('the discount path', () => {
  it('refuses rather than ranking every candidate at a zero gain', () => {
    // Nothing on the discount tab moves coins per kill, so scoring it the way
    // the other three are scored yields a plan of zeroes rather than an error.
    // Refusing is what stops that reaching a page.
    expect(() => planEffectiveEconomyPath({
      config: developedConfig(), levels: developedLevels(), variant: 'discount', steps: 5,
    })).toThrowError(DISCOUNT_PATH_UNSUPPORTED)
  })

  it('keeps its candidate list, which is data and still correct', () => {
    expect(EFFECTIVE_ECONOMY_UPGRADES.filter(u => u.variants.includes('discount')))
      .toHaveLength(EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH.discount.length)
  })
})

describe('a weapon the player does not own', () => {
  /** The zero config owns nothing, which is a fresh account. */
  const locked = () => zeroEffectiveEconomyConfig()

  it('leaves its candidates off the stone path instead of ranking them at zero', () => {
    // This is what had an account with no ultimate weapons being told to buy
    // Golden Tower Bonus twenty-five times: a locked weapon contributes
    // nothing, so every candidate tied at a gain of zero and the tie-break
    // filled the path in column order.
    const plan = planEffectiveEconomyPath({
      config: locked(), levels: ZERO_EFFECTIVE_ECONOMY_LEVELS, variant: 'stone', steps: 25,
    })

    const reasons = new Map(plan.excluded.map(entry => [entry.sheetName, entry.reason]))
    expect(reasons.get('GT Bonus')).toMatch(/not unlocked/)
    expect(reasons.get('DW Quantity')).toMatch(/not unlocked/)

    // The assist capacities are module ladders and need no weapon, so the path
    // is not empty — it just no longer opens with a weapon nobody owns.
    for (const step of plan.steps) {
      expect(/^(GT|BH|DW|SL) /.test(step.name), step.name).toBe(false)
    }
  })

  it('leaves the time path’s coin-bonus labs out too', () => {
    const plan = planEffectiveEconomyPath({
      config: locked(), levels: ZERO_EFFECTIVE_ECONOMY_LEVELS, variant: 'time', steps: 5,
    })
    const reasons = new Map(plan.excluded.map(entry => [entry.sheetName, entry.reason]))
    for (const name of [
      'Golden Tower Bonus', 'Black Hole Coin Bonus', 'Death Wave Coin Bonus',
      'Spotlight Coin Bonus',
    ]) {
      expect(reasons.get(name), name).toMatch(/not unlocked/)
    }
    // Everything that does not need a weapon still plans.
    expect(plan.steps.length).toBeGreaterThan(0)
  })

  it('keeps them once the weapon is owned', () => {
    const plan = planEffectiveEconomyPath({
      config: developedConfig(), levels: developedLevels(), variant: 'stone', steps: 10,
    })
    const reasons = plan.excluded.map(entry => entry.reason)
    expect(reasons.filter(reason => /not unlocked/.test(reason))).toHaveLength(0)
    expect(plan.steps.length).toBeGreaterThan(0)
  })
})

describe('the two stone gates read off eEcon Stones!DM2:DQ2', () => {
  it('keeps Golden Combo off the path below nine ultimate weapons', () => {
    // `DP2` hides it on `COUNTIF(… "UW Unlocked") <= 8`. The cost table still
    // prices the stat, so nothing else would stop the planner offering it.
    const plan = planEffectiveEconomyPath({
      config: { ...developedConfig(), unlockedUltimateWeaponCount: 8 },
      levels: developedLevels(),
      variant: 'stone',
      steps: 20,
    })
    const reasons = new Map(plan.excluded.map(entry => [entry.sheetName, entry.reason]))
    expect(reasons.get('GT Golden Combo')).toMatch(/nine ultimate weapons|9 ultimate weapons/)
    expect(plan.steps.some(step => step.name === 'GT Golden Combo')).toBe(false)
  })

  it('offers it at nine', () => {
    const plan = planEffectiveEconomyPath({
      config: { ...developedConfig(), unlockedUltimateWeaponCount: 9 },
      levels: developedLevels(),
      variant: 'stone',
      steps: 20,
    })
    expect(plan.excluded.some(entry => entry.sheetName === 'GT Golden Combo')).toBe(false)
  })

  it('takes the three cooldowns off when they are kept synced', () => {
    const plan = planEffectiveEconomyPath({
      config: developedConfig(),
      levels: developedLevels(),
      variant: 'stone',
      steps: 20,
      keepCooldownsSynced: true,
    })
    const reasons = new Map(plan.excluded.map(entry => [entry.sheetName, entry.reason]))
    for (const name of ['GT Cooldown', 'BH Cooldown', 'DW Cooldown']) {
      expect(reasons.get(name), name).toMatch(/synced/)
    }
    // And the composite that replaces them is available to plan.
    expect(reasons.get('UW CD') ?? '').not.toMatch(/synced|110/)
  })

  it('hides UW CD once the longest cooldown is under 110 seconds', () => {
    // Chart: 300 - 10*level; level 20 → 100s. All three at 20 ⇒ CA5 = 100.
    const plan = planEffectiveEconomyPath({
      config: developedConfig(),
      levels: {
        ...developedLevels(),
        stone: {
          ...developedLevels().stone,
          goldenTowerCooldownStone: 20,
          blackHoleCooldownStone: 20,
          deathWaveCooldownStone: 20,
        },
      },
      variant: 'stone',
      steps: 5,
      keepCooldownsSynced: true,
    })
    const reasons = new Map(plan.excluded.map(entry => [entry.sheetName, entry.reason]))
    expect(reasons.get('UW CD')).toMatch(/110/)
  })

  it('hides assist candidates until an assist module is equipped', () => {
    const plan = planEffectiveEconomyPath({
      config: {
        ...developedConfig(),
        generator: { ...developedConfig().generator, hasAssist: false, coreHasAssist: false },
      },
      levels: developedLevels(),
      variant: 'stone',
      steps: 20,
    })
    const reasons = new Map(plan.excluded.map(entry => [entry.sheetName, entry.reason]))
    for (const name of [
      'Assist Module Bonus - Generator',
      'Assist Module Substats - Generator',
      'Assist Module Substats - Core',
    ]) {
      expect(reasons.get(name), name).toMatch(/assist module/)
    }
  })

  it('hides Recovery Package Chance without Galaxy Compressor', () => {
    // `eEcon!DW2` opens with `AO7+AS7=0`.
    const plan = planEffectiveEconomyPath({
      config: developedConfig(),
      levels: developedLevels(),
      variant: 'time',
      steps: 20,
    })
    const reasons = new Map(plan.excluded.map(entry => [entry.sheetName, entry.reason]))
    expect(reasons.get('Recovery Package Chance')).toMatch(/prerequisite/)
  })

  it('hides time-path Coins Mastery until the card mastery is unlocked', () => {
    // Opposite of the stone path: `ED2` is `NOT(AZ32)`, and AZ32 needs mastery on.
    const plan = planEffectiveEconomyPath({
      config: {
        ...developedConfig(),
        cards: {
          ...developedConfig().cards,
          coins: { active: true, value: 1.5, level: 5 },
          coinsMastery: { active: false, value: 1, level: 0 },
        },
      },
      levels: developedLevels(),
      variant: 'time',
      steps: 20,
    })
    const reasons = new Map(plan.excluded.map(entry => [entry.sheetName, entry.reason]))
    expect(reasons.get('Coins Mastery')).toMatch(/prerequisite/)
  })

  it('gates Gold Bot - Duration on owning the bot', () => {
    // Was misspelled `Gold Bot Duration` and never matched the sheet name.
    const plan = planEffectiveEconomyPath({
      config: {
        ...developedConfig(),
        weapons: {
          ...developedConfig().weapons,
          goldBot: { ...developedConfig().weapons.goldBot, unlocked: false },
        },
      },
      levels: developedLevels(),
      variant: 'time',
      steps: 20,
    })
    const reasons = new Map(plan.excluded.map(entry => [entry.sheetName, entry.reason]))
    expect(reasons.get('Gold Bot - Duration')).toMatch(/weapon is not unlocked/)
  })

  it('hides BH and SL stone stats until their coin-bonus lab is started', () => {
    // `DQ2` / `DR2` open with `BE20=0` (Black Hole Coin Bonus); `DT2` / `DU2`
    // open with `BE21=0` (Spotlight Coin Bonus). Without this the stone path
    // ranks duration and angle upgrades whose econ gain is still zero.
    const plan = planEffectiveEconomyPath({
      config: developedConfig(),
      levels: {
        ...developedLevels(),
        time: {
          ...developedLevels().time,
          blackHoleCoinBonus: 0,
          spotlightCoinBonus: 0,
        },
      },
      variant: 'stone',
      steps: 20,
    })
    const reasons = new Map(plan.excluded.map(entry => [entry.sheetName, entry.reason]))
    expect(reasons.get('BH Duration')).toMatch(/Black Hole Coin Bonus/)
    expect(reasons.get('BH Cooldown')).toMatch(/Black Hole Coin Bonus/)
    expect(reasons.get('SL Angle')).toMatch(/Spotlight Coin Bonus/)
    expect(reasons.get('SL Quantity')).toMatch(/Spotlight Coin Bonus/)
    expect(plan.steps.some(step => step.name === 'BH Duration')).toBe(false)
    expect(plan.steps.some(step => step.name === 'SL Angle')).toBe(false)
  })

  it('offers BH and SL stone stats once those labs are started', () => {
    const plan = planEffectiveEconomyPath({
      config: developedConfig(),
      levels: developedLevels(),
      variant: 'stone',
      steps: 20,
    })
    const reasons = new Map(plan.excluded.map(entry => [entry.sheetName, entry.reason]))
    expect(reasons.get('BH Duration') ?? '').not.toMatch(/Black Hole Coin Bonus/)
    expect(reasons.get('SL Angle') ?? '').not.toMatch(/Spotlight Coin Bonus/)
  })

  it('hides Coin Bonus until Utility enhancement spend clears 50B', () => {
    // Wiki + `eEcon!EO2`: `WSPUTILITY_TOTAL_COINS_INVESTED(...)<=50000000000`.
    // Cash Bonus 9 = 49.01B (locked); Cash Bonus 10 = 55.54B (open).
    const locked = planEffectiveEconomyPath({
      config: developedConfig(),
      levels: developedLevels(),
      variant: 'time',
      steps: 20,
      workshopEnhancementsUnlocked: true,
      enhancementLevels: { 'Cash Bonus': 9 },
    })
    const unlocked = planEffectiveEconomyPath({
      config: developedConfig(),
      levels: developedLevels(),
      variant: 'time',
      steps: 20,
      workshopEnhancementsUnlocked: true,
      enhancementLevels: { WSP_CASH_BONUS: 10 },
    })
    const lockedReasons = new Map(locked.excluded.map(e => [e.sheetName, e.reason]))
    const unlockedReasons = new Map(unlocked.excluded.map(e => [e.sheetName, e.reason]))
    expect(lockedReasons.get('Coin Bonus')).toMatch(/Utility enhancements/)
    expect(unlockedReasons.get('Coin Bonus') ?? '').not.toMatch(/Utility enhancements/)
  })

  it('hides Free Upgrades until Utility spend clears 5T', () => {
    // Wiki + `eEcon!EP2`: `<=5000000000000`. Cash Bonus 30 is under; 35 clears.
    const withDigestor = {
      ...developedConfig(),
      uniques: {
        ...developedConfig().uniques,
        blackHoleDigestor: { primary: 1, assist: 0 },
      },
    }
    const locked = planEffectiveEconomyPath({
      config: withDigestor,
      levels: developedLevels(),
      variant: 'time',
      steps: 20,
      workshopEnhancementsUnlocked: true,
      enhancementLevels: { 'Cash Bonus': 30 },
    })
    const unlocked = planEffectiveEconomyPath({
      config: withDigestor,
      levels: developedLevels(),
      variant: 'time',
      steps: 20,
      workshopEnhancementsUnlocked: true,
      enhancementLevels: { 'Cash Bonus': 35 },
    })
    const lockedReasons = new Map(locked.excluded.map(e => [e.sheetName, e.reason]))
    const unlockedReasons = new Map(unlocked.excluded.map(e => [e.sheetName, e.reason]))
    expect(lockedReasons.get('Free Upgrades')).toMatch(/Utility enhancements/)
    expect(unlockedReasons.get('Free Upgrades') ?? '').not.toMatch(/Utility enhancements/)
  })
})

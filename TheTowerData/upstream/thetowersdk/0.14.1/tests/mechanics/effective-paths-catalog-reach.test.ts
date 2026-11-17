import { describe, expect, it } from 'vitest'
import { DAMAGE_PLAN_VARIANTS, planEffectiveDamagePath } from '../../src/mechanics/effective-paths/edamage-plan'
import { ECONOMY_PLAN_VARIANTS, planEffectiveEconomyPath } from '../../src/mechanics/effective-paths/eecon-plan'
import { HEALTH_PATH_VARIANTS, planEffectiveHealthPath } from '../../src/mechanics/effective-paths/ehp-plan'
import {
  planEffectiveRegenPath,
  REGEN_PATH_VARIANTS,
  ZERO_EFFECTIVE_REGEN_LEVELS,
} from '../../src/mechanics/effective-paths/regen-plan'
import { zeroEffectiveDamageConfig } from '../../src/mechanics/effective-paths/edamage-config'
import { ZERO_EFFECTIVE_DAMAGE_LEVELS } from '../../src/mechanics/effective-paths/edamage-levels'
import { ZERO_EFFECTIVE_ECONOMY_LEVELS } from '../../src/mechanics/effective-paths/eecon-levels'
import { zeroEffectiveEconomyConfig } from '../../src/mechanics/effective-paths/eecon-compute'
import {
  ZERO_EFFECTIVE_HEALTH_LEVELS,
  zeroEffectiveHealthConfig,
  zeroEffectiveRegenConfigSource,
} from '../../src/mechanics/effective-paths/ehp-model'
import type { PathExclusion } from '../../src/mechanics/effective-paths/types'

/**
 * Every candidate resolves to something the cost catalogs know.
 *
 * ## The failure this catches
 *
 * A candidate is a **name**. The planners look that name up in the lab, stone,
 * coin and keys catalogs, and a name that does not resolve comes back with no
 * maximum level and no price — so the candidate is dropped. The path is one
 * upgrade shorter and nothing says which one or why it matters.
 *
 * The names do not always match, which is what makes this live rather than
 * theoretical: the sheet calls Chain Lightning's lab `Shock Multiplier` and the
 * catalog calls it `chain_lightning_shock_multiplier`, so there is an alias
 * table. Add a candidate, spell it the sheet's way, forget the alias, and it
 * silently never appears.
 *
 * So: on an account with **nothing bought and nothing in the way**, no
 * candidate may be excluded for want of a price. Every other exclusion reason
 * is about the player — a locked weapon, a maxed lab, a switch — and belongs.
 */

/** Reasons that mean "the catalog does not know this", not "you cannot buy it". */
const UNPRICED = /no maximum level known|no price|not a cost/i

function unpricedIn(excluded: readonly PathExclusion[]): string[] {
  return excluded.filter(entry => UNPRICED.test(entry.reason))
    .map(entry => `${entry.sheetName} — ${entry.reason}`)
}

/**
 * A config with **nothing in the way**, which is what this file needs.
 *
 * A zero config is not it. On a zero account every weapon is locked, every card
 * is off and perks do not apply, so a weapon-gated candidate is excluded for
 * *that* long before anything tries to price it — and a name that no longer
 * resolves would sail through unnoticed.
 *
 * Found by removing the `Shock Multiplier` alias and watching this file stay
 * green: the candidate was already out for Chain Lightning being locked.
 */
function everythingAvailableDamage() {
  const config = zeroEffectiveDamageConfig()
  for (const weapon of Object.values(config.ultimateWeapons)) {
    (weapon as { unlocked: boolean }).unlocked = true
  }
  for (const card of Object.values(config.cards)) {
    (card as { active: boolean, level: number }).active = true
    ;(card as { active: boolean, level: number }).level = 1
  }
  config.cardsEquipped = true
  config.perksEquipped = true
  for (const perk of Object.keys(config.perks)) {
    (config.perks as Record<string, boolean>)[perk] = true
  }
  config.shockMultiplierUnlocked = true
  config.hasRendArmour = true
  config.chronoFieldEnabled = true
  return config
}

function everythingAvailableEconomy() {
  const config = zeroEffectiveEconomyConfig()
  for (const weapon of Object.values(config.weapons)) {
    (weapon as { unlocked: boolean }).unlocked = true
  }
  // Golden Combo needs more than eight weapons owned before it is offered.
  config.unlockedUltimateWeaponCount = 12
  config.perksEquipped = true
  return config
}

const regen = zeroEffectiveRegenConfigSource()

const PLANS = [
  ...DAMAGE_PLAN_VARIANTS.map(variant => ({
    family: `damage/${variant}`,
    run: () => planEffectiveDamagePath({
      config: everythingAvailableDamage(),
      levels: ZERO_EFFECTIVE_DAMAGE_LEVELS,
      variant,
      coinsPerHour: 5_000_000,
      steps: 1,
    }),
  })),
  ...ECONOMY_PLAN_VARIANTS.filter(variant => variant !== 'discount').map(variant => ({
    family: `econ/${variant}`,
    run: () => planEffectiveEconomyPath({
      config: everythingAvailableEconomy(),
      levels: ZERO_EFFECTIVE_ECONOMY_LEVELS,
      variant,
      steps: 1,
      workshopEnhancementsUnlocked: true,
    }),
  })),
  ...HEALTH_PATH_VARIANTS.map(variant => ({
    family: `eHP/${variant}`,
    run: () => planEffectiveHealthPath({
      config: zeroEffectiveHealthConfig(),
      levels: ZERO_EFFECTIVE_HEALTH_LEVELS,
      variant,
      steps: 1,
    }),
  })),
  ...REGEN_PATH_VARIANTS.map(variant => ({
    family: `eRegen/${variant}`,
    run: () => planEffectiveRegenPath({
      config: {
        healthRegen: regen.healthRegen,
        card: regen.card,
        hasSecondWindMastery: regen.hasSecondWindMastery,
      },
      eHealth: zeroEffectiveHealthConfig(),
      levels: { ...ZERO_EFFECTIVE_HEALTH_LEVELS, ...ZERO_EFFECTIVE_REGEN_LEVELS },
      variant,
      steps: 1,
    }),
  })),
]

describe.each(PLANS)('$family', ({ run }) => {
  it('can price every candidate it offers', () => {
    const unpriced = unpricedIn(run().excluded)
    expect(unpriced, 'the catalogs do not know these names').toEqual([])
  })
})

describe('the sweep itself', () => {
  it('covers every variant of every model', () => {
    // Six damage, three economy, four eHP and two regen.
    expect(PLANS.length).toBe(15)
  })

  it('would notice, if a name stopped resolving', () => {
    /*
     * The guard on the guard, and the reason the matcher is a regex rather than
     * an equality: the four planners word this differently — "no maximum level
     * known" from three of them, "no price for level N" and "priced at 0 …
     * which is not a cost" from the skip reporter. A matcher that knew only one
     * spelling would pass while the others went unchecked.
     */
    const sample: PathExclusion[] = [
      { sheetName: 'A', reason: 'no maximum level known' },
      { sheetName: 'B', reason: 'no price for level 4' },
      { sheetName: 'C', reason: 'priced at 0 for level 2, which is not a cost' },
      { sheetName: 'D', reason: 'the weapon is not unlocked' },
      { sheetName: 'E', reason: 'already at its cap of 99' },
    ]
    expect(unpricedIn(sample)).toHaveLength(3)
  })
})

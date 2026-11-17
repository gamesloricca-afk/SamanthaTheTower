import { describe, expect, it } from 'vitest'
import {
  computeEffectiveEconomy,
  zeroEffectiveEconomyConfig,
} from '../../src/mechanics/effective-paths/eecon-compute'
import type { EffectiveEconomyConfig } from '../../src/mechanics/effective-paths/types'
import { ZERO_EFFECTIVE_ECONOMY_LEVELS } from '../../src/mechanics/effective-paths/eecon-levels'
import type { EffectiveEconomyLevels } from '../../src/mechanics/effective-paths/types'
import states from '../../fixtures/mechanics/effective-paths-eecon-states.fixtures.json'

/**
 * Effective economy against the sheet's own grid.
 *
 * The fixture is a raw dump of `_EPECON`, a copy of the `eEcon` tab with its
 * input block as literals and its computed columns as the real formulas, driven
 * through twelve randomised accounts. Every intermediate column is compared,
 * not just `DS5` — on the damage side that is what turned "the total is wrong"
 * into "the Cover Fire term is a rate, not a value".
 *
 * **One column is an input here, not an answer.** `CV5` resolves the Generator
 * module through `IDS_MOD_GENERATOR_*`, which reads the player's equipped
 * module rather than anything on the tab, so a copy cannot drive it. It is fed
 * in and the columns downstream of it are still checked.
 */

type Cells = Record<string, unknown>

interface SheetState {
  cells: Cells
  outputs: Record<string, number>
}

const SHEET_STATES = states as unknown as SheetState[]

/** `CV5` is supplied rather than computed — see the note above. */
const SUPPLIED_COLUMNS = new Set(['CV5'])

/**
 * A numeric string is a number.
 *
 * `typeof === 'number' ? … : 0` read `eEcon!AX23` -- the GB Sync Desired Ratio,
 * which the sheet stores as the TEXT "1" -- as zero. `goldBotSyncRatio` then
 * came out 0, `MIN(MAX(50, average * 0), …)` collapsed to the floor, and `DL5`
 * reported a flat 50 second Gold Bot cooldown on every account whose weapons
 * were synced. Nothing failed: 50 is a plausible cooldown, and the twelve-account
 * states fixture happens to contain no account that reaches this branch.
 *
 * Supported by the model, never set by the wiring, nothing anywhere reporting
 * it -- the shape AGENTS.md warns about, found by a sweep rather than by reading.
 *
 * Non-numeric text still reads 0: `"-"`, `"Attack Disso"` and the empty string
 * are not quantities, and `Number()` gives NaN for all three.
 */
const reader = (cells: Cells) => ({
  cell: (ref: string) => {
    const raw = cells[ref]
    if (typeof raw === 'number') return raw
    if (typeof raw === 'string' && raw.trim() !== '') {
      const parsed = Number(raw)
      if (Number.isFinite(parsed)) return parsed
    }
    return 0
  },
  flag: (ref: string) => cells[ref] === true,
})

const substat = (cells: Cells, row: number) => ({
  primary: reader(cells).cell(`AO${row}`),
  assist: reader(cells).cell(`AP${row}`),
})

/** A unique effect: primary in `AO`, assist in `AS`. */
const unique = (cells: Cells, row: number) => ({
  primary: reader(cells).cell(`AO${row}`),
  assist: reader(cells).cell(`AS${row}`),
})

const card = (cells: Cells, row: number) => ({
  active: reader(cells).flag(`AZ${row}`),
  level: reader(cells).cell(`AV${row}`),
  value: reader(cells).cell(`AW${row}`),
})

const workshop = (cells: Cells, row: number) => ({
  value: reader(cells).cell(`BJ${row}`),
  relicPct: reader(cells).cell(`BN${row}`),
  vaultPct: reader(cells).cell(`BO${row}`),
})

export function configFromSheet(
  cells: Cells,
  outputs: Record<string, number> = {},
): EffectiveEconomyConfig {
  const { cell, flag } = reader(cells)
  const zero = zeroEffectiveEconomyConfig()

  return {
    ...zero,
    baseCoinsPerKill: cell('CP6'),
    waveDurationSeconds: cell('CP5'),
    timeMultiplier: cell('CP8'),

    coinsPerKill: workshop(cells, 5),
    freeUpgradeAttack: workshop(cells, 6),
    freeUpgradeDefense: workshop(cells, 7),
    freeUpgradeUtility: workshop(cells, 8),
    recoveryPackageChance: workshop(cells, 9),
    packageAfterBossLevel: cell('BE10'),
    goldBotCooldownLabSeconds: cell('BH29'),

    substats: {
      coinsPerKill: substat(cells, 8),
      freeUpgradeAttack: substat(cells, 9),
      freeUpgradeDefense: substat(cells, 10),
      freeUpgradeUtility: substat(cells, 11),
      packageChance: substat(cells, 12),
      goldenTowerBonus: substat(cells, 16),
      goldenTowerDuration: substat(cells, 17),
      goldenTowerCooldown: substat(cells, 18),
      blackHoleDuration: substat(cells, 19),
      blackHoleCooldown: substat(cells, 20),
      spotlightAngle: substat(cells, 21),
      deathWaveQuantity: substat(cells, 22),
      deathWaveCooldown: substat(cells, 23),
    },

    uniques: {
      blackHoleDigestor: unique(cells, 6),
      galaxyCompressor: unique(cells, 7),
      multiverseNexus: unique(cells, 15),
    },

    assistEfficiency: {
      generatorBonus: cell('BO21'),
      generatorSubstat: cell('BO22'),
      coreSubstat: cell('BO24'),
    },

    // `CV5` is a computed column, not an input cell — see the note above.
    generator: { bonus: outputs.CV5 ?? 1, hasAssist: flag('AP5'), coreHasAssist: flag('AP14') },

    cards: {
      coins: card(cells, 31),
      coinsMastery: card(cells, 32),
      freeUpgrades: card(cells, 33),
      extraOrbMastery: card(cells, 34),
      waveSkip: card(cells, 35),
      waveSkipMastery: card(cells, 36),
      introSprint: card(cells, 37),
      introSprintMastery: card(cells, 38),
      recoveryPackage: card(cells, 39),
      waveAcceleratorMastery: card(cells, 41),
    },

    perksEquipped: flag('AZ43'),
    perks: {
      coins: flag('AZ45'),
      freeUpgrades: flag('AZ46'),
      coinsTradeOff: flag('AZ47'),
      goldenTowerBonus: flag('AZ48'),
      blackHoleDuration: flag('AZ49'),
      deathWaveQuantity: flag('AZ50'),
    },

    weapons: {
      goldenTower: {
        unlocked: flag('BK15'),
        bonus: cell('BL15'),
        duration: cell('BM15'),
        cooldown: cell('BN15'),
        goldenCombo: cell('BO15'),
      },
      blackHole: {
        unlocked: flag('BK16'), duration: cell('BM16'), cooldown: cell('BN16'),
      },
      deathWave: {
        unlocked: flag('BK17'), quantity: cell('BM17'), cooldown: cell('BN17'),
      },
      spotlight: {
        unlocked: flag('BK18'), angle: cell('BM18'), quantity: cell('BN18'),
      },
      goldBot: {
        unlocked: flag('BK19'),
        bonus: cell('BL19'),
        duration: cell('BM19'),
        cooldown: cell('BN19'),
      },
    },

    estimates: {
      blackHoleKillShare: cell('AZ19'),
      killsPerSecond: cell('AZ20'),
      goldBotKillShare: cell('AZ22'),
      goldBotSyncRatio: cell('AX23') / (cell('AZ23') || 1),
      bossWaveInterval: cell('AZ25'),
      extraOrbTagShare: cell('AZ26'),
    },

    dissonance: { active: false, tierPersonalBest: 0, allTierPersonalBests: [] },
  }
}

/** Row 5 is the current-levels row, so the levels are the player's own. */
export function levelsFromSheet(cells: Cells): EffectiveEconomyLevels {
  const { cell } = reader(cells)
  const base = ZERO_EFFECTIVE_ECONOMY_LEVELS

  return {
    ...base,
    time: {
      coinsPerKillBonus: cell('BQ5'),
      recoveryPackageChance: cell('BR5'),
      dissonantEchoUtility: cell('BS5'),
      goldenTowerBonus: cell('BT5'),
      goldenTowerDuration: cell('BU5'),
      deathWaveCoinBonus: cell('BV5'),
      blackHoleCoinBonus: cell('BW5'),
      spotlightCoinBonus: cell('BX5'),
      coinsMastery: cell('BY5'),
      extraOrbMastery: cell('BZ5'),
      waveSkipMastery: cell('CA5'),
      introSprintMastery: cell('CB5'),
      waveAcceleratorMastery: cell('CC5'),
      standardPerksBonus: cell('CD5'),
      improveTradeOffPerks: cell('CE5'),
      goldBotDuration: cell('CF5'),
      assistSubstatGenerator: cell('CG5'),
      assistSubstatCore: cell('CH5'),
      assistBonusGenerator: cell('CI5'),
      // This historical capture predates the primary research candidate.
      primaryModuleBonusGenerator: 0,
      enhancementCoinBonus: cell('CJ5'),
      enhancementFreeUpgrades: cell('CK5'),
      primaryModuleGenerator: cell('CL5'),
      assistModuleGenerator: cell('CM5'),
    },
    stone: {
      ...base.stone,
      goldenTowerBonusStone: cell('BL15'),
      goldenTowerDurationStone: cell('BM15'),
      goldenTowerCooldownStone: cell('BN15'),
      goldenComboStone: cell('BO15'),
      blackHoleDurationStone: cell('BM16'),
      blackHoleCooldownStone: cell('BN16'),
      deathWaveQuantityStone: cell('BM17'),
      deathWaveCooldownStone: cell('BN17'),
      spotlightAngleStone: cell('BM18'),
      spotlightQuantityStone: cell('BN18'),
    },
  }
}

function expectClose(actual: number, expected: number, what: string): void {
  expect(Number.isFinite(actual), `${what}: not finite`).toBe(true)
  if (expected === 0) {
    expect(Math.abs(actual), what).toBeLessThan(1e-9)
    return
  }
  const relative = Math.abs(actual - expected) / Math.abs(expected)
  expect(relative, `${what}: got ${actual}, sheet says ${expected}`).toBeLessThan(1e-9)
}

describe('twelve accounts, against the eEcon grid', () => {
  it('has a fixture with every column computed', () => {
    expect(SHEET_STATES).toHaveLength(12)
    for (const [index, state] of SHEET_STATES.entries())
      expect(Object.keys(state.outputs), `state ${index}`).toHaveLength(29)
  })

  for (const [index, state] of SHEET_STATES.entries()) {
    describe(`state ${index}`, () => {
      const result = computeEffectiveEconomy(
        configFromSheet(state.cells, state.outputs), levelsFromSheet(state.cells),
      )

      const refs = Object.keys(state.outputs)
        .filter(ref => result.columns[ref] !== undefined)
        .filter(ref => !SUPPLIED_COLUMNS.has(ref))

      it('compares every column the model computes', () => {
        expect(refs.length).toBeGreaterThanOrEqual(28)
      })

      for (const ref of refs) {
        it(`matches ${ref}`, () => {
          expectClose(result.columns[ref], state.outputs[ref], ref)
        })
      }
    })
  }
})

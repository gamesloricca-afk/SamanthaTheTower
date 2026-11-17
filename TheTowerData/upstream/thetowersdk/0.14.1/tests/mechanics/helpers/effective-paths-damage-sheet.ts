import {
  DAMAGE_SUBSTAT_NAMES,
  DAMAGE_WORKSHOP_STATS,
  ZERO_DAMAGE_STAT_SOURCE,
  zeroEffectiveDamageConfig,
} from '../../../src/mechanics/effective-paths/edamage-config'
import type {
  DamageCard,
  DamageModuleUnique,
  DamagePerk,
  DamageSubstat,
  DamageUltimateWeapon,
  DamageWorkshopStat,
  EffectiveDamageConfig,
  ModuleSlot,
} from '../../../src/mechanics/effective-paths/edamage-config'
import { ZERO_EFFECTIVE_DAMAGE_LEVELS } from '../../../src/mechanics/effective-paths/edamage-levels'
import { effectiveDamageLabLevelsFromSheet } from '../../../src/mechanics/effective-paths/edamage-lab-levels'
import { workshopStatValue } from '../../../src/mechanics/effective-paths/workshop-values'
import { parseNumberInput } from '../../../src/formatting/numbers/compute'

/** The three rows the sheet's workshop block spells differently from the game. */
const WORKSHOP_GAME_NAMES: Record<DamageWorkshopStat, string> = {
  'Damage': 'Damage',
  'Attack Speed': 'Attack Speed',
  'Critical Chance': 'Critical Chance',
  'Critical Factor': 'Critical Factor',
  'Range': 'Range',
  'Damage / Meter': 'Damage / Meter',
  'Multishot Chance': 'Multishot Chance',
  'Multishot Targets': 'Multishot Targets',
  'Rapid Fire Chance': 'Rapid Fire Chance',
  'Rapid Fire Duration': 'Rapid Fire Duration',
  'Bounce Shot Chance': 'Bounce Shot Chance',
  'Bounce Shot Targets': 'Bounce Shot Targets',
  'Super Critical Chance': 'Super Crit Chance',
  'Super Critical Mult': 'Super Crit Mult',
  'Max Rend Armor Multiplier': 'Rend Armor Mult',
}
import type { EffectiveDamageLevels } from '../../../src/mechanics/effective-paths/types'
import type { DamageRunType } from '../../../src/mechanics/effective-paths/damage-base'
import cells from '../../../fixtures/mechanics/effective-paths-edamage.fixtures.json'

/**
 * Effective damage against the sheet's own grid.
 *
 * The fixture is a raw dump of `eDamage` — every input cell and every output
 * column, exactly as the live sheet had them. The config is assembled here, in
 * type-checked code, so the thing under test is the mapping from cells to
 * model and not a second copy of it written in the dump script.
 *
 * **What this covers.** The sheet's own state is an untouched account: no
 * ultimate weapon is unlocked, so `EO5` is zero and `ED5` and `ER5` are one.
 * That exercises the base, both crit factors, the whole bullet multiplier and
 * the composition — but *not* the ultimate weapon half end to end. That half
 * is covered instead by `effective-paths-uw-dps.test.ts`, whose every case was
 * evaluated by the sheet's own lambdas. Saying so here rather than letting a
 * green suite imply more than it proves.
 */

export type SheetCells = Record<string, unknown>

const reader = (source: SheetCells) => {
  const cell = (ref: string): number => {
    const value = source[ref]
    return typeof value === 'number' ? value : 0
  }
  const flag = (ref: string): boolean => source[ref] === true
  const text = (ref: string): string => String(source[ref] ?? '')
  /** The sheet reads a card's level as the last character of `"Lvl 4"`. */
  const cardLevel = (ref: string): number => Number(text(ref).slice(-1)) || 0
  return { cell, flag, text, cardLevel }
}

export const { cell } = reader(cells as SheetCells)

/** The workshop block's rows — column `BB`. */
const WORKSHOP_ROW: Record<DamageWorkshopStat, number> = {
  'Damage': 8,
  'Attack Speed': 9,
  'Critical Chance': 10,
  'Critical Factor': 11,
  'Range': 12,
  'Damage / Meter': 13,
  'Multishot Chance': 14,
  'Multishot Targets': 15,
  'Rapid Fire Chance': 16,
  'Rapid Fire Duration': 17,
  'Bounce Shot Chance': 18,
  'Bounce Shot Targets': 19,
  'Super Critical Chance': 20,
  'Super Critical Mult': 21,
  'Max Rend Armor Multiplier': 22,
}

/**
 * `BNn = BMn * rate` on the sheet — BN is the fraction EPD_* reads, BM is the
 * vault-node count. Captures come in two shapes:
 *
 *   IDS / stone-sweep   BM is an integer level count → multiply by rate
 *   unified / community BM is already the fraction (0.05, 0.01, …) → use as-is
 *
 * Multiplying a fraction by the rate again understates every vault bonus
 * (and keys then see levels like 0.05 → "no price for level 1.05").
 */
const WORKSHOP_VAULT_FRACTION_PER_BM: Readonly<Record<number, number>> = {
  8: 0.05,
  9: 0.05,
  10: 0.01,
  11: 0.05,
  13: 0.05,
  14: 0.04,
  16: 0.04,
  18: 0.04,
  20: 0.02,
  21: 0.05,
  39: 0.05,
  // Ultimate weapon rows — same 5% vault nodes as UW Damage.
  30: 0.05,
  31: 0.05,
  32: 0.05,
  33: 0.05,
  34: 0.05,
  35: 0.05,
  36: 0.05,
  37: 0.05,
}

function isVaultLevelCount(raw: number): boolean {
  return Math.abs(raw - Math.round(raw)) < 1e-9
}

function workshopVaultFraction(source: SheetCells, row: number): number {
  const direct = source[`BN${row}`]
  if (typeof direct === 'number' && Number.isFinite(direct)) return direct
  const raw = Number(source[`BM${row}`])
  if (!Number.isFinite(raw)) return 0
  /*
   * Shockwave frequency vault: live `eDamage!DG5` passes `$BN$24` into
   * `EPD_SHOCKWAVE_DAMAGE`, and `BN24 = -BM24`. Captures often omit BN (formula
   * cell) and only keep BM. Returning BM as-is made an IDS account ACP read vault +1
   * instead of −1 (DG5 6.526 vs sheet 7.702).
   */
  if (row === 24) return -raw
  const rate = WORKSHOP_VAULT_FRACTION_PER_BM[row]
  if (rate === undefined) return raw
  return isVaultLevelCount(raw) ? raw * rate : raw
}

/** The substat block's rows — column `AL`. A different order, deliberately. */
const SUBSTAT_ROW: Record<DamageSubstat, number> = {
  'Attack Speed': 9,
  'Critical Chance': 10,
  'Critical Factor': 11,
  'Attack Range': 12,
  'Damage / Meter': 13,
  'Super Crit Chance': 14,
  'Super Crit Multi': 15,
  'Max Rend Armor Multi': 16,
  'MultiShot Chance': 17,
  'Multishot Targets': 18,
  'Rapid Fire Chance': 19,
  'Rapid Fire Duration': 20,
  'Bounce Shot Chance': 21,
  'Bounce Shot Targets': 22,
  'Death Wave - Damage': 26,
  'Death Wave - Quantity': 27,
  'Death Wave - Cooldown': 28,
  'Spotlight - Bonus': 29,
  'Spotlight - Angle': 30,
  'Smart Missiles - Damage': 31,
  'Smart Missiles - Quantity': 32,
  'Smart Missiles - Cooldown': 33,
  'Chain Lightning - Damage': 34,
  'Chain Lightning - Quantity': 35,
  'Chain Lightning - Chance': 36,
  'Poison Swamp - Damage': 37,
  'Chrono Field - Speed Reduction': 38,
  'Inner Land Mines - Damage': 39,
  'Inner Land Mines - Quantity': 40,
  'Inner Land Mines - Cooldown': 41,
  'Shockwave Frequency': 51,
  'Land Mine Chance': 52,
}

const UNIQUE_ROW = {
  'Astral Deliverance': 6,
  'Being Annihilator': 7,
  'Amplifying Strike': 8,
  'Dimension Core': 25,
  'Galaxy Compressor': 44,
  'Project Funding': 45,
  'Anti-Cube Portal': 49,
  'Space Displacer': 50,
} satisfies Partial<Record<DamageModuleUnique, number>>

const CARD_ROW: Record<DamageCard, number> = {
  'Damage': 42,
  'Damage Mastery': 43,
  'Berserker': 44,
  'Attack Speed': 45,
  'Attack Speed Mastery': 46,
  'Critical Chance': 47,
  'Critical Chance Mastery': 48,
  'Range': 49,
  'Range Mastery': 50,
  'Enemy Balance': 51,
  'Super Tower': 52,
  'Super Tower Mastery': 53,
  'Ultimate Crit': 54,
  'Ultimate Crit Mastery': 55,
  'Demon Mode Mastery': 58,
  'Area of Effect': 59,
}

const PERK_ROW: Record<DamagePerk, number> = {
  'Damage': 63,
  'Bounce Shot': 64,
  'Boss Health Trade-off': 65,
  'Enemy Damage Trade-off': 66,
  'Death Wave Quantity': 67,
  'Spotlight Damage Bonus': 68,
  'More Smart Missiles': 69,
  'Chain Lightning Damage': 70,
  'Extra Inner Mines': 71,
}

const WEAPON_ROW: Record<DamageUltimateWeapon, number> = {
  'Death Wave': 30,
  'Chain Lightning': 31,
  'Smart Missiles': 32,
  'Spotlight': 33,
  'Spotlight Missiles': 34,
  'Poison Swamp': 35,
  'Chrono Field': 36,
  'Inner Land Mines': 37,
}

/** The module blocks, and the two stone ladders each one has. */
const MODULE_ROW: Record<ModuleSlot, { block: number, bonus: number, substat: number }> = {
  cannon: { block: 4, bonus: 41, substat: 42 },
  armor: { block: 47, bonus: 43, substat: 44 },
  generator: { block: 42, bonus: 45, substat: 46 },
  core: { block: 23, bonus: 47, substat: 48 },
}

export function configFromSheet(source: SheetCells = cells as SheetCells): EffectiveDamageConfig {
  const { cell, flag, text, cardLevel } = reader(source)
  const zero = zeroEffectiveDamageConfig()

  const stats = { ...zero.stats } as Record<DamageWorkshopStat, typeof ZERO_DAMAGE_STAT_SOURCE>
  for (const name of DAMAGE_WORKSHOP_STATS) {
    const row = WORKSHOP_ROW[name]
    const level = cell(`BG${row}`)
    stats[name] = {
      workshopLevel: level,
      // Derived from the level rather than read off the sheet, which is what
      // the site does too — and what `EPD_DPM` does internally.
      workshopValue: workshopStatValue(WORKSHOP_GAME_NAMES[name], level)?.value ?? 0,
      enhancementLevel: cell(`BI${row}`),
      enhancementMultiplier: cell(`BK${row}`) || 1,
      relicPct: cell(`BL${row}`),
      vaultPct: workshopVaultFraction(source, row),
    }
  }

  const substats = { ...zero.substats } as Record<DamageSubstat, { primary: number, assist: number }>
  for (const name of DAMAGE_SUBSTAT_NAMES) {
    const row = SUBSTAT_ROW[name]
    substats[name] = { primary: cell(`AM${row}`), assist: cell(`AO${row}`) }
  }

  const uniques = { ...zero.uniques }
  for (const [name, row] of Object.entries(UNIQUE_ROW))
    uniques[name as DamageModuleUnique] = { primary: cell(`AM${row}`), assist: cell(`AR${row}`) }

  const modules = { ...zero.modules }
  for (const [slot, rows] of Object.entries(MODULE_ROW))
    modules[slot as ModuleSlot] = {
      primaryBonus: cell(`AM${rows.block}`),
      hasAssist: flag(`AN${rows.block}`),
      assistBonus: cell(`AO${rows.block}`),
      bonusStoneLevel: cell(`BL${rows.bonus}`),
      substatStoneLevel: cell(`BL${rows.substat}`),
    }

  const cards = { ...zero.cards }
  for (const [name, row] of Object.entries(CARD_ROW))
    cards[name as DamageCard] = {
      active: flag(`AY${row}`),
      level: cardLevel(`AU${row}`),
      value: cell(`AV${row}`),
    }

  const perks = { ...zero.perks }
  for (const [name, row] of Object.entries(PERK_ROW))
    perks[name as DamagePerk] = flag(`AY${row}`)

  const ultimateWeapons = { ...zero.ultimateWeapons }
  for (const [name, row] of Object.entries(WEAPON_ROW)) {
    const plus = source[`BL${row}`]
    const vaultLevels = Number(source[`BM${row}`])
    ultimateWeapons[name as DamageUltimateWeapon] = {
      unlocked: flag(`BH${row}`),
      damage: cell(`BI${row}`),
      quantity: cell(`BJ${row}`),
      cooldown: cell(`BK${row}`) || 1,
      plus: typeof plus === 'number' ? plus : null,
      // Same BM/BN dual-format as workshop vault (level count vs fraction).
      vaultPct: workshopVaultFraction(source, row),
    }
  }

  /*
   * Constant panel: labels in CX, values in CY. Unified captures sometimes
   * store the number on CX (same class as wave duration on CX7). Prefer CY;
   * fall back to a numeric CX when CY is absent.
   */
  const constant = (row: number): number => {
    const preferred = source[`CY${row}`]
    if (typeof preferred === 'number' && Number.isFinite(preferred)) return preferred
    const fallback = source[`CX${row}`]
    if (typeof fallback === 'number' && Number.isFinite(fallback)) return fallback
    return 0
  }

  return {
    ...zero,
    runType: text('AX19') as DamageRunType,
    simulatedTier: text('AX20'),
    gameSpeed: cell('AY21'),
    damageAtRangePct: cell('AY22'),
    waveDurationSeconds: constant(7),
    enemySpawnsPerSecond: constant(10),
    ultimateWeaponAdditionalDamage: constant(6),
    towerDamageBase: cell('AN55'),
    criticalFactorBase: cell('AN58'),
    superCritChanceBase: cell('AN67'),
    superCritMultiBase: cell('AN68'),
    waveAcceleratorRecovery: cell('AN70'),
    // `AY34` is often display text (`100B`); Project Funding needs a number.
    cash: (() => {
      const raw = source.AY34
      if (typeof raw === 'number' && Number.isFinite(raw)) return raw
      if (typeof raw === 'string') {
        const text = raw.trim()
        if (!text || text === '-') return 0
        if (/^[+-]?\d+(\.\d+)?$/.test(text)) return Number(text)
        if (/^\d+(\.\d+)?\s*[KMBTqQsSOND]$/i.test(text)) {
          return parseNumberInput(text.replace(/\s+/g, ''))
        }
      }
      return 0
    })(),
    // First word of AY27: None → hide labs on coin path; All → show them.
    showLabsOnCoinPath: !/^none\b/i.test(String(text('AY27') || 'All').trim()),
    hideNonUnlockedLabs: flag('AY26'),
    // Only when the capture retained the cell — missing ≠ blank.
    ...('AL4' in source
      ? { cannonModuleLevelHorizon: String(source.AL4 ?? '') }
      : {}),
    ...('AL23' in source
      ? { coreModuleLevelHorizon: String(source.AL23 ?? '') }
      : {}),
    stats,
    modules,
    substats,
    uniques,
    cardsEquipped: flag('AY39'),
    cards,
    perksEquipped: flag('AY61'),
    perks,
    perkQuantity: { damage: cell('AV63'), bounceShot: cell('AV64') },
    bounceShotPerkTargets: cell('AX64'),
    ultimateWeapons,
    landMineChance: cell('BH25'),
    ampStrikeShare: cell('AY35'),
    chronoFieldEnabled: flag('AY33'),
    shockMultiplierUnlocked: flag('AL75'),
    hasRendArmour: flag('AL69'),
    spotlightQuantity: cell('AY8'),
    ultimateWeaponDamageRelicPct: cell('BL39'),
    ultimateWeaponDamageVaultPct: workshopVaultFraction(source, 39),
    shockwave: {
      sizeWorkshopLevel: cell('BG23'),
      sizeLabLevel: cell('BC23'),
      frequencyWorkshopLevel: cell('BG24'),
      frequencyVault: workshopVaultFraction(source, 24),
    },
    heatUpHits: {
      smartMissiles: cell('AY29'),
      poisonSwamp: cell('AY32'),
      innerLandMines: cell('AY37'),
    },
    areaOfEffect: {
      smartMissiles: cell('AY30'),
      poisonSwamp: cell('AY31'),
      innerLandMines: cell('AY36'),
    },
    recovery: {
      durationBonus: cell('BF26'),
      bossWave: cell('BC27') === 1,
      bossWaveDivisor: cell('AY28') || 1,
    },
    /*
     * DISSONANT ECHO, which was hardcoded off here for every account.
     *
     *     CY5 = TTG_DISSONANT_ATTACK_BOOST($CX$13, $CX$14:$CX$34, CT5)
     *     EB5 = TTG_DISSONANT_UW_BOOST($CX$40, $CX$41:$CX$61, CU5)
     *
     * With `active: false` the port returned 1 for both and two whole terms
     * vanished -- `Disco Attack` out of `Base` and `Disco UW` out of the
     * ultimate weapon total. On the generated fixture that is invisible,
     * because its `CX13` is 0 and the boost really is 1; on `sheet-2` the sheet
     * reads 5.20937539659 and 5.20808557575.
     *
     * The shape of the error is what named it: the four candidates that move
     * only `OtherMults` came out with an implied base x5.152990 against the
     * other eight, to six digits.
     *
     * This is the same defect `effective-paths-ehp-from-sheet.ts` records for
     * Health, in the same words -- the model was never wrong, nothing set its
     * inputs, and nothing reported that.
     *
     * `active` follows eHP's rule: true whenever a personal best exists. The
     * sheet has no switch, it simply computes the boost, and with every best at
     * zero the boost is 1 either way.
     */
    dissonance: (() => {
      const range = (col: string, from: number, to: number) => {
        const out: number[] = []
        for (let row = from; row <= to; row += 1) out.push(cell(`${col}${row}`))
        return out
      }
      const tierPersonalBest = cell('CY13')
      const allTierPersonalBests = range('CY', 14, 34)
      const uwTierPersonalBest = cell('CY40')
      const uwAllTierPersonalBests = range('CY', 41, 61)
      const any = (best: number, all: number[]) => best > 0 || all.some(x => x > 0)
      return {
        active: any(tierPersonalBest, allTierPersonalBests)
          || any(uwTierPersonalBest, uwAllTierPersonalBests),
        tierPersonalBest,
        allTierPersonalBests,
        ultimateWeapon: {
          tierPersonalBest: uwTierPersonalBest,
          allTierPersonalBests: uwAllTierPersonalBests,
        },
      }
    })(),
  }
}

/** Row 5 is the "current levels" row, so the levels are the player's own. */
/**
 * A vault percentage read back as a LEVEL, without floating-point noise.
 *
 * `eDamage Keys!BO5` is `=BM8/5%` and the port does the same division, but
 * `0.15 / 0.05` is `2.9999999999999996` in IEEE — and `keysCandidateCost`
 * requires an integer, so it returned null, the candidate was excluded
 * entirely, and the path came out exactly one step short. Seven of the
 * twenty-two accounts drew a level whose product divides back inexactly.
 *
 * Only near-integers are snapped. A genuinely fractional level stays
 * fractional: the working copy's hand-typed `BM8` of 0.0365 is 0.73 of a
 * level, and rounding that away would hide the fixture defect rather than the
 * arithmetic one.
 */
function vaultLevel(percentage: number, perLevel: number): number {
  const raw = percentage / perLevel
  const nearest = Math.round(raw)
  return Math.abs(raw - nearest) < 1e-6 ? nearest : raw
}

/** BM as level count (IDS) or as percentage (unified) → keys path level. */
function keysLevelFromBm(bm: number, perLevel: number): number {
  if (!Number.isFinite(bm) || bm === 0) return 0
  if (isVaultLevelCount(bm)) return Math.round(bm)
  return vaultLevel(bm, perLevel)
}

export function levelsFromSheet(
  source: SheetCells = cells as SheetCells,
): EffectiveDamageLevels {
  const { cell } = reader(source)
  const base = ZERO_EFFECTIVE_DAMAGE_LEVELS
  /*
   * Lab band: live sheet is blank BO + Damage at BP…CV. Unified/community
   * captures sometimes shift the same headers one column left. Bind by row-4
   * header inside BO:CV when present; otherwise fixed BP5:CV5.
   */
  const lab = effectiveDamageLabLevelsFromSheet(source).levels
  return {
    ...base,
    lab,
    /**
     * Vault node LEVELS for the keys path. IDS stores an integer count in BM;
     * unified captures often store the percentage BN would hold. Convert with
     * {@link keysLevelFromBm} so both shapes price and plan.
     */
    keys: {
      damage: keysLevelFromBm(cell('BM8'), 0.05),
      criticalChance: keysLevelFromBm(cell('BM10'), 0.01),
      criticalFactor: keysLevelFromBm(cell('BM11'), 0.05),
      superCritChance: keysLevelFromBm(cell('BM20'), 0.02),
      superCritMult: keysLevelFromBm(cell('BM21'), 0.05),
      attackSpeed: keysLevelFromBm(cell('BM9'), 0.05),
      multishotChance: keysLevelFromBm(cell('BM14'), 0.04),
      damagePerMeter: keysLevelFromBm(cell('BM13'), 0.05),
      rapidFireChance: keysLevelFromBm(cell('BM16'), 0.04),
      bounceShotChance: keysLevelFromBm(cell('BM18'), 0.04),
      ultimateWeaponDamage: keysLevelFromBm(cell('BM39'), 0.05),
    },
    stone: {
      ...base.stone,
      assistBonusCannonStone: cell('BL41'),
      assistSubstatCannonStone: cell('BL42'),
      assistSubstatArmorStone: cell('BL44'),
      assistBonusCoreStone: cell('BL47'),
      assistSubstatCoreStone: cell('BL48'),
    },
  }
}

export { cells }

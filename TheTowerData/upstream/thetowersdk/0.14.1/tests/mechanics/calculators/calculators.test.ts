import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { CALCULATORS, calculatorSpec } from '../../../src/calculators/registry'
import { GENERATED_CALCULATORS } from '../../../src/calculators/specs.generated'
import {
  CalculatorError,
  IMPLEMENTED_CALCULATOR_IDS,
  listCalculators,
  runCalculator,
} from '../../../src/calculators/run'
import { calculatorGraph, calculatorsProducing, calculatorsReading, upstreamOf } from '../../../src/calculators/graph'
import { getSharedToolLabs } from '../../../src/data/labs/overview'
import { buildGuardianDefinitions } from '../../../src/data/guardians/definitions'
import { BOT_UPGRADES_DATA, normalizeBotStats } from '../../../src/data/bots/data'
import { isMonorepoCheckout } from '../../../tooling/repo-root'

/*
 * Monorepo only. The registry and the graph tooling name files by their monorepo path
 * (`packages/sdk/src/...`) and read them from a repo root found by walking up to
 * `scripts/mechanics-trust/`. In the published repository this package is the root, so those
 * reads resolve above the checkout and the whole file fails to collect. Skipping keeps the
 * enforcement here, where the paths mean something.
 */
const MONOREPO = isMonorepoCheckout()

/**
 * The calculator registry, checked against the functions it points at.
 *
 * Three claims, and each is worth only what its check is worth:
 *
 *   1. Every handle resolves and RUNS. A registry of handles that error is
 *      worse than none: an agent stops looking for the canonical formula and
 *      writes a second.
 *   2. Every calculator MOVES. A declared input that changes nothing is the
 *      house defect here — 24 stone stats sat in the model unread for months,
 *      every candidate scoring exactly zero, and the planner returned the
 *      candidate list in declaration order as a recommendation. Nothing threw.
 *   3. Every declared `dependsOn` is real, checked against the SOURCE rather
 *      than believed. A dependency graph nobody verifies is a diagram.
 */

/**
 * The two tiers, and why the strong checks only apply to one.
 *
 * `curated` entries were written by hand: the `because` says what the formula
 * decides and the invariants were checked against it. They get the sample-based
 * checks — does it run, does it move.
 *
 * `generated` entries cover the rest of the exported surface. Their parameters
 * are DERIVED from the real signature, so they are accurate, and their prose is
 * a placeholder, so it is not a claim. They cannot be sample-checked without
 * ~900 hand-written argument pairs, which would be invented fixtures — the
 * thing that has accused working code three times in this session already.
 *
 * What checks them instead is the COMPILER. `specs.generated.ts` emits explicit
 * imports and a call per handle, so a wrong parameter list does not compile.
 * That is not a weaker check than a test; it is a stronger one, and it already
 * caught a three-parameter function the generator had read as taking two.
 */
const CURATED = CALCULATORS.filter(c => c.tier !== 'generated')
const GENERATED = CALCULATORS.filter(c => c.tier === 'generated')

/** Arguments that exercise each calculator, and a second set that must differ. */
const SAMPLES: Record<string, { args: Record<string, unknown>, moved: Record<string, unknown> }> = {
  'lab.durationDays': { args: { labKey: 'damage', level: 5 }, moved: { labKey: 'damage', level: 9 } },
  'lab.coinCost': { args: { labKey: 'damage', level: 5 }, moved: { labKey: 'damage', level: 9 } },
  'lab.maxLevel': { args: { labKey: 'damage' }, moved: { labKey: 'card_mastery' } },
  'lab.coinDiscount': { args: { coinDiscountLabLevel: 0 }, moved: { coinDiscountLabLevel: 12 } },
  'lab.speedTotal': {
    args: { labSpeedLabLevel: 0, labSpeedRelicPct: 0 },
    moved: { labSpeedLabLevel: 6, labSpeedRelicPct: 0 },
  },
  // `type` is lowercase — 'Cannon' is not a ModuleCalcType and the function
  // returns its documented 1 for anything it does not know. The move-check
  // caught that as a calculator that does not respond to its inputs, which is
  // exactly the shape it is there to catch, and the fault was in this fixture.
  'module.stat': {
    args: { opts: { type: 'cannon', rarityLabel: 'Rare', level: 1 } },
    moved: { opts: { type: 'cannon', rarityLabel: 'Rare', level: 40 } },
  },
  'module.levelLimit': { args: { text: 'none' }, moved: { text: 'all' } },
  'assist.substatCap': {
    args: { hasAssist: true, stoneCap: 0, labCap: 0 },
    moved: { hasAssist: true, stoneCap: 30, labCap: 0 },
  },
  'uw.statValue': {
    args: { weapon: 'Spotlight', stat: 'Angle', level: 0 },
    moved: { weapon: 'Spotlight', stat: 'Angle', level: 5 },
  },
  'uw.stoneCost': {
    args: { weapon: 'Death Wave', stat: 'Damage', level: 1 },
    moved: { weapon: 'Death Wave', stat: 'Damage', level: 6 },
  },
  'uw.maxLevel': {
    args: { weapon: 'Spotlight', stat: 'Angle' },
    moved: { weapon: 'Death Wave', stat: 'Damage' },
  },
  'spotlight.coverage': {
    args: { quantity: 1, angleDegrees: 30 },
    moved: { quantity: 1, angleDegrees: 60 },
  },
  'ilm.quantity': { args: { level: 1 }, moved: { level: 8 } },
  'ilm.cooldownSeconds': { args: { level: 1 }, moved: { level: 8 } },
  'enemy.bossWaveInterval': { args: { tier: 1 }, moved: { tier: 14 } },
  'enemy.eliteSpawnChance': { args: { tier: 5, wave: 100 }, moved: { tier: 5, wave: 4000 } },
  'defense.damageTakenFromReductionPct': { args: { reductionPct: 0 }, moved: { reductionPct: 40 } },
  'defense.chronoFieldReductionPct': {
    args: { chronoReductionLabLevel: 0 },
    moved: { chronoReductionLabLevel: 10 },
  },
  'epaths.projectFundingCash': {
    args: { runType: 'Util Disso', startingCashLevel: 0, observedCash: 500 },
    moved: { runType: 'Util Disso', startingCashLevel: 9, observedCash: 500 },
  },

  // --- formatting ----------------------------------------------------------
  'format.numberForDisplay': { args: { value: 1500 }, moved: { value: 2_500_000 } },
  'format.unknownNumberForDisplay': { args: { value: 1500 }, moved: { value: 'not a number' } },
  'format.decimalForDisplay': { args: { value: 1.23456 }, moved: { value: 9.87654 } },
  'format.groupedNumber': { args: { value: 1234567 }, moved: { value: 42 } },
  'format.rateWithNotation': {
    args: { amount: 1000, hours: 2 },
    moved: { amount: 5_000_000, hours: 2 },
  },
  'format.hourlyRate': {
    args: { value: 1000, duration: '2:00:00' },
    moved: { value: 5_000_000, duration: '2:00:00' },
  },
  'format.duration': { args: { seconds: 3600 }, moved: { seconds: 7200 } },
  'format.secondsAsHoursMinutes': { args: { seconds: 3600 }, moved: { seconds: 9000 } },
  'format.dateTimeForDisplay': {
    args: { value: '2026-08-19T10:00:00Z' },
    moved: { value: '2026-08-20T10:00:00Z' },
  },
  'format.dateToISO': { args: { dateStr: '2026-08-19' }, moved: { dateStr: '2026-08-20' } },
  'format.timeTo24h': { args: { timeStr: '1:30 PM' }, moved: { timeStr: '2:30 PM' } },

  // `q` and `Q` differ by a factor of a thousand, so this pair is also the
  // check that the parser is case-SENSITIVE where the game is.
  'parse.numberInput': { args: { input: '1.5q' }, moved: { input: '1.5Q' } },
  'parse.valueWithUnit': { args: { value: '1.5q' }, moved: { value: '2.5K' } },
  'convert.toNumericValue': {
    args: { value: 1.5, unit: 'K' },
    moved: { value: 1.5, unit: 'M' },
  },
  'parse.durationToHours': { args: { duration: '63:54:00' }, moved: { duration: '10:00:00' } },
  'parse.duration': { args: { duration: '2:30:00' }, moved: { duration: '1:00:00' } },
  'parse.resource': { args: { raw: '1.5K' }, moved: { raw: 'not a resource' } },
  'parse.saveDateTimeToMs': {
    args: { value: '2026-08-19T10:00:00Z' },
    moved: { value: '2026-08-20T10:00:00Z' },
  },

  'notation.standardize': { args: { value: '1.5k' }, moved: { value: '1.5m' } },
  'notation.normalizeNumeric': { args: { value: '1,5k' }, moved: { value: '2,5k' } },
  'notation.normalizeDecimalSeparator': { args: { value: '1,5' }, moved: { value: '2,5' } },
  'round.toDisplayPrecision': { args: { value: 1.23456 }, moved: { value: 9.87654 } },
  'round.stripInsignificantZeros': { args: { value: '1.500' }, moved: { value: '2.500' } },
  // Swapping the arguments must flip the sign, which is the antisymmetry the
  // invariant claims and a string comparator would fail.
  'sort.byUnit': { args: { left: '9K', right: '1M' }, moved: { left: '1M', right: '9K' } },
  'sort.byConvertedDuration': {
    args: { left: '1:00:00', right: '2:00:00' },
    moved: { left: '2:00:00', right: '1:00:00' },
  },

  // --- tracker -------------------------------------------------------------
  'math.clamp': {
    args: { value: 5, min: 0, max: 10 },
    moved: { value: 50, min: 0, max: 10 },
  },
  'module.levelCapForRarity': { args: { rarity: 'Common' }, moved: { rarity: 'Legendary' } },
  'module.clampLevelToRarity': {
    args: { level: 500, rarity: 'Common' },
    moved: { level: 500, rarity: 'Legendary' },
  },
  'module.findRarityLabel': { args: { rarity: 'legendary' }, moved: { rarity: 'common' } },
  'workshop.sectionDiscountPct': { args: { value: 5 }, moved: { value: 12 } },
  'workshop.enhancementDiscountPct': { args: { value: 5 }, moved: { value: 12 } },
  'bot.parseMetricValue': { args: { value: '1.5K' }, moved: { value: '2.5K' } },
  // Takes a reduction PERCENTAGE, not a lab level. My hand-written declaration
  // said the latter; the generated one, derived from the real signature, said
  // the former and was right. The compiler surfaced it.
  'enemy.chronoFieldDamageTaken': {
    args: { reductionPct: 0 },
    moved: { reductionPct: 40 },
  },
  'defense.damageTakenFromReductionFraction': {
    args: { reductionFraction: 0 },
    moved: { reductionFraction: 0.4 },
  },
  'ilm.damageMultiplier': { args: { level: 1 }, moved: { level: 8 } },
  // `tournament: true` is load-bearing: outside a tournament the century stack
  // is exactly 1 at every wave from 1 to 10,000, so a non-tournament sample
  // makes a working function look inert.
  'enemy.healthWave100Multiplier': {
    args: { w: 500, tournament: true },
    moved: { w: 3000, tournament: true },
  },
  'enemy.damageWave100Multiplier': {
    args: { w: 500, tournament: true },
    moved: { w: 3000, tournament: true },
  },
  'run.collectScalarFields': {
    args: { sources: [{ wave: 1 }, { coins: 2 }] },
    moved: { sources: [{ wave: 5 }] },
  },
  'workshop.maxSectionDiscountPct': {
    args: { values: [1, null, 5] },
    moved: { values: [1, null, 9] },
  },
  'workshop.maxEnhancementDiscountPct': {
    args: { values: [1, null, 5] },
    moved: { values: [1, null, 9] },
  },
  'workshop.maxVaultDiscountPct': {
    args: { values: [1, null, 5] },
    moved: { values: [1, null, 9] },
  },
  // The bag has SIX fields. Omitting two left them undefined, the arithmetic
  // produced NaN, and JSON.stringify renders that as null -- so both samples
  // read 'null' and the move-check reported a dead calculator. An incomplete
  // fixture, not a misnamed one, and indistinguishable from the outside.
  'damage.ability': {
    args: {
      input: {
        damagePercent: 100, damage: 10, critFactor: 2, critChance: 50,
        superCritMult: 2, superCritChance: 10,
      },
    },
    moved: {
      input: {
        damagePercent: 400, damage: 10, critFactor: 2, critChance: 50,
        superCritMult: 2, superCritChance: 10,
      },
    },
  },

  'module.normalizeTypeForCalc': { args: { appType: 'defense' }, moved: { appType: 'core' } },
  'lab.isResearchName': {
    args: { name: 'Damage' },
    moved: { name: 'definitely not a lab' },
  },
  'bot.findByName': { args: { botName: 'coin bot' }, moved: { botName: 'flame bot' } },
}

/*
 * Three calculators take a RECORD rather than scalars, so their samples are
 * built from the real catalogs instead of hand-written literals.
 *
 * An invented record would be a fixture that agrees with itself: the point of
 * `lab.uiMaxLevel` is that it falls back to the research catalog when the
 * record carries no level table, and a literal I wrote would exercise whichever
 * branch I happened to think of.
 */
const labs = getSharedToolLabs()
const guardians = buildGuardianDefinitions()
const labWithLevels = labs.find(lab => Array.isArray(lab.levels) && lab.levels.length > 1) ?? labs[0]
// A distinct object can still have the same cap; use the real one-shot unlock.
const otherLab = labs.find(lab => lab.name === 'unlock_perks')!

SAMPLES['lab.valueAtLevel'] = {
  args: { lab: labWithLevels, level: 1 },
  moved: { lab: labWithLevels, level: 8 },
}
SAMPLES['lab.uiMaxLevel'] = {
  args: { lab: labWithLevels },
  moved: { lab: otherLab },
}
SAMPLES['guardian.statBounds'] = {
  args: { guardian: guardians[0], statIndex: 0 },
  moved: { guardian: guardians[0], statIndex: 1 },
}
SAMPLES['guardian.statNames'] = {
  args: { guardian: guardians[0] },
  moved: { guardian: guardians[1] ?? guardians[0] },
}

const bots = BOT_UPGRADES_DATA
const firstBot = bots[0]
const otherBot = bots[1] ?? bots[0]
SAMPLES['bot.statNames'] = { args: { bot: firstBot }, moved: { bot: otherBot } }
// `bot.stats` is a Record keyed by name; the bounds functions take the
// NORMALISED rows, which is what the app builds before it asks. Reaching into
// the raw record gave undefined and the runner correctly refused the call.
const botRows = normalizeBotStats(firstBot)
SAMPLES['bot.statMinLevel'] = {
  args: { stat: botRows[0] },
  moved: { stat: botRows[1] ?? botRows[0] },
}
SAMPLES['bot.statMaxLevel'] = {
  args: { stat: botRows[0] },
  moved: { stat: botRows[1] ?? botRows[0] },
}

/**
 * Calculators that take nothing.
 *
 * A catalog builder has no input to flip, so the move-check cannot apply. The
 * claim that IS meaningful for them is determinism — two calls, one answer —
 * and it is checked below rather than the spec being quietly skipped.
 */
const NULLARY = CURATED.filter(c => c.params.length === 0).map(c => c.id)

/**
 * Calculators whose output does not vary over the data that actually exists.
 *
 * `bot.statMinLevel` is the case: every bot stat in the catalog starts at level
 * 0, so it returns 0 for every real input. The function is not wrong — its
 * "no populated levels" branch is a real guard — but a reader of its
 * description would reasonably expect a per-stat floor that varies, and it does
 * not.
 *
 * Exempted from the move-check with the reason written down, and the constancy
 * is CHECKED below rather than assumed. If the data ever gains a stat that
 * starts above 0, that check fails and this list is wrong, which is the point.
 */
const CONSTANT_OVER_REAL_DATA = ['bot.statMinLevel']



describe.skipIf(!MONOREPO)('the two tiers', () => {
  it('keeps the curated set small enough to read, and covers the rest', () => {
    expect(CURATED.length).toBeGreaterThanOrEqual(65)
    expect(GENERATED.length).toBeGreaterThan(800)
    expect(GENERATED.length).toBe(GENERATED_CALCULATORS.length)
  })

  it('never lets a generated entry masquerade as a checked one', () => {
    for (const spec of GENERATED) {
      // The placeholder text has to STAY a placeholder. If someone edits a
      // generated row into a real claim, it belongs in a curated file where the
      // generator will not overwrite it on the next run.
      expect(spec.invariants, spec.id).toEqual(['not yet checked — this entry is generated, not curated'])
    }
  })

  it('has no id claimed by both tiers', () => {
    const curatedIds = new Set(CURATED.map(c => c.id))
    for (const spec of GENERATED) expect(curatedIds.has(spec.id), spec.id).toBe(false)
  })
})

describe.skipIf(!MONOREPO)('the registry is a registry', () => {
  it('gives every calculator a unique handle and a reason', () => {
    expect(CALCULATORS.length).toBeGreaterThanOrEqual(900)
    expect(new Set(CALCULATORS.map(c => c.id)).size).toBe(CALCULATORS.length)
    for (const spec of CURATED) {
      // `because` is what keeps this from becoming a second copy of the SDK.
      expect(spec.because.length, spec.id).toBeGreaterThan(30)
      expect(spec.invariants.length, spec.id).toBeGreaterThan(0)
      expect(spec.produces.length, spec.id).toBeGreaterThan(0)
    }
  })

  it('wires an implementation for every declaration, and nothing extra', () => {
    // A declared handle with no implementation throws at call time, which is
    // the failure the registry exists to prevent, one layer down.
    expect([...IMPLEMENTED_CALCULATOR_IDS].sort()).toEqual([...CALCULATORS.map(c => c.id)].sort())
  })

  it('points every declaration at a module that exists and exports the symbol', () => {
    const root = path.join(__dirname, '..', '..', '..', '..', '..')
    for (const spec of CALCULATORS) {
      const absolute = path.join(root, spec.module)
      expect(fs.existsSync(absolute), spec.module).toBe(true)
      const text = fs.readFileSync(absolute, 'utf8')
      // Both forms. This originally accepted only `export function`, which is
      // half the formatting layer's shape — `export const x = (…) => …` is just
      // as much an export, and the check reported a real declaration as missing.
      // Re-exports (`export { x } from './…'`) are also a real public surface.
      const exported = new RegExp(
        `export\\s+(?:async\\s+)?(?:function\\s+${spec.symbol}\\b|const\\s+${spec.symbol}\\s*[:=]|\\{[^}]*\\b${spec.symbol}\\b[^}]*\\})`,
      ).test(text)
      expect(exported, `${spec.id} -> ${spec.symbol}`).toBe(true)
    }
  })
})

describe.skipIf(!MONOREPO)('every curated calculator runs', () => {
  for (const spec of CURATED) {
    // `epaths.effectiveDamage` needs a whole config; it has its own suites and
    // is exercised there rather than with a token sample here. Saying so beats
    // quietly excluding it.
    if (spec.id === 'epaths.effectiveDamage') continue

    it(spec.id, () => {
      const sample = SAMPLES[spec.id]
      if (!sample) {
        // Nullary: no arguments to sample, but it still has to run.
        expect(spec.params.length, `${spec.id} has no sample arguments`).toBe(0)
        expect(runCalculator(spec.id).id).toBe(spec.id)
        return
      }
      const result = runCalculator(spec.id, sample.args)
      expect(result.id).toBe(spec.id)
      expect(result.value === null || result.value !== undefined, spec.id).toBe(true)
      expect(result.invariants).toEqual(spec.invariants)
    })
  }
})

describe.skipIf(!MONOREPO)('every curated calculator moves', () => {
  /*
   * The check the whole registry is worth something for.
   *
   * A declared input that changes nothing is this repository's characteristic
   * defect: supported by the model, never set by the wiring, and nothing
   * anywhere reports it. Flipping the input and asserting the output moves is
   * the only thing that separates a wired calculator from a decorative one.
   */
  for (const spec of CURATED) {
    if (spec.id === 'epaths.effectiveDamage') continue
    if (NULLARY.includes(spec.id)) continue
    if (CONSTANT_OVER_REAL_DATA.includes(spec.id)) continue

    it(`${spec.id} responds to its inputs`, () => {
      const sample = SAMPLES[spec.id]
      const before = JSON.stringify(runCalculator(spec.id, sample.args).value)
      const after = JSON.stringify(runCalculator(spec.id, sample.moved).value)
      expect(after, `${spec.id} returned the same value for different inputs`).not.toBe(before)
    })
  }

  it('names the calculators that take no input, rather than skipping them quietly', () => {
    // If this list grows, someone added a nullary calculator and the move-check
    // stopped covering it. Better that it is written down than inferred.
    expect(NULLARY.sort()).toEqual([
      'guardian.definitions',
      'workshop.enhancementDefinitions',
      'workshop.statDefinitions',
    ])
  })

  it('bot.statMinLevel really is constant over every stat in the catalog', () => {
    // The exemption above, as a check. Measured: every bot stat begins at 0.
    const minimums = new Set<number>()
    for (const bot of BOT_UPGRADES_DATA) {
      for (const row of normalizeBotStats(bot)) {
        minimums.add(runCalculator('bot.statMinLevel', { stat: row }).value as number)
      }
    }
    expect([...minimums]).toEqual([0])
    // And its sibling does vary, so the catalog is not simply empty.
    const maxima = new Set<number>()
    for (const row of normalizeBotStats(BOT_UPGRADES_DATA[0])) {
      maxima.add(runCalculator('bot.statMaxLevel', { stat: row }).value as number)
    }
    expect(maxima.size).toBeGreaterThan(1)
  })

  for (const id of ['guardian.definitions', 'workshop.statDefinitions', 'workshop.enhancementDefinitions']) {
    it(`${id} is deterministic`, () => {
      // The claim that replaces "does it move" for a calculator with no input.
      // A builder that read state or the clock would fail here.
      const first = JSON.stringify(runCalculator(id).value)
      const second = JSON.stringify(runCalculator(id).value)
      expect(second).toBe(first)
      expect(first.length).toBeGreaterThan(2)
    })
  }
})

describe.skipIf(!MONOREPO)('calling one wrong says so, rather than answering', () => {
  it('refuses an unknown handle and points at the list', () => {
    expect(() => runCalculator('lab.durationDay')).toThrow(CalculatorError)
    expect(() => runCalculator('lab.durationDay')).toThrow(/no calculator/)
  })

  it('names a missing required parameter instead of returning NaN', () => {
    // Without this the argument arrives as `undefined`, comes back as NaN or 0,
    // and reads as an answer.
    expect(() => runCalculator('lab.durationDays', { labKey: 'damage' }))
      .toThrow(/needs "level"/)
  })

  it('rejects a parameter it does not have', () => {
    expect(() => runCalculator('lab.maxLevel', { lab: 'damage' }))
      .toThrow(/has no parameter "lab"/)
  })

  it('rejects the wrong type rather than coercing it', () => {
    expect(() => runCalculator('lab.coinDiscount', { coinDiscountLabLevel: '12' }))
      .toThrow(/wants "coinDiscountLabLevel" as number/)
  })

  it('rejects a non-finite number', () => {
    expect(() => runCalculator('lab.coinDiscount', { coinDiscountLabLevel: Number.NaN }))
      .toThrow(/finite/)
  })
})

describe.skipIf(!MONOREPO)('the generated tier is reachable', () => {
  it('wires an implementation for every generated handle', () => {
    for (const spec of GENERATED) {
      expect(IMPLEMENTED_CALCULATOR_IDS.includes(spec.id), spec.id).toBe(true)
    }
  })

  // Hundreds of real functions, some of which build whole catalogs. The default
  // 5s is for unit tests, not for a smoke pass over the SDK's exported surface.
  it('actually runs the ones that need no arguments', { timeout: 120_000 }, () => {
    /*
     * The subset that CAN be smoke-run without inventing fixtures: generated
     * calculators whose parameters are all optional. Everything else needs real
     * domain values, and a made-up one proves nothing about either side.
     *
     * Counted rather than asserted at a fixed number, because the count moves
     * with the SDK. What matters is that the path from handle to shipped
     * function works at runtime and not only at compile time.
     */
    // Async ones are excluded and counted separately. Calling one without its
    // arguments REJECTS rather than throwing, and a rejection nobody awaited is
    // an unhandled rejection — two of them appeared here before `isAsync` was
    // recorded, and vitest warns that they can cause false positives.
    const asyncOnes = GENERATED.filter(c => c.isAsync)
    expect(asyncOnes.length).toBeGreaterThan(0)

    const noArgs = GENERATED
      .filter(c => !c.isAsync)
      .filter(c => c.params.every(p => p.optional))
    expect(noArgs.length).toBeGreaterThan(10)

    let ran = 0
    const threw: string[] = []
    for (const spec of noArgs) {
      try {
        runCalculator(spec.id)
        ran += 1
      } catch (error) {
        // A function that throws on absent arguments is not a registry fault —
        // it is a function with required arguments the types called optional.
        // Named, so the number is not quietly flattering.
        threw.push(`${spec.id}: ${String((error as Error).message).slice(0, 60)}`)
      }
    }
    expect(ran, `none ran; threw:\n${threw.slice(0, 5).join('\n')}`).toBeGreaterThan(0)
  })
})

describe.skipIf(!MONOREPO)('the dependency graph', () => {
  it('declares only dependencies the source really has', () => {
    /*
     * VERIFIED, not believed. Each `dependsOn` says the caller's module
     * references the callee's exported symbol. A graph nobody checks drifts
     * into a diagram of what someone once intended.
     */
    const root = path.join(__dirname, '..', '..', '..', '..', '..')
    for (const spec of CURATED) {
      const text = fs.readFileSync(path.join(root, spec.module), 'utf8')
      for (const dependencyId of spec.dependsOn) {
        const dependency = calculatorSpec(dependencyId)
        expect(dependency, `${spec.id} depends on unknown ${dependencyId}`).toBeTruthy()
        expect(
          text.includes(dependency!.symbol),
          `${spec.id} declares it calls ${dependencyId} (${dependency!.symbol}) `
          + `but ${spec.module} never mentions it`,
        ).toBe(true)
      }
    }
  })

  it('connects readers to producers through concepts', () => {
    const graph = calculatorGraph()
    expect(graph.nodes.length).toBe(CALCULATORS.length)
    expect(graph.edges.length).toBeGreaterThan(0)

    // The question an agent actually has: what feeds effective damage?
    const upstream = upstreamOf('epaths.effectiveDamage')
    expect(upstream).toContain('spotlight.coverage')
    expect(upstream).toContain('assist.substatCap')
    // And transitively, through `uw.statValue` producing what coverage reads.
    expect(upstream).toContain('uw.statValue')
  })

  it('answers where a value comes from and what breaks if it changes', () => {
    expect(calculatorsProducing('spotlight.coverage').map(c => c.id))
      .toEqual(['spotlight.coverage'])
    expect(calculatorsReading('uw.statLevel').map(c => c.id))
      .toContain('uw.stoneCost')
  })

  it('has no dependency on a handle that does not exist', () => {
    const ids = new Set(CALCULATORS.map(c => c.id))
    for (const edge of calculatorGraph().edges) {
      expect(ids.has(edge.from), edge.from).toBe(true)
      expect(ids.has(edge.to), edge.to).toBe(true)
    }
  })

  it('terminates on a graph with a cycle', () => {
    // `lab.speedTotal` both reads and produces `lab.speed`, which is a real
    // fixed point rather than a mistake. If the walk did not guard against it
    // this would hang rather than fail, which is the worse failure.
    expect(() => upstreamOf('lab.durationDays')).not.toThrow()
    expect(upstreamOf('lab.durationDays')).toContain('lab.speedTotal')
  })
})

describe.skipIf(!MONOREPO)('finding a calculator without knowing its handle', () => {
  it('matches on id, title, concept and sheet name', () => {
    expect(listCalculators('spotlight').map(c => c.id)).toContain('spotlight.coverage')
    expect(listCalculators('lab.researchDays').map(c => c.id)).toContain('lab.durationDays')
    // The sheet's own name for it, which is what an agent reading the workbook
    // will have in hand.
    expect(listCalculators('EPG_ASSIST_SUB_CAP').map(c => c.id)).toContain('assist.substatCap')
    expect(listCalculators('DVT_UW_STAT').map(c => c.id)).toContain('uw.statValue')
  })

  it('returns everything when unfiltered', () => {
    expect(listCalculators()).toHaveLength(CALCULATORS.length)
  })
})

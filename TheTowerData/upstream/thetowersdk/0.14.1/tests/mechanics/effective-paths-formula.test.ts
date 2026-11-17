import { describe, expect, it } from 'vitest'
import fixtures from '../../fixtures/mechanics/effective-paths-formula.fixtures.json'
import liveDocument from '../../fixtures/mechanics/effective-paths-live-document.fixtures.json'
import {
  EffectivePathsFormulaError,
  parseSheetFunction,
} from '../../src/mechanics/effective-paths/formula'
import { evaluateStat, parseEffectivePathsDocument } from '../../src/mechanics/effective-paths/schema'
import { type EffectivePathsInputs } from '../../src/mechanics/effective-paths/types'
import {
  effectiveArmor,
  effectiveDefenseAbsolute,
  effectiveDefensePercent,
  effectiveHealth,
  effectiveMaxRecovery,
  effectiveRegen,
  effectiveWallHealth,
  effectiveWallRegen,
} from '../../src/mechanics/effective-paths/hp'

/**
 * The acceptance test for extraction.
 *
 * The hand-written functions in `effective-paths-hp.ts` are already checked
 * against the live sheet, cell by cell and over a 40-step path. So the question
 * for the parser is not "does it agree with the sheet" — it is "does it agree
 * with the version we already proved agrees with the sheet".
 *
 * Each function below is parsed straight from the sheet's own text and then
 * driven with the same randomised inputs as its hand-written twin. Agreeing on
 * hundreds of random vectors, across formulas that use gates, comparisons,
 * percentages, term-to-term references and caps, is what makes it safe to let
 * an extracted document replace hand-written code.
 */

type Args = readonly number[]

/** Deterministic PRNG, so a failure is reproducible. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

/**
 * Plausible values per parameter. Levels want small integers, percentages want
 * small fractions, and flags want 0 or 1 — feeding a level into a flag would
 * pass trivially without testing the gate.
 */
function sampleFor(parameter: string, random: () => number): number {
  const name = parameter.toLowerCase()
  if (name.startsWith('has_')) return random() < 0.5 ? 0 : 1
  if (name.endsWith('_lvl') || name.endsWith('_level')) return Math.floor(random() * 40)
  if (name.endsWith('_pct')) return random() * 0.5
  if (name.endsWith('_sac') || name.endsWith('_bac')) return Math.floor(random() * 60)
  if (name.endsWith('_sub') || name.endsWith('_effect')) return random() * 3
  if (name === 'ws_val') return random() * 1000
  if (name === 'card_val') return 1 + random() * 2
  if (name === 'disco') return 1 + random()
  return random() * 2
}

/** The hand-written twin of each sheet function, taking positional arguments. */
const HAND_WRITTEN: Record<string, (a: Args) => number> = {
  EPH_HEALTH: a => effectiveHealth({
    workshopValue: a[0], labLevel: a[1], hasHealthCard: !!a[2], cardValue: a[3],
    hasCardMastery: !!a[4], masteryLevel: a[5], workshopEnhancementLevel: a[6],
    hasPerk: !!a[7], perkBonusLabLevel: a[8], hasCoinTradeOffPerk: !!a[9],
    hasRegenTradeOffPerk: !!a[10], relicPct: a[11], vaultPct: a[12],
    hasDeathWaveHealth: !!a[13], deathWaveHealthLevel: a[14], dissonance: a[15],
  }),
  EPH_REGEN: a => effectiveRegen({
    workshopValue: a[0], labLevel: a[1], hasRegenCard: !!a[2], cardValue: a[3],
    hasCardMastery: !!a[4], masteryLevel: a[5], labSubstatCap: a[6], stoneSubstatCap: a[7],
    primarySubstat: a[8], assistSubstat: a[9], workshopEnhancementLevel: a[10],
    hasPerk: !!a[11], perkBonusLabLevel: a[12], hasEnemyHealthTradeOffPerk: !!a[13],
    hasRegenTradeOffPerk: !!a[14], improveTradeOffPerksLabLevel: a[15], relicPct: a[16],
    vaultPct: a[17], hasSecondWindMastery: !!a[18], secondWindMasteryLevel: a[19],
  }),
  EPH_DABS: a => effectiveDefenseAbsolute({
    workshopValue: a[0], labLevel: a[1], hasDefenseAbsoluteCard: !!a[2], cardValue: a[3],
    labSubstatCap: a[4], stoneSubstatCap: a[5], primarySubstat: a[6], assistSubstat: a[7],
    workshopEnhancementLevel: a[8], hasPerk: !!a[9], perkBonusLabLevel: a[10],
    relicPct: a[11], vaultPct: a[12],
  }),
  EPH_DEF_PCT: a => effectiveDefensePercent({
    workshopValue: a[0], labLevel: a[1], hasDefensePercentCard: !!a[2], cardValue: a[3],
    hasCardMastery: !!a[4], masteryLevel: a[5], labSubstatCap: a[6], stoneSubstatCap: a[7],
    primarySubstat: a[8], assistSubstat: a[9], hasPerk: !!a[10], perkBonusLabLevel: a[11],
    relicPct: a[12], vaultPct: a[13],
  }),
  EPH_ARMOR: a => effectiveArmor({
    primaryBonus: a[0], hasAssist: !!a[1], assistBonus: a[2],
    labBonusCap: a[3], stoneBonusCap: a[4],
  }),
  EPH_WALL_HEALTH: a => effectiveWallHealth({
    workshopValue: a[0], labLevel: a[1], labSubstatCap: a[2], stoneSubstatCap: a[3],
    primarySubstat: a[4], assistSubstat: a[5], workshopEnhancementLevel: a[6],
    primaryEffect: a[7], assistEffect: a[8], fortressLevel: a[9],
  }),
  EPH_WALL_REGEN: a => effectiveWallRegen({
    labLevel: a[0], primaryEffect: a[1], assistEffect: a[2],
  }),
  EPH_MAX_RCVR: a => effectiveMaxRecovery({
    workshopValue: a[0], labLevel: a[1], labSubstatCap: a[2], stoneSubstatCap: a[3],
    primarySubstat: a[4], assistSubstat: a[5], workshopEnhancementLevel: a[6], vaultPct: a[7],
  }),
}

const FUNCTION_NAMES = Object.keys(fixtures.functions) as Array<keyof typeof fixtures.functions>

describe('parsing the sheet\'s eHP functions', () => {
  it('has every eHP function, and a hand-written twin for each', () => {
    expect(FUNCTION_NAMES.length).toBe(8)
    for (const name of FUNCTION_NAMES) expect(HAND_WRITTEN[name], name).toBeDefined()
  })

  for (const name of FUNCTION_NAMES) {
    it(`${name} parses into a valid stat`, () => {
      const stat = parseSheetFunction(name, fixtures.functions[name])
      expect(stat.sheetFunction).toBe(name)
      expect(stat.inputs.length).toBeGreaterThan(0)

      // Round-trip through validation: an extracted stat must be a legal
      // document, or the sync would produce something the client rejects.
      const result = parseEffectivePathsDocument({
        schemaVersion: 1,
        sheetVersion: fixtures.sheetVersion,
        generatedAt: '2026-08-10T00:00:00.000Z',
        aliases: [],
        stats: [stat],
      })
      expect(result.ok, result.ok ? '' : result.errors.join('; ')).toBe(true)
    })

    it(`${name} evaluates identically to the hand-written version`, () => {
      const stat = parseSheetFunction(name, fixtures.functions[name])
      const random = makeRandom(0x5eed + name.length)

      for (let trial = 0; trial < 250; trial++) {
        const args = stat.inputs.map(parameter => sampleFor(parameter, random))
        const inputs: Record<string, number> = {}
        stat.inputs.forEach((parameter, i) => { inputs[parameter] = args[i] })

        const parsed = evaluateStat(stat, inputs as EffectivePathsInputs).value
        const handWritten = HAND_WRITTEN[name](args)

        const scale = Math.max(Math.abs(handWritten), 1e-9)
        expect(
          Math.abs(parsed - handWritten) / scale,
          `${name} trial ${trial} args=${JSON.stringify(args)}`,
        ).toBeLessThan(1e-9)
      }
    })
  }
})

/**
 * End-to-end: the document the deployed Appwrite function actually returned.
 *
 * The tests above parse a fixture of formula text committed alongside them, so
 * they prove the parser is right about a snapshot. This one takes what the live
 * pipeline produced — sheet export, zip, XML decode, parse, validate — and
 * holds it to the same standard.
 *
 * It also catches something nothing else here can: the maintainers changing a
 * formula. Captured at v5.09.03.01, one release *newer* than the workbook the
 * rest of these fixtures came from, and it still agrees — so that release
 * changed nothing in the eHP layer. A release that does will fail this, which
 * is the point.
 */
describe('the document the deployed function returned', () => {
  it('is a valid document at the schema version this package speaks', () => {
    const result = parseEffectivePathsDocument(liveDocument)
    expect(result.ok, result.ok ? '' : result.errors.join('; ')).toBe(true)
    expect(liveDocument.stats.length).toBe(8)
  })

  it('carries the alias registry, so a consumer can map names without this package', () => {
    expect(liveDocument.aliases.length).toBeGreaterThan(10)
    const chrono = liveDocument.aliases.filter(a => a.id.startsWith('chrono-field-'))
    expect(chrono.map(a => a.isUnlock).sort()).toEqual([false, true])
  })

  for (const stat of liveDocument.stats) {
    const name = stat.sheetFunction as string
    it(`${name} evaluates identically to the hand-written version`, () => {
      const handWritten = HAND_WRITTEN[name]
      expect(handWritten, `no hand-written twin for ${name}`).toBeDefined()

      const random = makeRandom(0xd0c + name.length)
      for (let trial = 0; trial < 250; trial++) {
        const args = stat.inputs.map(parameter => sampleFor(parameter, random))
        const inputs: Record<string, number> = {}
        stat.inputs.forEach((parameter, i) => { inputs[parameter] = args[i] })

        const fromSheet = evaluateStat(
          stat as unknown as Parameters<typeof evaluateStat>[0],
          inputs as EffectivePathsInputs,
        ).value
        const expected = handWritten(args)

        const scale = Math.max(Math.abs(expected), 1e-9)
        expect(
          Math.abs(fromSheet - expected) / scale,
          `${name} trial ${trial} args=${JSON.stringify(args)}`,
        ).toBeLessThan(1e-9)
      }
    })
  }
})

describe('what the parser refuses', () => {
  it('rejects a function it cannot read exactly, rather than approximating', () => {
    // XLOOKUP reaches into a data table; there is no honest way to express that
    // as a term, so extraction must fail and leave it to a release.
    expect(() => parseSheetFunction(
      'DVT_LAB_COST',
      'LAMBDA(name, level, XLOOKUP(level, SEQUENCE(100), Table))',
    )).toThrow(EffectivePathsFormulaError)

    expect(() => parseSheetFunction('X', 'LAMBDA(a, BYROW(a, LAMBDA(r, SUM(r))))'))
      .toThrow(/not supported/)
  })

  it('rejects an unknown name instead of inventing an input', () => {
    expect(() => parseSheetFunction('X', 'LAMBDA(a, a * mystery')).toThrow()
    expect(() => parseSheetFunction('X', 'LAMBDA(a, a * mystery)'))
      .toThrow(/unknown name "mystery"/)
  })

  it('will not let a LET binding refer to itself', () => {
    expect(() => parseSheetFunction('X', 'LAMBDA(a, LET(B, B + 1, B))'))
      .toThrow(/unknown name "B"/)
  })

  it('requires LET to end with a result', () => {
    expect(() => parseSheetFunction('X', 'LAMBDA(a, LET(B, 1, C, 2))'))
      .toThrow(/must end with a result/)
  })
})

describe('shapes the parser normalises', () => {
  it('folds the sheet\'s percentages into plain numbers', () => {
    const stat = parseSheetFunction('X', 'LAMBDA(lvl, LET(LAB, 2%*lvl, LAB))')
    expect(stat.terms[0].expr).toEqual({ kind: 'linear', base: 0, perLevel: 0.02, level: 'lvl' })
  })

  it('recognises "base + perLevel x level" as a linear ramp', () => {
    const stat = parseSheetFunction('X', 'LAMBDA(lvl, LET(LAB, 1+0.03*lvl, LAB))')
    expect(stat.terms[0].expr).toEqual({ kind: 'linear', base: 1, perLevel: 0.03, level: 'lvl' })
  })

  it('keeps term references rather than inlining them', () => {
    const stat = parseSheetFunction('X', 'LAMBDA(a, LET(SAC, a*2, SUB, SAC+1, SUB))')
    expect(stat.terms[1].expr).toEqual({
      kind: 'sum',
      of: [{ kind: 'ref', term: 'SAC' }, { kind: 'const', value: 1 }],
    })
  })

  it('never folds a term reference into a linear', () => {
    // `linear.level` names an *input*, and evaluation looks it up in the
    // inputs rather than in the terms. Folding `SAC + 1` into a linear over
    // "SAC" would read a term as a missing input and throw at evaluation.
    const stat = parseSheetFunction('X', 'LAMBDA(a, LET(SAC, a*2, SUB, SAC*3, SUB))')
    expect(stat.terms[1].expr.kind).not.toBe('linear')
    expect(evaluateStat(stat, { a: 5 }).value).toBe(30)
  })
})

/**
 * The arithmetic the damage and economy functions need beyond what eHP used.
 *
 * Expected values are what Google Sheets itself computes for these forms —
 * FLOOR and CEILING snap to a multiple, ROUND takes decimal places, and IFS
 * falls through its pairs in order.
 */
describe('the wider arithmetic', () => {
  const evaluate = (formula: string, inputs: Record<string, number> = {}) => {
    const stat = parseSheetFunction('X', `LAMBDA(${Object.keys(inputs).join(', ')}${Object.keys(inputs).length ? ', ' : ''}${formula})`)
    return evaluateStat(stat, inputs as EffectivePathsInputs).value
  }

  it('raises to a power, both as an operator and as a function', () => {
    expect(evaluate('2^10')).toBe(1024)
    expect(evaluate('POW(2, 10)')).toBe(1024)
    expect(evaluate('POWER(9, 0.5)')).toBe(3)
    // The workshop curves are full of fractional exponents.
    expect(evaluate('0.077 * (100-1)^2.72')).toBeCloseTo(0.077 * Math.pow(99, 2.72), 9)
  })

  it('binds ^ tighter than multiplication, as the sheet does', () => {
    expect(evaluate('2*3^2')).toBe(18)
    expect(evaluate('-2^2')).toBe(-4)
  })

  it('sums a list', () => {
    expect(evaluate('SUM(1, 2, 3.5)')).toBe(6.5)
    expect(evaluate('SUM(a, b)', { a: 4, b: 6 })).toBe(10)
  })

  it('rounds, floors and ceilings the way the sheet does', () => {
    expect(evaluate('ROUND(3.14159, 2)')).toBe(3.14)
    expect(evaluate('ROUND(3.7)')).toBe(4)
    // FLOOR and CEILING take a multiple, not decimal places.
    expect(evaluate('FLOOR(7.9)')).toBe(7)
    expect(evaluate('FLOOR(17, 5)')).toBe(15)
    expect(evaluate('CEILING(17, 5)')).toBe(20)
  })

  it('takes an absolute value', () => {
    expect(evaluate('ABS(0-4.5)')).toBe(4.5)
  })

  it('falls through IFS in order', () => {
    expect(evaluate('IFS(a>10, 1, a>5, 2, TRUE, 3)', { a: 20 })).toBe(1)
    expect(evaluate('IFS(a>10, 1, a>5, 2, TRUE, 3)', { a: 7 })).toBe(2)
    expect(evaluate('IFS(a>10, 1, a>5, 2, TRUE, 3)', { a: 1 })).toBe(3)
    // Nothing matching yields 0, which is the closest honest answer to the
    // sheet's #N/A.
    expect(evaluate('IFS(a>10, 1)', { a: 1 })).toBe(0)
  })

  it('still refuses what it cannot read exactly', () => {
    expect(() => parseSheetFunction('X', 'LAMBDA(a, VLOOKUP(a, Table, 2))')).toThrow(/not supported/)
    expect(() => parseSheetFunction('X', 'LAMBDA(a, SUMPRODUCT(a, a))')).toThrow(/not supported/)
  })
})

describe('LET bindings are lazy, as the sheet makes them', () => {
  it('ignores a dead binding that references a name which does not exist', () => {
    // EPD_BST verbatim: it binds `1 + vault` while declaring no `vault`, and
    // the sheet answers anyway because nothing reads VaultBonus.
    const stat = parseSheetFunction('EPD_BST', `LAMBDA(ws_level, perk, substat, LET(
      WS, 1 + ws_level,
      VaultBonus, 1 + vault,
      WS + Perk + FLOOR(Substat)))`)

    expect(stat.terms.map(term => term.id)).toEqual(['WS'])
    // 1 + 10 = 11, plus perk 2, plus FLOOR(3.7) = 3.
    expect(evaluateStat(stat, { ws_level: 10, perk: 2, substat: 3.7 }).value).toBe(16)
  })

  it('still fails when the result actually depends on the broken binding', () => {
    expect(() => parseSheetFunction('X', `LAMBDA(a, LET(
      Bad, 1 + mystery,
      a * Bad))`)).toThrow(/unknown name "mystery"/)
  })

  it('fails when a live binding depends on a broken one', () => {
    // Bad is dead on its own, but Used reaches it, so it cannot be dropped.
    expect(() => parseSheetFunction('X', `LAMBDA(a, LET(
      Bad, 1 + mystery,
      Used, Bad * 2,
      a * Used))`)).toThrow(/unknown name "mystery"/)
  })
})

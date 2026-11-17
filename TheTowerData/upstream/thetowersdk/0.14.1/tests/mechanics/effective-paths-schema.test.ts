import { describe, expect, it } from 'vitest'
import {
  EFFECTIVE_PATHS_ALIASES,
  findEffectivePathsAlias,
  getEffectivePathsAliasesByDomain,
} from '../../src/mechanics/effective-paths/aliases'
import { collectDocumentInputs, collectExprInputs, EffectivePathsInputError, type EffectivePathsStat, evaluateExpr, evaluateStat, findAliasBySheetName, parseEffectivePathsDocument } from '../../src/mechanics/effective-paths/schema'
import { type EffectivePathsExpr } from '../../src/mechanics/effective-paths/types'

const input = (ref: string): EffectivePathsExpr => ({ kind: 'input', ref })
const constant = (value: number): EffectivePathsExpr => ({ kind: 'const', value })

describe('expressions', () => {
  const inputs = { labLevel: 10, spb: 25, cardValue: 2.4, hasPerk: true, hasCard: false }

  it('evaluates the shapes the sheet actually uses', () => {
    expect(evaluateExpr(constant(0.3), inputs)).toBe(0.3)
    expect(evaluateExpr(input('cardValue'), inputs)).toBe(2.4)
    // 1 + 0.03 * 10 — a lab that adds 3% a level.
    expect(evaluateExpr(
      { kind: 'linear', base: 1, perLevel: 0.03, level: 'labLevel' }, inputs,
    )).toBeCloseTo(1.3, 12)
    expect(evaluateExpr(
      { kind: 'divide', numerator: constant(1), denominator: constant(4) }, inputs,
    )).toBe(0.25)
  })

  it('gates on any expression, not just a bare flag', () => {
    const perk: EffectivePathsExpr = {
      kind: 'gated',
      when: input('hasPerk'),
      then: {
        kind: 'product',
        of: [constant(2), { kind: 'linear', base: 1, perLevel: 0.01, level: 'spb' }],
      },
      otherwise: constant(1),
    }
    expect(evaluateExpr(perk, inputs)).toBeCloseTo(2.5, 12)
    expect(evaluateExpr(perk, { ...inputs, hasPerk: false })).toBe(1)
  })

  it('handles the sheet\'s "<> 0" idiom for "no module equipped"', () => {
    // SF, IF(prim_effect + ass_effect <> 0, prim_effect + ass_effect, 1)
    const sum: EffectivePathsExpr = { kind: 'sum', of: [input('prim'), input('ass')] }
    const specialFactor: EffectivePathsExpr = {
      kind: 'gated',
      when: { kind: 'compare', op: 'neq', left: sum, right: constant(0) },
      then: sum,
      otherwise: constant(1),
    }
    expect(evaluateExpr(specialFactor, { prim: 0, ass: 0 })).toBe(1)
    expect(evaluateExpr(specialFactor, { prim: 2, ass: 0.5 })).toBe(2.5)
  })

  it('applies MIN and clamp for the caps the game enforces', () => {
    const capped: EffectivePathsExpr = {
      kind: 'min',
      of: [constant(0.98), { kind: 'linear', base: 0, perLevel: 0.5, level: 'labLevel' }],
    }
    expect(evaluateExpr(capped, inputs)).toBe(0.98)
    expect(evaluateExpr(capped, { ...inputs, labLevel: 1 })).toBe(0.5)

    expect(evaluateExpr(
      { kind: 'clamp', value: constant(5), max: 0.98 }, inputs,
    )).toBe(0.98)
  })

  it('fails loudly on a missing input rather than treating it as zero', () => {
    expect(() => evaluateExpr(input('nope'), inputs)).toThrow(EffectivePathsInputError)
    expect(() => evaluateExpr(
      { kind: 'linear', base: 1, perLevel: 1, level: 'missingLevel' }, inputs,
    )).toThrow(/missingLevel/)
    expect(() => evaluateExpr({ kind: 'ref', term: 'SAC' }, inputs)).toThrow(/SAC/)
  })

  it('reports every input it reads, including inside gates', () => {
    const expr: EffectivePathsExpr = {
      kind: 'gated',
      when: input('hasCard'),
      then: input('cardValue'),
      otherwise: { kind: 'linear', base: 1, perLevel: 0.03, level: 'labLevel' },
    }
    expect([...collectExprInputs(expr)].sort()).toEqual(['cardValue', 'hasCard', 'labLevel'])
  })
})

describe('stats', () => {
  /**
   * EPH_MAX_RCVR, as the sheet writes it. It is the awkward case: SUBSTAT
   * refers to the earlier SAC binding, and the result is neither a plain sum
   * nor a plain product.
   */
  const maxRecovery: EffectivePathsStat = {
    id: 'max-recovery',
    label: 'Max Recovery',
    sheetFunction: 'EPH_MAX_RCVR',
    inputs: ['ws_val', 'lab_lvl', 'stone_sac', 'lab_sac', 'prim_sub', 'ass_sub', 'wse_lvl', 'vault_pct'],
    terms: [
      { id: 'WS', label: 'Workshop', expr: input('ws_val') },
      { id: 'LAB', label: 'Lab', expr: { kind: 'linear', base: 0, perLevel: 0.01, level: 'lab_lvl' } },
      {
        id: 'SAC',
        label: 'Assist substat capacity',
        expr: {
          kind: 'product',
          of: [
            { kind: 'sum', of: [constant(1), input('stone_sac'), input('lab_sac')] },
            constant(0.01),
          ],
        },
      },
      {
        id: 'SUBSTAT',
        label: 'Substats',
        expr: {
          kind: 'sum',
          of: [input('prim_sub'), { kind: 'product', of: [input('ass_sub'), { kind: 'ref', term: 'SAC' }] }],
        },
      },
      { id: 'WSE', label: 'Enhancement', expr: { kind: 'linear', base: 1, perLevel: 0.01, level: 'wse_lvl' } },
      { id: 'VAULT', label: 'Vault', expr: { kind: 'sum', of: [constant(1), input('vault_pct')] } },
    ],
    // (WS + LAB + SUBSTAT) * WSE * VAULT
    result: {
      kind: 'product',
      of: [
        { kind: 'sum', of: [{ kind: 'ref', term: 'WS' }, { kind: 'ref', term: 'LAB' }, { kind: 'ref', term: 'SUBSTAT' }] },
        { kind: 'ref', term: 'WSE' },
        { kind: 'ref', term: 'VAULT' },
      ],
    },
  }

  it('evaluates terms in order and lets later terms use earlier ones', () => {
    const result = evaluateStat(maxRecovery, {
      ws_val: 1, lab_lvl: 0, stone_sac: 50, lab_sac: 50,
      prim_sub: 0, ass_sub: 2, wse_lvl: 0, vault_pct: 0,
    })
    // SAC = (1 + 50 + 50) * 0.01 = 1.01, so SUBSTAT = 0 + 2 * 1.01
    expect(result.terms.find(t => t.id === 'SAC')?.value).toBeCloseTo(1.01, 12)
    expect(result.terms.find(t => t.id === 'SUBSTAT')?.value).toBeCloseTo(2.02, 12)
    expect(result.value).toBeCloseTo(1 + 2.02, 12)
  })

  it('reports every term, so a breakdown view has something to show', () => {
    const result = evaluateStat(maxRecovery, {
      ws_val: 1, lab_lvl: 10, stone_sac: 0, lab_sac: 0,
      prim_sub: 0, ass_sub: 0, wse_lvl: 0, vault_pct: 0,
    })
    expect(result.terms.map(t => t.id)).toEqual(['WS', 'LAB', 'SAC', 'SUBSTAT', 'WSE', 'VAULT'])
  })
})

describe('document validation', () => {
  const valid = {
    schemaVersion: 1 as const,
    sheetVersion: 'v5.09.02.01',
    generatedAt: '2026-08-10T00:00:00.000Z',
    aliases: [{
      sheetName: 'Health', sheetAliases: [], id: 'health', label: 'Health',
      domain: 'lab' as const, category: 'Defense', saveKey: 'health', isUnlock: false,
    }],
    stats: [{
      id: 'health',
      label: 'Health',
      inputs: ['labLevel'],
      terms: [{ id: 'LAB', label: 'Lab', expr: { kind: 'linear' as const, base: 1, perLevel: 0.03, level: 'labLevel' } }],
      result: { kind: 'ref' as const, term: 'LAB' },
    }],
  }

  it('accepts a well-formed document', () => {
    const result = parseEffectivePathsDocument(valid)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(findAliasBySheetName(result.document, 'health')?.id).toBe('health')
      expect([...collectDocumentInputs(result.document)]).toEqual(['labLevel'])
    }
  })

  it('rejects rather than throwing, so a caller can keep its bundled copy', () => {
    for (const bad of [null, {}, 'nonsense', { ...valid, schemaVersion: 2 }]) {
      const result = parseEffectivePathsDocument(bad)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.errors.length).toBeGreaterThan(0)
    }
  })

  it('rejects a document that would mismap silently', () => {
    const dupes = parseEffectivePathsDocument({
      ...valid, aliases: [valid.aliases[0], { ...valid.aliases[0] }],
    })
    expect(dupes.ok).toBe(false)

    const stolen = parseEffectivePathsDocument({
      ...valid,
      aliases: [
        valid.aliases[0],
        { ...valid.aliases[0], id: 'other', sheetName: 'Other', sheetAliases: ['health'] },
      ],
    })
    expect(stolen.ok).toBe(false)
    if (!stolen.ok) expect(stolen.errors.join()).toMatch(/claimed twice/)
  })

  it('rejects a term that refers to one declared after it', () => {
    const result = parseEffectivePathsDocument({
      ...valid,
      stats: [{
        ...valid.stats[0],
        terms: [
          { id: 'A', label: 'A', expr: { kind: 'ref', term: 'B' } },
          { id: 'B', label: 'B', expr: { kind: 'const', value: 1 } },
        ],
        result: { kind: 'ref', term: 'A' },
      }],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.join()).toMatch(/before it is declared/)
  })

  it('rejects a result referring to a term that does not exist', () => {
    const result = parseEffectivePathsDocument({
      ...valid,
      stats: [{ ...valid.stats[0], result: { kind: 'ref', term: 'NOPE' } }],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.join()).toMatch(/undeclared term/)
  })

  it('rejects an expression that is not one of the known shapes', () => {
    const result = parseEffectivePathsDocument({
      ...valid,
      stats: [{
        ...valid.stats[0],
        terms: [{ id: 'X', label: 'X', expr: { kind: 'eval', code: 'process.exit()' } }],
        result: { kind: 'ref', term: 'X' },
      }],
    })
    expect(result.ok).toBe(false)
  })
})

describe('the alias registry', () => {
  it('takes every lab category from the catalog, so none can be invented', () => {
    const labs = getEffectivePathsAliasesByDomain('lab')
    expect(labs.length).toBeGreaterThan(10)
    for (const lab of labs) {
      expect(lab.saveKey, `${lab.sheetName} should have a saveKey`).toBeDefined()
      expect(lab.category.length).toBeGreaterThan(0)
    }
  })

  it('separates Chrono Field\'s unlock lab from the lab that increases it', () => {
    const amount = findEffectivePathsAlias('Chrono Field Reduction %')
    expect(amount?.id).toBe('chrono-field-reduction-amount')
    expect(amount?.saveKey).toBe('chrono_field_reduction')
    expect(amount?.isUnlock).toBe(false)
    expect(amount?.category).toBe('Ultimate Weapon')

    const unlock = findEffectivePathsAlias('Chrono Field Damage Reduction Unlock')
    expect(unlock?.saveKey).toBe('chrono_field_damage_reduction')
    expect(unlock?.isUnlock).toBe(true)

    expect(amount?.id).not.toBe(unlock?.id)
    expect(amount?.saveKey).not.toBe(unlock?.saveKey)
  })

  it('accepts both spellings the sheet uses for the trade-off perks lab', () => {
    expect(findEffectivePathsAlias('Improve Trade-off Perks')?.id)
      .toBe('improve-trade-off-perks')
    expect(findEffectivePathsAlias('Improve Trade-Off Perks')?.id)
      .toBe('improve-trade-off-perks')
  })

  it('keeps non-lab upgrades out of the lab domain', () => {
    const substat = findEffectivePathsAlias('Assist Module Substats - Armor')
    expect(substat?.domain).toBe('module')
    expect(substat?.saveKey).toBeUndefined()

    expect(findEffectivePathsAlias('Health Mastery')?.domain).toBe('card')
    expect(findEffectivePathsAlias('Dissonant Echo - Defense')?.domain).toBe('relic')
  })

  it('has no duplicate ids or sheet names', () => {
    const ids = EFFECTIVE_PATHS_ALIASES.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)

    const names = EFFECTIVE_PATHS_ALIASES.flatMap(a => [a.sheetName, ...a.sheetAliases])
      .map(n => n.toLowerCase())
    expect(new Set(names).size).toBe(names.length)
  })

  it('returns null for an unknown name instead of guessing', () => {
    // The weapon's default speed reduction is deliberately not a path upgrade.
    expect(findEffectivePathsAlias('Chrono Field Speed Reduction')).toBeNull()
    expect(findEffectivePathsAlias('')).toBeNull()
  })
})

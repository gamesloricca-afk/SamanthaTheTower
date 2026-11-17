import { describe, expect, it } from 'vitest'

import { computeModuleStat, inferModuleRarityFromBonus } from '../../src/data/modules/bonus'
import type { ModuleCalcType } from '../../src/data/modules/types'

describe('primary-module lab bonus', () => {
  it.each([undefined, 'Ancestral', 'Epic'])('infers the boosted Ancestral rarity with hint %s', (hint) => {
    expect(inferModuleRarityFromBonus({
      type: 'cannon', level: 1, bonus: 1.3926, primaryLabLevel: 30, hint,
    })).toBe('Ancestral')
  })

  it('keeps default-lab inverse behavior and rejects an invalid lab level', () => {
    expect(inferModuleRarityFromBonus({ type: 'cannon', level: 1, bonus: 1.302 })).toBe('Ancestral')
    expect(() => inferModuleRarityFromBonus({
      type: 'cannon', level: 1, bonus: 1.3926, primaryLabLevel: 31,
    })).toThrow(RangeError)
  })

  // Literal curve point: Epic + Cannon/Armor level 92 has a 100% bonus.
  it.each(['cannon', 'armor'] as const)('%s baseline 2 becomes 2.1 / 2.3', (type) => {
    const input = { type, rarityLabel: 'Epic +', level: 92 }
    expect(computeModuleStat(input)).toBe(2)
    expect(computeModuleStat({ ...input, primaryLabLevel: 0 })).toBe(2)
    expect(computeModuleStat({ ...input, primaryLabLevel: 10 })).toBeCloseTo(2.1, 12)
    expect(computeModuleStat({ ...input, primaryLabLevel: 30 })).toBeCloseTo(2.3, 12)
  })

  // Independent level-one Ancestral points, including the unboosted neutral 1.
  it.each([
    { type: 'cannon', baseline: 1.302, boosted: 1.3926 },
    { type: 'armor', baseline: 1.302, boosted: 1.3926 },
    { type: 'generator', baseline: 1.041, boosted: 1.0533 },
    { type: 'core', baseline: 1.41, boosted: 1.533 },
  ] as const)('$type output moves with the lab', ({ type, baseline, boosted }) => {
    expect(computeModuleStat({ type, rarityLabel: 'Ancestral', level: 1 })).toBeCloseTo(baseline, 12)
    const actual = computeModuleStat({ type, rarityLabel: 'Ancestral', level: 1, primaryLabLevel: 30 })
    expect(actual).toBeCloseTo(boosted, 12)
    expect(actual).toBeGreaterThan(baseline)
  })

  it('scales the bonus on the existing no-range path', () => {
    expect(computeModuleStat({ type: 'cannon', rarityLabel: 'Mythic', level: 301 })).toBeCloseTo(1.2, 12)
    expect(computeModuleStat({ type: 'cannon', rarityLabel: 'Mythic', level: 301, primaryLabLevel: 30 })).toBeCloseTo(1.26, 12)
  })

  it('preserves unknown rarity and type neutral results', () => {
    expect(computeModuleStat({ type: 'cannon', rarityLabel: 'unknown', level: 1, primaryLabLevel: 30 })).toBe(1)
    expect(computeModuleStat({ type: 'unknown' as ModuleCalcType, rarityLabel: 'Epic', level: 1, primaryLabLevel: 30 })).toBe(1)
  })

  it.each([-1, 31, 0.5, NaN, Infinity, -Infinity, null, '10'])('rejects invalid lab level %s', (primaryLabLevel) => {
    expect(() => computeModuleStat({
      type: 'cannon', rarityLabel: 'Epic', level: 1,
      primaryLabLevel: primaryLabLevel as number,
    })).toThrow(new RangeError('primaryLabLevel must be an integer from 0 to 30'))
  })
})

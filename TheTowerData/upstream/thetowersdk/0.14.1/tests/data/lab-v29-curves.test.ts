import { describe, expect, it } from 'vitest'
import { LAB_CATALOG } from '../../src/data/labs/catalog.data'
import { LAB_RESEARCH_BY_INDEX } from '../../src/data/labs/research'

const bySlug = Object.fromEntries(LAB_CATALOG.map(row => [row.slug, row]))

function level1(slug: string) {
  const row = bySlug[slug]
  const l1 = row?.levels?.find(r => r.level === 1)
  if (!l1) throw new Error(`no L1 for ${slug}`)
  return l1
}

function researchBase(index: number) {
  const row = LAB_RESEARCH_BY_INDEX.find(r => r.index === index)
  if (!row) throw new Error(`no research row ${index}`)
  return { baseCoinCost: row.baseCoinCost, baseTime: row.baseTime, levelMax: row.levelMax }
}

/** Released v29 lab curves checked against the catalog reference values. */
describe('v29 lab curves (242–252)', () => {
  const fleetSlugs = [
    'overcharge_exponent_reducer',
    'commander_radius',
    'saboteur_attack_speed',
  ] as const

  it.each(fleetSlugs)('%s L1 matches the reference base (1e21 coin, 1440000s time shape)', slug => {
    const l1 = level1(slug)
    const idx = LAB_RESEARCH_BY_INDEX.find(r => r.slug === slug)!.index
    const ref = researchBase(idx)
    expect(l1.cost).toBe(ref.baseCoinCost)
    expect(l1.duration).toBe('16d 16h 0m')
  })

  it('fleet labs share the enemy curve shape scaled ×1000 coin and ×1440000/1260000 time', () => {
    const enemyL1 = level1('overcharge_enemy_health')
    const fleetL1 = level1('overcharge_exponent_reducer')
    expect(fleetL1.cost! / enemyL1.cost!).toBeCloseTo(1000, 6)
  })

  it('excludes unreleased card labs while retaining reserved research index 250', () => {
    expect(bySlug.recharge_bastion).toBeUndefined()
    const reserved = LAB_RESEARCH_BY_INDEX.find(row => row.index === 250)
    expect(reserved).toMatchObject({
      index: 250, displayName: null, slug: null, category: null,
      baseCoinCost: 30, baseTime: 15, levelMax: 99,
    })
  })

  it('preserves the v29 Global Presets one-shot separately from v29.1 Card Presets', () => {
    const l1 = level1('global_presets')
    const preset = level1('card_presets')
    expect(l1.cost).toBe(preset.cost)
    expect(l1.duration).toBe('13:53:00')
    expect(preset.duration).toBe('13:53:20')
    expect(bySlug.global_presets?.levels?.length).toBe(1)
  })

  it('enemy labs 242–245 L1 still match the reference 1e18 / 1260000s', () => {
    for (const slug of [
      'overcharge_enemy_health',
      'overcharge_enemy_damage',
      'commander_enemy_health',
      'saboteur_enemy_health',
    ]) {
      const l1 = level1(slug)
      expect(l1.cost).toBe(1e18)
      expect(l1.duration).toBe('350:00:00')
    }
  })

  it('does not ship bastion_mastery (cut from final v29)', () => {
    expect(bySlug.bastion_mastery).toBeUndefined()
    expect(LAB_RESEARCH_BY_INDEX.find(r => r.index === 249)?.displayName).toBeNull()
    expect(LAB_RESEARCH_BY_INDEX.find(r => r.index === 249)?.slug).toBeNull()
  })
})

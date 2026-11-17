import { describe, expect, it } from 'vitest'
import { LAB_CATALOG } from '../../src/data/labs/catalog.data'
import { getSharedToolLabs } from '../../src/data/labs/overview'

/**
 * The invariants that make one catalog worth having over the two files it
 * replaced. Each of these was violated by the old pair, and each violation was
 * silent.
 */
describe('lab catalog', () => {
  it('names every lab exactly once', () => {
    // labs-levels and labs-static were merged by name at runtime, so a name in
    // both would have had one silently win.
    const names = LAB_CATALOG.map(lab => lab.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('gives every lab a unique slug', () => {
    const slugs = LAB_CATALOG.map(lab => lab.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('uses player-facing display names, never raw snake_case codes', () => {
    // Historical bug: ~145 rows filed the research slug in `name`, so dropdowns
    // showed amp_bot_cooldown next to Attack Speed Mastery.
    const codeNames = LAB_CATALOG
      .map(lab => lab.name)
      .filter(name => /_/.test(name) || /^[a-z0-9]+(?:_[a-z0-9]+)+$/.test(name))
    expect(codeNames).toEqual([])
  })

  it('holds the whole catalog', () => {
    // 150 from labs-levels plus 75 from labs-static, which were disjoint, plus the v29
    // additions (Cells Mastery, the three Fleet labs now under Enemies, and the preset labs).
    expect(LAB_CATALOG.length).toBe(234)
    const levels = LAB_CATALOG.reduce((total, lab) => total + lab.levels.length, 0)
    expect(levels).toBeGreaterThanOrEqual(5900)
  })

  it('states every cost in absolute coins', () => {
    // The old labs-static half stored cost pre-scaled by a currency of B/T/q/Q,
    // so `cost: 1.1` meant 1.1 quadrillion. Card mastery level 1 is the case
    // that proves the scaling actually happened rather than being dropped.
    const mastery = LAB_CATALOG.find(lab => lab.name === 'Damage Mastery')
    expect(mastery?.levels.find(level => level.level === 1)?.cost).toBe(1.1e15)

    // And nothing is left in the old units: a real lab cost is never a small
    // fraction, which is what a pre-scaled value looks like.
    const suspicious = LAB_CATALOG.flatMap(lab => lab.levels
      .filter(level => level.cost > 0 && level.cost < 1)
      .map(level => `${lab.name} L${level.level}: ${level.cost}`))
    expect(suspicious).toEqual([])
  })

  it('carries no currency field for anyone to branch on', () => {
    for (const lab of LAB_CATALOG) {
      expect(lab).not.toHaveProperty('currency')
      for (const level of lab.levels) expect(level).not.toHaveProperty('currency')
    }
  })

  it('keeps value on the lab, not repeated on every level', () => {
    // It was identical on all 1514 static levels and only the first was read.
    for (const lab of LAB_CATALOG) {
      for (const level of lab.levels) expect(level).not.toHaveProperty('value')
    }
    const mastery = LAB_CATALOG.find(lab => lab.name === 'Damage Mastery')
    expect(mastery?.value).toMatchObject({ '0': 1.4, '9': 5 })
  })

  it('feeds getSharedToolLabs one record per lab', () => {
    // The two-file merge could emit a lab twice, once under its slug and once
    // under its display name, because it wrote both keys into the same map.
    const shared = getSharedToolLabs()
    expect(shared.length).toBe(LAB_CATALOG.length)
    expect(new Set(shared.map(lab => lab.name)).size).toBe(shared.length)
  })
})

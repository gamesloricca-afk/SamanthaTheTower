import { describe, expect, it } from 'vitest'
import { levelsAfterPath, planPath } from '../../src/mechanics/effective-paths/planner'
import { type PathUpgrade } from '../../src/mechanics/effective-paths/types'

/** A linear stat: each level of each upgrade adds a fixed amount. */
function linearEvaluate(weights: Record<string, number>) {
  return (levels: ReadonlyMap<string, number>) => {
    let total = 0
    for (const [id, level] of levels) total += (weights[id] ?? 0) * level
    return total
  }
}

const flatCost = (prices: Record<string, number>) => (id: string) => prices[id] ?? 1

describe('planPath', () => {
  const upgrades: PathUpgrade[] = [
    { id: 'cheap', name: 'Cheap', level: 0, maxLevel: 100 },
    { id: 'strong', name: 'Strong', level: 0, maxLevel: 100 },
  ]

  it('buys the best return on investment first', () => {
    // cheap: +1 per level at cost 1 -> roi 1. strong: +10 at cost 2 -> roi 5.
    const path = planPath({
      upgrades,
      steps: 3,
      evaluate: linearEvaluate({ cheap: 1, strong: 10 }),
      cost: flatCost({ cheap: 1, strong: 2 }),
    })

    expect(path.map(s => s.id)).toEqual(['strong', 'strong', 'strong'])
    expect(path[0]).toMatchObject({ step: 1, level: 1, cost: 2, gain: 10, roi: 5, value: 10 })
    expect(path[2]).toMatchObject({ level: 3, value: 30, cumulativeCost: 6 })
  })

  it('breaks a tie by declaration order, as the sheet takes the leftmost column', () => {
    const path = planPath({
      upgrades,
      steps: 2,
      evaluate: linearEvaluate({ cheap: 5, strong: 5 }),
      cost: flatCost({ cheap: 1, strong: 1 }),
    })
    expect(path.map(s => s.id)).toEqual(['cheap', 'cheap'])
  })

  it('keeps the leftmost column when a later ROI only barely wins (soft margin)', () => {
    // strong is ~0.5% ahead; soft 0.6% margin keeps cheap (left).
    const path = planPath({
      upgrades,
      steps: 1,
      evaluate: linearEvaluate({ cheap: 1, strong: 1.005 }),
      cost: flatCost({ cheap: 1, strong: 1 }),
      roiSoftTieRelative: 0.006,
    })
    expect(path.map(s => s.id)).toEqual(['cheap'])
  })

  it('lets a later column win when it clears the soft margin', () => {
    const path = planPath({
      upgrades,
      steps: 1,
      evaluate: linearEvaluate({ cheap: 1, strong: 1.01 }),
      cost: flatCost({ cheap: 1, strong: 1 }),
      roiSoftTieRelative: 0.006,
    })
    expect(path.map(s => s.id)).toEqual(['strong'])
  })

  it('switches upgrades when returns diminish', () => {
    // `fading` pays 10 for its first level and 1 after; `steady` always pays 4.
    const evaluate = (levels: ReadonlyMap<string, number>) => {
      const fading = levels.get('fading') ?? 0
      const steady = levels.get('steady') ?? 0
      return (fading > 0 ? 10 + (fading - 1) : 0) + steady * 4
    }
    const path = planPath({
      upgrades: [
        { id: 'fading', name: 'Fading', level: 0, maxLevel: 100 },
        { id: 'steady', name: 'Steady', level: 0, maxLevel: 100 },
      ],
      steps: 3,
      evaluate,
      cost: () => 1,
    })
    expect(path.map(s => s.id)).toEqual(['fading', 'steady', 'steady'])
  })

  it('stops at targetLevel, which overrides maxLevel', () => {
    const path = planPath({
      upgrades: [
        { id: 'capped', name: 'Capped', level: 3, maxLevel: 100, targetLevel: 5 },
      ],
      steps: 10,
      evaluate: linearEvaluate({ capped: 1 }),
      cost: () => 1,
    })
    expect(path.map(s => s.level)).toEqual([4, 5])
  })

  it('stops at maxLevel when no target is set', () => {
    const path = planPath({
      upgrades: [{ id: 'a', name: 'A', level: 8, maxLevel: 10 }],
      steps: 10,
      evaluate: linearEvaluate({ a: 1 }),
      cost: () => 1,
    })
    expect(path.map(s => s.level)).toEqual([9, 10])
  })

  it('skips an upgrade whose cost is unusable rather than dividing by it', () => {
    const path = planPath({
      upgrades: [
        { id: 'free', name: 'Free', level: 0, maxLevel: 10 },
        { id: 'real', name: 'Real', level: 0, maxLevel: 10 },
      ],
      steps: 2,
      evaluate: linearEvaluate({ free: 1000, real: 1 }),
      cost: flatCost({ free: 0, real: 1 }),
    })
    expect(path.map(s => s.id)).toEqual(['real', 'real'])
  })

  it('returns an empty path when everything is already capped', () => {
    const path = planPath({
      upgrades: [{ id: 'a', name: 'A', level: 10, maxLevel: 10 }],
      steps: 5,
      evaluate: linearEvaluate({ a: 1 }),
      cost: () => 1,
    })
    expect(path).toEqual([])
  })

  it('accumulates cost across steps', () => {
    const path = planPath({
      upgrades: [{ id: 'a', name: 'A', level: 0, maxLevel: 10 }],
      steps: 3,
      evaluate: linearEvaluate({ a: 1 }),
      cost: (_id, nextLevel) => nextLevel * 10,
    })
    expect(path.map(s => s.cost)).toEqual([10, 20, 30])
    expect(path.map(s => s.cumulativeCost)).toEqual([10, 30, 60])
  })

  it('costs each step at the level it is buying', () => {
    const seen: number[] = []
    planPath({
      upgrades: [{ id: 'a', name: 'A', level: 4, maxLevel: 10 }],
      steps: 2,
      evaluate: linearEvaluate({ a: 1 }),
      cost: (_id, nextLevel) => {
        seen.push(nextLevel)
        return 1
      },
    })
    expect(seen).toEqual([5, 6])
  })

  it('leaves evaluate a clean level map — no upgrade stays applied after probing', () => {
    const probes: Array<Record<string, number>> = []
    planPath({
      upgrades: [
        { id: 'a', name: 'A', level: 0, maxLevel: 10 },
        { id: 'b', name: 'B', level: 0, maxLevel: 10 },
      ],
      steps: 1,
      evaluate: levels => {
        probes.push(Object.fromEntries(levels))
        return (levels.get('a') ?? 0) + (levels.get('b') ?? 0) * 2
      },
      cost: () => 1,
    })
    // baseline, then one probe per candidate, each raising exactly one level.
    expect(probes[0]).toEqual({ a: 0, b: 0 })
    expect(probes[1]).toEqual({ a: 1, b: 0 })
    expect(probes[2]).toEqual({ a: 0, b: 1 })
  })
})

describe('levelsAfterPath', () => {
  it('reports where the path leaves you, including untouched upgrades', () => {
    const upgrades: PathUpgrade[] = [
      { id: 'a', name: 'A', level: 2, maxLevel: 10 },
      { id: 'b', name: 'B', level: 7, maxLevel: 10 },
    ]
    const path = planPath({
      upgrades,
      steps: 3,
      evaluate: linearEvaluate({ a: 10, b: 1 }),
      cost: () => 1,
    })
    expect(Object.fromEntries(levelsAfterPath(upgrades, path))).toEqual({ a: 5, b: 7 })
  })
})

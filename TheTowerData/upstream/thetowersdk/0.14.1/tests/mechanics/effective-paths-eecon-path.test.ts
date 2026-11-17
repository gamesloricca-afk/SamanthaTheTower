import { describe, expect, it } from 'vitest'
import { planEffectiveEconomyPath } from '../../src/mechanics/effective-paths/eecon-plan'
import { configFromSheet, levelsFromSheet } from './effective-paths-eecon-compute.test'
import fixture from '../../fixtures/mechanics/effective-paths-eecon-path.fixtures.json'

/**
 * The eEcon path itself, against the one the sheet plans.
 *
 * Every other econ test checks a value. This is the only one that checks the
 * *order*, which is the product: two models can agree on every number and still
 * rank the upgrades differently.
 */

interface SheetStep {
  step: number
  name: string
  level: number
  cost: number | null
  roi: number | null
  value: number
}

const sheet = fixture as unknown as {
  cells: Record<string, unknown>
  outputs: Record<string, number>
  steps: SheetStep[]
}

const plan = planEffectiveEconomyPath({
  config: configFromSheet(sheet.cells, sheet.outputs),
  levels: levelsFromSheet(sheet.cells),
  variant: 'time',
  steps: sheet.steps.length,
})

describe('the path the sheet plans', () => {
  it('starts where the sheet starts', () => {
    expect(sheet.steps.length).toBeGreaterThanOrEqual(25)
    const relative = Math.abs(plan.startingEffectiveEconomy - sheet.outputs.DS5)
      / sheet.outputs.DS5
    expect(relative).toBeLessThan(1e-9)
  })

  it('buys the same upgrades in the same order', () => {
    const mine = plan.steps.map(step => `${step.name} L${step.level}`)
    const theirs = sheet.steps.map(step => `${step.name} L${step.level}`)
    expect(mine).toEqual(theirs)
  })

  for (const [index, step] of sheet.steps.entries()) {
    it(`step ${step.step} — ${step.name} to level ${step.level}`, () => {
      const mine = plan.steps[index]
      expect(mine.name).toBe(step.name)
      expect(mine.level).toBe(step.level)
      const relative = Math.abs(mine.value - step.value) / step.value
      expect(relative, `${step.name}: got ${mine.value}, sheet says ${step.value}`)
        .toBeLessThan(1e-9)
    })
  }

  it('never goes backwards', () => {
    for (const [index, step] of plan.steps.entries()) {
      if (index === 0) continue
      expect(step.value, `step ${index + 1}`).toBeGreaterThanOrEqual(plan.steps[index - 1].value)
    }
  })
})

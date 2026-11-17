import { describe, expect, it } from 'vitest'
import { CALCULATOR_BUILDERS } from '../../src/builders'

describe('every builder answers fast enough to run on a keystroke', () => {
  /*
   * These are called from an input handler, so a slow one is felt as a laggy field rather
   * than seen as a wrong number. Enemy drops was 40ms a call: its lab lookups were a linear
   * scan of the whole catalog, repeated once per level across a sweep of 240 levels.
   *
   * The budget is deliberately loose — this is a guard against an order-of-magnitude
   * regression, not a benchmark.
   */
  const BUDGET_MS = 25

  it.each(CALCULATOR_BUILDERS.map(b => [b.id, b] as const))('%s', (_id, builder) => {
    builder.compute({} as never) // warm any one-time catalog resolution first
    const started = performance.now()
    for (let i = 0; i < 20; i += 1) builder.compute({} as never)
    const perCall = (performance.now() - started) / 20
    expect(perCall, `${perCall.toFixed(1)}ms per compute`).toBeLessThan(BUDGET_MS)
  })
})

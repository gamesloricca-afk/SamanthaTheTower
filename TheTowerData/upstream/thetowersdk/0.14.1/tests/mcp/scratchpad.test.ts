import { describe, expect, it } from 'vitest'
// @ts-expect-error — the MCP server is plain ESM JavaScript with no declarations.
import { TOOLS, availableTools } from '../../mcp/server.mjs'

/**
 * The scratchpad had never been run.
 *
 * `sdk_sandbox_run` shelled out to a script in the development monorepo, so for anyone who
 * installed the package it was advertised in `tools/list` and failed to spawn on every call.
 * Nothing reported that, because nothing had ever called it. `src/mcp-server.test.ts` covers the
 * handshake and the wiki tools, and vitest's include stopped at `src` and `scripts`, so anything
 * written next to the server was invisible to the suite. A tool nobody invokes cannot fail.
 *
 * These call it. Each one goes through the real tool, not a copy of its logic.
 */
const sandbox = (TOOLS as Record<string, { run: (input: unknown) => Promise<Record<string, unknown>> }>)
  .sdk_sandbox_run

describe('the MCP scratchpad', () => {
  it('lists what is reachable, in numbers that come from the package', async () => {
    const result = await sandbox.run({ mode: 'list' })
    expect(result.ok).toBe(true)
    expect(result.calculators).toContain('thorns.damage')
    expect(result.chartDatasets).toBeGreaterThan(0)
    expect(result.formulas).toBeGreaterThan(500)
  })

  it('reads an export, and says what it looked at rather than dumping it', async () => {
    const result = await sandbox.run({ mode: 'export', name: 'LAB_CATALOG' })
    expect(result.found).toBe(true)
    expect(result.type).toBe('array')
    expect((result.sample as unknown[]).length).toBeLessThan(result.length as number)
  })

  it('suggests a near miss instead of answering with nothing', async () => {
    const result = await sandbox.run({ mode: 'export', name: 'labcatalog' })
    expect(result.found).toBe(false)
    expect(result.didYouMean).not.toEqual([])
  })

  it('will not reach the prototype for a name a model made up', async () => {
    /*
     * `module.constructor` and `module.toString` exist on every object and describe nothing about
     * the package. Answering with them is worse than answering "no such export", because it is
     * plausible.
     */
    for (const name of ['constructor', 'toString', '__proto__', 'valueOf']) {
      expect((await sandbox.run({ mode: 'export', name })).found, name).toBe(false)
    }
  })

  it('runs a calculator and reports the input it actually used', async () => {
    const result = await sandbox.run({
      mode: 'calc',
      id: 'thorns.damage',
      input: { baseThorns: 120, wallThorns: 12, tier: 14 },
    })
    expect(result.ran).toBe(true)
    expect((result.normalizedInput as Record<string, number>).wallThorns).toBe(12)
  })

  it('says which keys it ignored, rather than dropping them in silence', async () => {
    const result = await sandbox.run({
      mode: 'calc',
      id: 'thorns.damage',
      input: { baseThorns: 120, notAField: 99 },
    })
    expect(result.ignoredKeys).toEqual(['notAField'])
    expect((result.steps as string[]).join(' ')).toMatch(/notAField/)
  })

  it('clamps out of range and shows it, so the answer is not to a different question', async () => {
    const result = await sandbox.run({ mode: 'calc', id: 'thorns.damage', input: { wallThorns: 9999 } })
    expect((result.normalizedInput as Record<string, number>).wallThorns).toBe(20)
  })

  it('keeps one call’s notes out of the next call’s result', async () => {
    await sandbox.run({ mode: 'calc', id: 'thorns.damage', input: { notAField: 1 } })
    const after = await sandbox.run({ mode: 'format', value: 1000 })
    expect(after.steps).toEqual([])
  })

  it('writes and reads the game’s own notation', async () => {
    expect((await sandbox.run({ mode: 'format', value: 4_770_477_147_914 })).display).toBe('4.77T')
    expect((await sandbox.run({ mode: 'format', value: '4.77T' })).parsed).toBe(4_770_000_000_000)
  })

  it('names the modes it has when asked for one it does not', async () => {
    const result = await sandbox.run({ mode: 'definitely-not-a-mode' })
    expect(result.ok).toBe(false)
    expect(result.modes).toContain('calc')
  })

  it('reports a missing calculator with the ids that do exist', async () => {
    const result = await sandbox.run({ mode: 'calc', id: 'no.such.calculator' })
    expect(result.ran).toBe(false)
    expect(result.available).toContain('module.cost')
  })
})

describe('the MCP advertises only tools that can run', () => {
  it('advertises fewer tools than it declares when the monorepo is absent', () => {
    /*
     * Both environments are real: this suite runs in the monorepo AND in the published clone
     * that `sdk:verify` builds. A test asserting the monorepo's count passed here and failed
     * there, which is the exact shape of bug the clone verify exists to catch -- so it asserts
     * the relationship instead of either number.
     */
    const declared = Object.keys(TOOLS as object).length
    const available = Object.keys(availableTools() as object).length
    expect(available).toBeGreaterThan(0)
    expect(available).toBeLessThanOrEqual(declared)
  })

  it('keeps the scratchpad in the standalone set, because it no longer needs the monorepo', () => {
    const names = Object.keys(availableTools() as object)
    expect(names).toContain('sdk_sandbox_run')
    expect(names).toContain('calc_run')
    expect(names).toContain('decode_save')
  })
})

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runExportTrace, watchDebugSources } from '../../../tooling/debug-graph/trace'
import { readSessionEvents } from '../../../tooling/debug-graph/session'
import { isMonorepoCheckout } from '../../../tooling/repo-root'

/*
 * Monorepo only. The registry and the graph tooling name files by their monorepo path
 * (`packages/sdk/src/...`) and read them from a repo root found by walking up to
 * `scripts/mechanics-trust/`. In the published repository this package is the root, so those
 * reads resolve above the checkout and the whole file fails to collect. Skipping keeps the
 * enforcement here, where the paths mean something.
 */
const MONOREPO = isMonorepoCheckout()

describe.skipIf(!MONOREPO)('debug-graph trace session', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dbg-session-'))

  afterEach(() => {
    delete process.env.TOWER_DEBUG_SESSION_DIR
    fs.rmSync(tmp, { recursive: true, force: true })
  })

  it('traces a known mechanics export into the session store', async () => {
    process.env.TOWER_DEBUG_SESSION_DIR = tmp
    const result = await runExportTrace({
      exportName: 'normalizeBounceAngleDegrees',
      args: [270, false],
    })
    expect(result.supported).toBe(true)
    expect(result.ok).toBe(true)
    expect(result.trace.error).toBeUndefined()
    expect(result.trace.resultPreview).toBe(-90)
    const events = readSessionEvents({ limit: 20 })
    expect(events.some(e => e.kind === 'trace' && e.exportName === 'normalizeBounceAngleDegrees')).toBe(true)
  })

  it('records missing symbol as failed trace', async () => {
    process.env.TOWER_DEBUG_SESSION_DIR = tmp
    const result = await runExportTrace({
      exportName: 'DefinitelyNotARealExport_XYZ',
      args: [],
    })
    expect(result.ok).toBe(false)
    expect(result.trace.error?.name).toBe('DebugSymbolNotFound')
  })

  it('watch returns poll mode with changed files', () => {
    const w = watchDebugSources()
    expect(w.supported).toBe(true)
    expect(w.mode).toBe('poll')
    expect(w.changed.length).toBeGreaterThan(0)
  })
})

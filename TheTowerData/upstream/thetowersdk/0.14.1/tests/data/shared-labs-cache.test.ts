import { describe, expect, it } from 'vitest'
import { findToolLabBySlug, getSharedToolLabs, LAB_CATALOG } from '../../src/data'

describe('the shared lab catalog is built once', () => {
  it('hands back the same list every time', () => {
    // Identity, not deep equality: a fresh-but-equal array would still be a rebuild.
    expect(getSharedToolLabs()).toBe(getSharedToolLabs())
  })

  it('is complete — caching must not have trimmed it', () => {
    const labs = getSharedToolLabs()
    expect(labs.length).toBe(LAB_CATALOG.length)
    expect(labs.length).toBeGreaterThan(200)
    expect(new Set(labs.map(l => l.name)).size).toBe(labs.length)
  })

  it('refuses mutation, because every caller shares this array', () => {
    /*
     * The reason this is frozen rather than copied: one caller sorting or truncating it
     * would silently reorder the catalog for every other caller in the process, and
     * nothing would report it. Freezing turns that into an error at the point of misuse.
     */
    expect(() => (getSharedToolLabs() as unknown[]).push({} as never)).toThrow()
    expect(() => (getSharedToolLabs() as unknown[]).sort()).toThrow()
    expect(getSharedToolLabs().length).toBe(LAB_CATALOG.length)
  })

  it('still resolves a lab by slug after caching', () => {
    // Caching a lookup table is exactly how a lookup starts returning stale or empty
    // results, so the thing the cache exists to serve is checked directly.
    const lab = findToolLabBySlug('range')
    expect(lab, 'the range lab should resolve').toBeTruthy()
    expect(lab?.levels?.length ?? 0).toBeGreaterThan(0)
  })

  it('answers fast enough to sit inside a per-level loop', () => {
    getSharedToolLabs()
    const started = performance.now()
    for (let i = 0; i < 1000; i += 1) getSharedToolLabs()
    const elapsed = performance.now() - started
    // Rebuilding 225 records per call took ~500ms for this loop.
    expect(elapsed, `${elapsed.toFixed(1)}ms for 1000 calls`).toBeLessThan(50)
  })
})

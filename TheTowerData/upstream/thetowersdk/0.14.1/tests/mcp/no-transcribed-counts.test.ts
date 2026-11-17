import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { MONOREPO_ROOT } from '../helpers/paths'

/**
 * A tool must not carry a count it cannot keep current.
 *
 * `sheet_info` warned "23 of the 30 tabs are HIDDEN. The tab list marks none of them." Both numbers
 * were wrong. Against the canonical spreadsheet it is 24 of 30; against the working copy the oracle
 * actually points at, 24 of 33.
 *
 * The number was not merely stale — it was impossible. `SHEET_ID` is `process.env.EPATHS_SHEET_ID
 * || CANONICAL_SHEET_ID`, so the tool describes whichever spreadsheet the environment names, and no
 * single transcribed count can be right for all of them.
 *
 * And the data was already in hand: `properties.hidden` comes back in the same
 * `spreadsheets.get` response the tool was already making, and was being dropped on the floor while
 * prose beside it guessed at what it said. Supported by the model, never set by the wiring, nothing
 * reports it — the shape this codebase produces more than any other.
 *
 * The live numbers cannot be asserted here (that needs the service account), so this holds the
 * durable half: the response derives its counts, and the prose does not restate them.
 */

const ORACLE_SERVER = path.resolve(
  MONOREPO_ROOT, 'tools', 'effective-paths-oracle', 'server.mjs',
)

describe.skipIf(!existsSync(ORACLE_SERVER))('sheet_info counts what it is looking at', () => {
  const source = () => readFileSync(ORACLE_SERVER, 'utf8')

  it('reads the hidden flag the API already returns', () => {
    const text = source()

    expect(text, 'the hidden flag was in the response and was being discarded')
      .toMatch(/properties\.hidden/)
    expect(text, 'hidden tabs should be named, not counted in prose').toMatch(/hiddenTabs/)
  })

  it('derives its tab counts rather than naming them', () => {
    const text = source()

    /*
     * The trap block is prose, and prose is where a number goes to rot. Anything of the form
     * "N tabs" inside it is a transcription of something the API can answer.
     */
    const traps = /traps:\s*\[([\s\S]*?)\n\s*\],/.exec(text)?.[1] ?? ''
    expect(traps.length, 'could not find the traps block to check').toBeGreaterThan(100)

    const transcribed = [...traps.matchAll(/\b\d+\s+(?:of\s+the\s+\d+\s+)?tabs?\b/gi)]
      .map(match => match[0])

    expect(transcribed, 'a tab count written into prose cannot stay true across spreadsheets')
      .toEqual([])
  })

  it('still warns that hidden tabs are indistinguishable', () => {
    /*
     * Removing the number must not remove the warning. The actionable part — a hidden tab reads
     * exactly like a visible one — is why the trap existed, and it is still true.
     */
    const traps = /traps:\s*\[([\s\S]*?)\n\s*\],/.exec(source())?.[1] ?? ''
    expect(traps.toUpperCase()).toContain('HIDDEN')
  })
})

import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { PACKAGE_ROOT } from '../helpers/paths'

/**
 * Checks on the checks.
 *
 * Every guard in this package was written because something went wrong once, and each one is only
 * worth its lines while it actually runs over the thing it describes. Three failed that in one
 * session, all silently:
 *
 * - `audit-package-contents` asserts the tarball's real contents and was named in the publish
 *   documentation. No script and no workflow ran it. It found two test files shipping the moment
 *   it was wired in.
 * - A source guard walked `.ts` and `.mjs`, so a JSON file kept three citations naming a
 *   symbol and an address, and the guard that runs it in `--check` mode passed throughout — it
 *   never opened the file.
 * - Vitest's `include` stopped at `src` and `scripts`, so tests written next to the MCP server
 *   were collected by nothing.
 *
 * A guard that cannot run, or cannot see, is indistinguishable from a guard with nothing to
 * report. These tests are the ones that notice.
 */
const PACKAGE = PACKAGE_ROOT

const manifest = JSON.parse(readFileSync(path.join(PACKAGE, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

/** Every npm script `verify` reaches, directly or through another script. */
function reachedByVerify(): Set<string> {
  const verifySource = readFileSync(path.join(PACKAGE, 'scripts/verify.mjs'), 'utf8')
  const named = [...verifySource.matchAll(/'([a-z:-]+)'/g)]
    .map(match => match[1]!)
    .filter(name => manifest.scripts[name] !== undefined)

  const reached = new Set<string>(['build', ...named])
  for (let pass = 0; pass < 10; pass += 1) {
    for (const name of [...reached]) {
      const body = manifest.scripts[name] ?? ''
      for (const other of Object.keys(manifest.scripts)) {
        if (!reached.has(other) && new RegExp(`npm run ${other}(?![\\w:-])`).test(body)) {
          reached.add(other)
        }
      }
    }
  }
  return reached
}

describe('every guard actually runs', () => {
  /**
   * Scripts that can fail a build. Anything that calls `process.exit(1)` is asserting something,
   * and an assertion nobody triggers is a comment.
   */
  const guards = walk(path.join(PACKAGE, 'scripts'))
    .filter(file => /\.(mjs|ts)$/.test(file) && !/\.test\./.test(file))
    .filter(file => /process\.exit\(1\)|process\.exitCode\s*=\s*1/.test(readFileSync(file, 'utf8')))
    .map(file => path.basename(file))

  it('finds the guards at all', () => {
    /* If this collapses to nothing the checks below pass vacuously, which is the failure mode. */
    expect(guards.length).toBeGreaterThan(8)
  })

  it('names every guard in an npm script', () => {
    const commands = Object.values(manifest.scripts).join(' ')
    const orphaned = guards.filter(name => !commands.includes(name))

    expect(
      orphaned,
      'These can fail a build and nothing invokes them. `audit-package-contents` sat like this '
      + 'while being documented as the check that keeps the site out of the package.',
    ).toEqual([])
  })

  it('runs the release-blocking guards as part of verify', () => {
    /*
     * Not every guard belongs in `verify` — the wiki publisher and the patch-note ingester exit 1
     * too, and they are jobs rather than checks. These are the ones whose failure means the
     * package is wrong, so they have to run before it ships.
     */
    const mustRun = [
      'audit-package-contents.mjs',
      'audit-published-surface.mjs',
      'check-conventions.mjs',
      'check-readme-links.mjs',
    ]
    const reached = reachedByVerify()
    const commandsReached = [...reached].map(name => manifest.scripts[name] ?? '').join(' ')

    const missing = mustRun.filter(file => !commandsReached.includes(file))
    expect(missing, 'reachable from an npm script, but not from `verify`').toEqual([])
  })
})

describe('every test is collected', () => {
  it('covers each directory that contains tests', () => {
    /*
     * The MCP server's tests existed and ran nowhere for as long as they existed, because the
     * include list named `src` and `scripts` and the tests were beside the server.
     */
    const config = readFileSync(path.join(PACKAGE, 'vitest.config.ts'), 'utf8')
    const include = [...config.matchAll(/'([\w*/.-]+\*\.test\.[a-z]+)'/g)].map(match => match[1]!)
    const covered = new Set(include.map(pattern => pattern.split('/')[0]))

    const withTests = new Set(
      ['src', 'scripts', 'mcp', 'wasm', 'examples', 'templates']
        .filter((dir) => {
          try {
            return walk(path.join(PACKAGE, dir)).some(file => /\.test\.(ts|mjs)$/.test(file))
          } catch {
            return false
          }
        }),
    )

    const uncollected = [...withTests].filter(dir => !covered.has(dir))
    expect(
      uncollected,
      'These directories hold tests that vitest never collects, so they pass by not running.',
    ).toEqual([])
  })
})

describe('the source boundary guard runs in verification', () => {
  it('is reached by verify', () => {
    expect(reachedByVerify().has('lint:boundaries')).toBe(true)
  })
})

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Every published entry point resolves to its own types.
 *
 * ## The failure this catches
 *
 * `typesVersions` ends with a catch-all — `"*": ["dist/index.d.ts"]` — so a
 * subpath listed in `exports` but missing from `typesVersions` does not fail to
 * resolve. It resolves to the **root barrel**, which is a different module that
 * happens to exist. Consumers on `moduleResolution: "node"` then get
 * "has no exported member" for every symbol in the entry they imported, which
 * reads as a broken package rather than a missing line of config.
 *
 * That is exactly how `thetowersdk/wiki` shipped: the tests passed, the site
 * built, and the one consumer compiling against `dist` rather than source broke
 * in CI. Adding an entry point is four separate lists, and this holds two of
 * them to each other.
 */

const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
) as {
  exports: Record<string, unknown>
  typesVersions: Record<string, Record<string, string[]>>
}

/**
 * `"./wiki"` → `"wiki"`.
 *
 * Excludes the root entry, wildcards, and plain files: `./package.json` is
 * exported so consumers can read it, and a file has no types folder to point
 * at, so holding it to this rule would only teach the next person to loosen it.
 */
function subpathsOf(exports: Record<string, unknown>): string[] {
  return Object.keys(exports)
    .filter(key => key !== '.' && !key.includes('*') && !/\.\w+$/.test(key))
    .map(key => key.replace(/^\.\//, ''))
}

describe('published entry points', () => {
  const subpaths = subpathsOf(packageJson.exports)
  const types = packageJson.typesVersions['*'] ?? {}

  it('has entry points to check', () => {
    // Guard the guard: a selector that silently matched nothing would make
    // every assertion below vacuous.
    expect(subpaths.length).toBeGreaterThan(3)
  })

  it.each(subpaths)('%s has its own typesVersions entry', subpath => {
    expect(
      Object.keys(types),
      `"${subpath}" is in exports but not typesVersions, so it falls through `
      + 'the "*" catch-all to the root barrel and reports every symbol missing',
    ).toContain(subpath)
  })

  it.each(subpaths)('%s points its types at its own folder', subpath => {
    expect(types[subpath]?.[0]).toBe(`dist/${subpath}/index.d.ts`)
  })
})

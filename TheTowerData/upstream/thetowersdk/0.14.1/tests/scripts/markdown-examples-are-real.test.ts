import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { DOCS, PACKAGE_ROOT } from '../helpers/paths'

/**
 * Every symbol a markdown file tells you to import has to exist.
 *
 * `site-examples-are-real.test.ts` does this for the documentation site, and it works: a drafted
 * example calling `runCalculator` was caught before anyone saw it. Markdown had no equivalent, and
 * it had drifted further than the site ever did — four imports naming three functions that exist
 * nowhere in the package:
 *
 * - `loadPlayerInfoSaveRoot`, in two files, for what is called `decodePlayerInfoSaveBytes`. The
 *   sample around it also treated the return value as the save root, when the root arrives under
 *   `.parsedRoot`. Copying it produced two errors from one line.
 * - `extractBotsFromSaveRoot`, for `readBotsFromSaveRoot`.
 * - `discoverSaveImportTrackers` and its `.trackers` field, for `discoverSaveImportTargets` and
 *   `.targets` — a rename that reached the code and stopped at the README.
 *
 * README is the first page anyone reads and the most likely thing to be pasted straight into an
 * editor, which makes it the worst place in the repository for an import that cannot resolve.
 *
 * ## Against `dist`, not the source tree
 *
 * The site checks its INSTALLED copy because it pins a published version and would 500 on a symbol
 * that version lacks. Markdown ships in the repository beside the code, so it describes this
 * working tree, and `dist` is what this working tree exports. Renaming an export is then supposed
 * to fail here immediately — that is the whole point.
 */

const DIST = path.join(PACKAGE_ROOT, 'dist')
const require = createRequire(path.join(PACKAGE_ROOT, 'package.json'))

/** Entry point → the symbols it exports, read from the build. */
function exportsOf(subpath: string): Set<string> | null {
  const entry = path.join(DIST, subpath === '.' ? 'index.js' : `${subpath}/index.js`)
  if (!existsSync(entry)) return null
  try {
    return new Set(Object.keys(require(entry) as Record<string, unknown>))
  } catch {
    return null
  }
}

function markdownFiles(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules') continue
      const full = path.join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (full.endsWith('.md')) out.push(full)
    }
  }
  walk(DOCS)
  for (const file of ['README.md', 'AGENTS.md']) {
    const full = path.join(PACKAGE_ROOT, file)
    if (existsSync(full)) out.push(full)
  }
  return out
}

const NAMED_IMPORT = /import\s*\{([^}]+)\}\s*from\s*'thetowersdk(?:\/([\w/-]+))?'/g

/**
 * `import { … } from 'thetowersdk'` elides a list rather than naming one.
 *
 * A sample that writes the ellipsis is saying "and the rest"; reading it as an identifier reported
 * the README importing a symbol called `…`, which no rename will ever fix.
 */
const IS_AN_ELISION = /^(?:…|\.\.\.)$/

describe('every markdown example imports something real', () => {
  const files = markdownFiles()

  it('has a build to check against, so a missing dist cannot pass it', () => {
    expect(existsSync(DIST), 'run `npm run build` first — this check needs dist').toBe(true)
    expect(files.length).toBeGreaterThan(4)
  })

  it('names no export the package does not have', () => {
    const wrong: string[] = []

    for (const file of files) {
      const rel = path.relative(PACKAGE_ROOT, file).split(path.sep).join('/')
      for (const match of readFileSync(file, 'utf8').matchAll(NAMED_IMPORT)) {
        const subpath = match[2] ?? '.'
        const available = exportsOf(subpath)
        if (!available) {
          wrong.push(`${rel}: thetowersdk/${subpath} is not an entry point`)
          continue
        }
        for (const raw of match[1].split(',')) {
          const symbol = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim()
          if (!symbol || IS_AN_ELISION.test(symbol)) continue
          if (!available.has(symbol)) {
            wrong.push(`${rel}: ${symbol} is not exported by thetowersdk/${subpath}`)
          }
        }
      }
    }

    expect(
      [...new Set(wrong)].sort(),
      'a markdown sample imports something that does not exist — fix the sample, or the rename that left it behind',
    ).toEqual([])
  })
})

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { DOCS, MCP, PACKAGE_ROOT, SRC } from '../helpers/paths'

/**
 * Nothing that ships may describe the site this package was extracted from.
 *
 * The package is MIT and general-purpose. It was pulled out of a private web app, and the extraction
 * left that app's vocabulary behind everywhere — around ninety references to "the tracker" in `src`
 * alone, and they were not only comments:
 *
 * - `title: 'Whether a name is a research lab the tracker knows'` and four other `because:` strings
 *   shipped in the calculator registry, where they are part of the public API.
 * - `BOT_RANGE_BUG`, an exported constant recording a bug in that app, imported by nothing.
 * - `lab.trackerMaxLevel`, a calculator id.
 * - Exported types `TrackerCanonicalRunData` and `TrackerRunBattleReportField`.
 *
 * To a reader who has never seen that app, "the tracker" names nothing. The sentence still parses,
 * so it reads as a term of art they are expected to know, which is worse than an obvious gap.
 *
 * `scripts/` is deliberately not covered. Those are the maintainer's own tools, they do not ship,
 * and some of them genuinely operate on that app — `check-acronym-expansions.ts` scans it, and
 * forbidding the word there would break a check that is doing its job.
 */

/**
 * The word, wherever it is not something else.
 *
 * `objectTracker` is NRBF's own term inside the save decoder, and `stat tracker` appears verbatim in
 * the game's patch notes, which are transcribed and must stay that way. Neither is a reference to
 * anybody's website.
 */
const SITE_WORD = /\btrackers?\b/i
const NOT_THE_SITE = [
  /objectTracker/,
  /\.generated\.ts$/,

  /*
   * `tracker-bridge` is the real, published name of the package `adb-bridge` replaced. Both
   * mentions are history a reader needs — one explains the rename, the other explains why version
   * numbers cannot gate compatibility across it, since `tracker-bridge` was on 1.x and `adb-bridge`
   * restarted at 0.x. Suppressing the old name would delete the reason.
   */
  /`tracker-bridge`/,

  /*
   * One attribution link, in the credits. Naming a project that uses this package is the opposite
   * of the problem here: it is a citation the reader can follow, not vocabulary they are assumed to
   * already share.
   */
  /the-tower-run-tracker\.com/,

  /*
   * The document that bans the word has to be able to write it.
   *
   * `ORGANIZATION_CONTRACT.md` states Rule 4 and lists the shapes application state took here,
   * both of which quote the vocabulary they forbid. Flagging it made this guard fail on the rule
   * it enforces — a check whose only finding is its own specification is a check nobody keeps.
   */
  /ORGANIZATION_CONTRACT\.md$/,

  /* The same, where AGENTS.md states rule zero. */
  /never the word/,
]

const ROOTS = [SRC, MCP, DOCS]
const FILES_AT_ROOT = ['README.md', 'AGENTS.md', 'CONTRIBUTING.md']
const EXTENSIONS = /\.(ts|tsx|mjs|js|json|md)$/

function shippedFiles(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules') continue
      const full = path.join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (EXTENSIONS.test(full)) out.push(full)
    }
  }
  for (const root of ROOTS) walk(root)
  for (const file of FILES_AT_ROOT) {
    const full = path.join(PACKAGE_ROOT, file)
    if (existsSync(full)) out.push(full)
  }
  return out
}

describe('the shipped package never names the site it came from', () => {
  const files = shippedFiles()

  it('is reading the shipped tree, so an empty sweep cannot pass', () => {
    expect(files.length).toBeGreaterThan(200)
    expect(files.some(file => file.startsWith(SRC))).toBe(true)
  })

  it('says nothing about a tracker', () => {
    const offenders: string[] = []

    for (const file of files) {
      if (NOT_THE_SITE.some(pattern => pattern.test(file))) continue
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, index) => {
        if (!SITE_WORD.test(line)) return
        if (NOT_THE_SITE.some(pattern => pattern.test(line))) return
        const rel = path.relative(PACKAGE_ROOT, file).split(path.sep).join('/')
        offenders.push(`${rel}:${index + 1}: ${line.trim().slice(0, 100)}`)
      })
    }

    expect(
      offenders,
      'say what the thing is for, not which app used to use it',
    ).toEqual([])
  })
})

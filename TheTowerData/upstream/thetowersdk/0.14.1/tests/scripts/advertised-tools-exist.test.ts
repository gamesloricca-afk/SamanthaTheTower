import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { IN_MONOREPO, everyTool } from '../helpers/every-tool'
import { DOCS, PACKAGE_ROOT, SITE } from '../helpers/paths'

/**
 * A tool named in the docs has to be a tool.
 *
 * The site's MCP page advertised `sdk_doctor_check`, `_prescribe`, `_repair`, `_validate` and
 * `_autofix` — five tools, described in detail, for weeks after they were deleted. Nothing noticed,
 * because nothing compares the prose to the registry: the page is Svelte, the tools are a JavaScript
 * object, and no build step reads one against the other.
 *
 * That is the worst kind of stale documentation. A reader registers the server, finds the tool
 * missing, and has no way to tell whether they set it up wrong or the page is lying.
 *
 * The direction only goes one way. A tool that exists and is not documented is a gap; a tool that is
 * documented and does not exist is a false claim, and only the second is checked here.
 *
 * The registry comes from `everyTool()` and not from a spread of the two registries in
 * `server.mjs`, because the first draft of this file did exactly that and immediately accused the
 * docs of inventing `eval_formula`, `read_range`, `sheet_info` and `list_lambdas` — four tools that
 * exist, in the third registry it had not loaded. A guard with the same blind spot as the bug is the
 * defect `an-audit-covers-every-registry.test.ts` was written about, and it caught this one too.
 */

const REAL: ReadonlySet<string> = new Set(Object.keys(everyTool()))

/**
 * Tool-shaped names, by the prefixes this package actually uses.
 *
 * Matching "any snake_case word" would drag in every field name in every code sample. These are the
 * families the registry names, plus the handful of bare names that do not share a prefix.
 */
const TOOL_NAME = new RegExp(
  String.raw`\b(?:sdk|oracle|calc|wiki|trust|ep_graph)_[a-z_]+`
  + String.raw`|\b(?:mcp_contract|decode_save|define_term|get_export|list_exports|run_extractor|describe_schema|eval_formula|sheet_info|read_range|input_ranges|list_lambdas|mirror_map|read_ids)\b`,
  'g',
)

/**
 * Names written as a family rather than as a call.
 *
 * `sdk_graph_*` and `sdk_debug_*` are how the docs refer to a group, and a trailing `*` or `_` is
 * the mark of that. Treating them as calls reported `sdk_graph_` — a tool nobody claimed exists.
 */
const IS_A_FAMILY = /_$|_\*$/

function docFiles(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === '.svelte-kit' || entry === 'build') continue
      const full = path.join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.(svelte|ts|md)$/.test(full)) out.push(full)
    }
  }
  walk(path.join(SITE, 'src'))
  walk(DOCS)
  for (const file of ['README.md', 'AGENTS.md']) {
    const full = path.join(PACKAGE_ROOT, file)
    if (existsSync(full)) out.push(full)
  }
  return out
}

describe('every tool the docs advertise exists', () => {
  const files = docFiles()

  it('found docs to read, so an empty sweep cannot pass', () => {
    expect(files.length).toBeGreaterThan(20)
    expect(REAL.size).toBeGreaterThan(20)
  })

  /*
   * Only where every registry is present. A published clone has no Effective Paths server, so its
   * fifteen tools would all read as invented — a failure about a checkout that was never meant to
   * have them, not about the docs.
   */
  it.skipIf(!IN_MONOREPO)('names no tool the server does not register', () => {
    const ghosts: string[] = []

    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(TOOL_NAME)) {
        const name = match[0]
        if (REAL.has(name) || IS_A_FAMILY.test(name)) continue
        /* A family written as `sdk_graph_*` matches without its star; check the character after. */
        const after = text[(match.index ?? 0) + name.length]
        if (after === '*') continue
        ghosts.push(`${path.relative(PACKAGE_ROOT, file).split(path.sep).join('/')}: ${name}`)
      }
    }

    expect(
      [...new Set(ghosts)],
      'the docs describe a tool that is not in the registry — delete the claim or ship the tool',
    ).toEqual([])
  })
})

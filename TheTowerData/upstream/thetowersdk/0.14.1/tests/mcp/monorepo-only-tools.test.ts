import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — the MCP server is plain ESM JavaScript with no declarations.
import { TOOLS, availableTools } from '../../mcp/server.mjs'
import { MCP } from '../helpers/paths'

/**
 * A tool that reaches the development monorepo must not be advertised where that monorepo is not.
 *
 * The list of such tools was first written by reading each tool's own body for `MONOREPO_ROOT`,
 * and it missed six. The graph and trust tools call `runSdkGraphCli`, which reaches the monorepo
 * on their behalf — so they read as self-contained and were offered to every package user, each
 * one failing to spawn a script that is not there.
 *
 * This derives the answer transitively instead: a helper that reaches the monorepo taints every
 * helper that calls it, and every tool that calls any of them. The next one shaped like that
 * fails here rather than in someone's editor.
 */
const HERE = MCP
const SOURCE = readFileSync(path.join(HERE, 'server.mjs'), 'utf8')

/**
 * Tools that name the monorepo and work without it anyway.
 *
 * Each one branches: it uses the richer monorepo path when that exists and a self-contained path
 * when it does not. They are listed because the derivation cannot see the difference between a
 * call and a guarded call — and an allowlist of three, each justified, is honest where a silent
 * exception would not be.
 */
const HAS_A_FALLBACK = new Set([
  // Falls back to the title as written when the canonicaliser is absent.
  'wiki_page',
  // Falls back to the scratchpad built from what the package ships.
  'sdk_sandbox_run',
  // `resolveMechanicsMapDir` takes an env override, then candidate paths, then creates one.
  'begin_mechanic_task',
])

const REACHES_MONOREPO = /MONOREPO_ROOT|runRepoTsx/

function bodyOf(source: string, openBraceAt: number): string {
  let index = openBraceAt
  let depth = 0
  do {
    if (source[index] === '{') depth += 1
    else if (source[index] === '}') depth -= 1
    index += 1
  } while (depth > 0 && index < source.length)
  return source.slice(openBraceAt, index)
}

/** Helpers that reach the monorepo, directly or through another helper. */
function taintedHelpers(): Set<string> {
  const bodies = new Map<string, string>()
  for (const match of SOURCE.matchAll(/^(?:async )?function ([A-Za-z_]\w*)\s*\(/gm)) {
    bodies.set(match[1]!, bodyOf(SOURCE, SOURCE.indexOf('{', match.index!)))
  }

  const tainted = new Set<string>()
  /* Repeated until it stops growing: a call chain can be several helpers deep. */
  for (let pass = 0; pass < bodies.size + 1; pass += 1) {
    const before = tainted.size
    for (const [name, body] of bodies) {
      if (tainted.has(name)) continue
      const callsTainted = [...tainted].some(helper => body.includes(`${helper}(`))
      if (REACHES_MONOREPO.test(body) || callsTainted) tainted.add(name)
    }
    if (tainted.size === before) break
  }
  return tainted
}

function toolsNeedingTheMonorepo(): string[] {
  const tainted = taintedHelpers()
  const found: string[] = []

  for (const block of SOURCE.slice(SOURCE.indexOf('export const TOOLS')).split(/\n {2}(?=[a-z_]+: \{\n)/)) {
    const match = /^\s*([a-z_]+): \{/.exec(block)
    if (!match) continue
    const body = block.slice(0, block.indexOf('\n  },'))
    const callsTainted = [...tainted].some(helper => body.includes(`${helper}(`))
    if (REACHES_MONOREPO.test(body) || callsTainted) found.push(match[1]!)
  }
  return found
}

describe('the MCP advertises only what it can run', () => {
  const declared = new Set(Object.keys(TOOLS as object))
  const advertisedStandalone = new Set(Object.keys(availableTools() as object))

  it('hides every tool that reaches the monorepo, unless it has a fallback', () => {
    const needsIt = toolsNeedingTheMonorepo().filter(name => !HAS_A_FALLBACK.has(name))

    /*
     * `availableTools()` returns everything here, because these tests run IN the monorepo. What is
     * checked is the set it filters by, read from the module rather than re-listed.
     */
    const hidden = needsIt.filter(name => !MONOREPO_ONLY.has(name))
    expect(
      hidden,
      'These reach the monorepo and are still advertised to package users, where they cannot run.',
    ).toEqual([])
  })

  it('does not hide a tool that works without the monorepo', () => {
    const needsIt = new Set(toolsNeedingTheMonorepo())
    const overreach = [...MONOREPO_ONLY].filter(name => !needsIt.has(name))

    expect(
      overreach,
      'Hidden from package users without needing to be — that is a capability withheld for nothing.',
    ).toEqual([])
  })

  it('names only tools that exist', () => {
    const unknown = [...MONOREPO_ONLY].filter(name => !declared.has(name))
    expect(unknown, 'the hidden list names tools the server does not have').toEqual([])
  })

  it('keeps the tools with a fallback advertised', () => {
    for (const name of HAS_A_FALLBACK) {
      expect(advertisedStandalone.has(name), name).toBe(true)
    }
  })
})

/** Read from the server rather than restated, so the test cannot agree with a stale copy. */
const MONOREPO_ONLY = new Set(
  [...SOURCE.slice(SOURCE.indexOf('const MONOREPO_ONLY_TOOLS'))
    .slice(0, SOURCE.slice(SOURCE.indexOf('const MONOREPO_ONLY_TOOLS')).indexOf('])'))
    .matchAll(/'([a-z_]+)'/g)].map(match => match[1]!),
)

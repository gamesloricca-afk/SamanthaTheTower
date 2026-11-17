import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { CALCULATOR_BUILDERS } from '../../src/builders'
import { GLOSSARY } from '../../src/data/glossary/terms'
import {
  CARD_TEMPLATES,
  LAB_CATALOG,
  MODULE_TEMPLATES,
  uwStoneChartData,
  WSP_WORKSHOP_COST_LEVELS,
} from '../../src/data'

/**
 * Game names that reach a person must exist in a catalog.
 *
 * This repo's own rule is "never write a game name from memory", and the reason is that a
 * wrong one does not fail — it renders. Two shipped in code written for this package:
 * a builder labelled `Defence Absolute` where the game says `Defense Absolute`, and a module
 * called `Omni Amplifier`, which is not a thing (OA is Orbital Augment). Neither was caught
 * by a compiler, a linter, a reviewer or a spellchecker; `Defence` is correct English.
 *
 * ## What is checked, and what is not
 *
 * **Text a person sees**: builder field labels and help, and the prose in `docs/`, the
 * README, examples and templates. Those are where a name is an assertion about the game.
 *
 * Not every comment in `src`. An earlier version of this swept everything and produced 833
 * candidates — mostly ordinary English in quotes. A check nobody can read is a check nobody
 * runs, and the noise would have buried the two real ones.
 */

function buildAuthority(): ReadonlySet<string> {
  const known = new Set<string>()
  const add = (value: unknown) => {
    if (typeof value !== 'string' || !value.trim()) return
    known.add(value.trim().toLowerCase())

    /*
     * Split compound entries. The glossary stores some names as `A/B` — `Coin Bot/Coin Bonus`
     * is one entry covering two real terms — so an exact-match set does not know `Coin Bonus`
     * and reports a correct name as invented. The first version of this check did exactly
     * that, and the right fix was the authority rather than the prose.
     */
    for (const part of value.split('/')) {
      const trimmed = part.trim().toLowerCase()
      if (trimmed) known.add(trimmed)
    }

    /*
     * And the ` - ` compounds. The catalog carries `Dissonant Echo - Utility`, `- Attack`
     * and so on, but never a bare `Dissonant Echo` — so the lab everyone refers to by its
     * short name was reported as invented. Same failure as the `/` case: the authority was
     * narrower than the language people actually write.
     */
    const dashed = value.split(' - ')[0]?.trim().toLowerCase()
    if (dashed) known.add(dashed)
  }

  for (const entry of GLOSSARY) {
    add(entry.term)
    add((entry as { expansion?: string }).expansion)
  }
  for (const module of MODULE_TEMPLATES) {
    add(module.name)
    add(module.id)
    add(module.initials)
  }
  for (const card of CARD_TEMPLATES) {
    add(card.name)
    add(card.id)
  }
  for (const lab of LAB_CATALOG) {
    add(lab.name)
    add((lab as { displayName?: string }).displayName)
  }
  for (const key of Object.keys(WSP_WORKSHOP_COST_LEVELS)) add(key)

  const weapons = uwStoneChartData as Record<string, { name?: string, stats?: { name: string }[] }>
  for (const [key, weapon] of Object.entries(weapons)) {
    add(key)
    add(weapon?.name)
    for (const stat of weapon?.stats ?? []) add(stat.name)
  }
  return known
}

const AUTHORITY = buildAuthority()

/**
 * Title-Case phrases that are ordinary English rather than game entities.
 *
 * Every entry is a place this check is deliberately blind, so the list stays short and each
 * one is a phrase that could not be mistaken for a module, card, lab, stat or weapon.
 */
const NOT_GAME_TERMS = new Set([
  'the tower', 'effective paths', 'run tracker', 'tower run', 'idle tower', 'tower assets',
  'google sheets', 'private network', 'personal access', 'node options', 'discord bot',
  'my notes', 'has space', 'not found', 'total coin cost', 'player data', 'service account',
  'charged mines', 'chrono jump', 'maxed level', 'target level', 'current level',
  /*
   * Control labels that describe a game thing without naming one the catalogs enumerate.
   *
   * `Coins / Kill Workshop Level` asks which workshop level feeds the Coins / Kill stat; the
   * slash ends the capitalised run, so the phrase reaching this check is the tail of a label
   * rather than anything anyone would call a name.
   */
  'kill workshop level', 'kill lab level', 'coin bonus enhancement level',
  'primary coin substat', 'assist coin substat', 'coin perk taken',
  'coin trade-off perk taken', 'vault coin bonus',
  'base thorns', 'coin discount', 'shard discount', 'workshop discount', 'vault discount',
  'defense reduction', 'orb damage reduction', 'starting damage', 'enable flamebot',
  'dissonance type', 'personal best wave', 'tier played', 'module rarity', 'select lab',
  'mine age', 'reduction lab level', 'tournament run', 'ultimate weapon', 'workshop upgrade',
])

/*
 * Hyphens are part of a name. Without allowing them this captures `Improve Trade` out of
 * `Improve Trade-off Perks` and reports the fragment as invented — the name is real and the
 * tokenizer was the thing that was wrong.
 */
const CANDIDATE = /[`'"]([A-Z][a-z-]+(?: [A-Z][a-z-]+){1,3})[`'"]/g

/*
 * Words a control is made of, not words the game names anything with.
 *
 * A label reads `Coins / Kill Workshop Level`, and the game term inside it is `Coins / Kill` --
 * `Workshop Level` is the form asking which level. Checking the whole capitalised run reported
 * 54 such labels as invented names the moment the labels were written the way the tracker
 * writes them.
 *
 * Only these are stripped, and only from the ends, so a phrase made entirely of game words is
 * still checked whole: `Omni Amplifier` has nothing structural to remove and still fails.
 */
const CONTROL_WORDS = new Set([
  'level', 'lab', 'labs', 'enable', 'enabled', 'taken', 'value', 'active', 'researched',
  'current', 'target', 'per', 'hit', 'own', 'your', 'times', 'by', 'at', 'to', 'not', 'a',
])

/** True when the phrase names something a catalog knows, once the control words are peeled off. */
function isKnown(phrase: string): boolean {
  const key = phrase.toLowerCase()
  if (AUTHORITY.has(key) || NOT_GAME_TERMS.has(key)) return true

  let words = key.split(/\s+/)
  while (words.length > 1 && CONTROL_WORDS.has(words[0]!)) words = words.slice(1)
  while (words.length > 1 && CONTROL_WORDS.has(words.at(-1)!)) words = words.slice(0, -1)

  /* Nothing but control words: a phrase like `Current Level` names no game thing and claims none. */
  if (words.every(word => CONTROL_WORDS.has(word))) return true

  const reduced = words.join(' ')
  return AUTHORITY.has(reduced) || NOT_GAME_TERMS.has(reduced)
}

/**
 * This package's root, resolved from the test's own location.
 *
 * Not the working directory. Vitest runs from the repo root as well as from the package, and
 * a CWD-relative scan reads the *site's* docs and README from one and the package's from the
 * other — reporting different results for the same code. That failed the suite the first time
 * it ran from the root.
 */
const PACKAGE_ROOT = path.resolve(__dirname, '..', '..')

/** Prose files: written by hand, and read by people deciding what things are called. */
function proseFiles(): string[] {
  const found: string[] = []
  const walk = (dir: string) => {
    let entries: string[]
    try {
      entries = readdirSync(dir)
    }
    catch {
      return
    }
    for (const entry of entries) {
      const full = path.join(dir, entry)
      if (statSync(full).isDirectory()) {
        if (entry !== 'node_modules' && entry !== 'generated') walk(full)
      }
      else if (/\.(ts|md)$/.test(entry) && !entry.includes('.generated.')) {
        found.push(full)
      }
    }
  }
  for (const root of ['docs', 'examples', 'templates']) walk(path.join(PACKAGE_ROOT, root))
  found.push(path.join(PACKAGE_ROOT, 'README.md'))
  return found
}

describe('game names that reach a person', () => {
  it('has a real authority, which knows the right names and not the invented one', () => {
    expect(AUTHORITY.size).toBeGreaterThan(500)
    expect(AUTHORITY.has('defense absolute'), 'the real stat').toBe(true)
    expect(AUTHORITY.has('orbital augment'), 'the real OA module').toBe(true)
    // The two that shipped. If either of these ever passes, the authority has been widened
    // until it cannot catch anything.
    expect(AUTHORITY.has('omni amplifier'), 'an invented module').toBe(false)
    expect(AUTHORITY.has('defence absolute'), 'the British misspelling').toBe(false)
  })

  it('every builder label and help string names something real', () => {
    /*
     * These are rendered by every bot and UI built on this package — `calculatorCommands()`
     * turns each one into a slash-command option description.
     */
    const unknown: string[] = []

    for (const builder of CALCULATOR_BUILDERS) {
      const texts = builder.fields.flatMap(field => [field.label, field.help ?? ''])
      texts.push(builder.title, builder.summary)

      for (const text of texts) {
        for (const match of String(text).matchAll(/\b([A-Z][a-z-]+(?: [A-Z][a-z-]+){1,3})\b/g)) {
          const term = match[1]!
          if (isKnown(term)) continue
          /*
           * No "must contain a game noun" filter. An earlier version had one to cut noise,
           * and it blinded the check to exactly the case it exists for: `Omni Amplifier`
           * contains no stat word, so an invented MODULE name sailed straight through while
           * the misspelling was caught. Verified by planting both.
           */
          unknown.push(`${builder.id}: "${term}"`)
        }
      }
    }

    const unique = [...new Set(unknown)]
    expect(
      unique.slice(0, 8),
      `${unique.length} label(s) naming something no catalog knows:\n  ${unique.slice(0, 8).join('\n  ')}`,
    ).toEqual([])
  })

  it('names nothing in the prose that a catalog does not know', () => {
    const unknown = new Map<string, string[]>()

    for (const file of proseFiles()) {
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(CANDIDATE)) {
        const term = match[1]!
        const key = term.toLowerCase()
        if (AUTHORITY.has(key) || NOT_GAME_TERMS.has(key)) continue
        if (!unknown.has(term)) unknown.set(term, [])
        const where = unknown.get(term)!
        if (!where.includes(file)) where.push(file)
      }
    }

    const report = [...unknown].map(([term, files]) => `"${term}" (${files[0]})`)
    expect(
      report.slice(0, 10),
      `${report.length} name(s) no catalog knows:\n  ${report.slice(0, 10).join('\n  ')}\n`
      + 'Either it is real and belongs in a catalog, or it was written from memory.',
    ).toEqual([])
  })

  it('spells stat names the way the game does, in text a person reads', () => {
    /*
     * `Defence` is correct English and wrong here, which is why nothing else catches it.
     * Scoped to prose and labels — the Effective Paths port uses `Armour` in its own
     * identifiers, which is a separate question and not something a user ever sees.
     */
    const wrong: Array<[RegExp, string]> = [[/\bDefence\b/, 'Defense'], [/\bArmour\b/, 'Armor']]
    const found: string[] = []

    const surfaces = proseFiles().filter(file => !file.includes('authored-names.test'))
    for (const file of surfaces) {
      const text = readFileSync(file, 'utf8')
      for (const [pattern, right] of wrong) {
        if (pattern.test(text)) found.push(`${file}: use ${right}`)
      }
    }

    for (const builder of CALCULATOR_BUILDERS) {
      for (const field of builder.fields) {
        const text = `${field.label} ${field.help ?? ''}`
        for (const [pattern, right] of wrong) {
          if (pattern.test(text)) found.push(`${builder.id}.${field.key}: use ${right}`)
        }
      }
    }

    expect(found, found.join('; ')).toEqual([])
  })
})

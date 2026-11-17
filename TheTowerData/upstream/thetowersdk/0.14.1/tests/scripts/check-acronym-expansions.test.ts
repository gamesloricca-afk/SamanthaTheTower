import { describe, expect, it } from 'vitest'
import {
  buildAcronymAuthority,
  buildNameAuthority,
  findInventedExpansions,
  scanRoots,
  scanText,
} from '../../scripts/check-acronym-expansions'

/**
 * A check nobody can make fail tests nothing.
 *
 * The value of this one is entirely in its precision: an initials sweep over ~300 acronyms
 * collides with almost every Title-Case phrase in English, and the first version reported 1,399
 * findings, of which zero were real. So these tests plant the two failure shapes and then assert
 * the specific false-positive classes that were fixed on the way down to zero — because each of
 * those was a bug in the check, and a check that regains them is a check nobody will read.
 */

const acronyms = buildAcronymAuthority()
const names = buildNameAuthority()

const scan = (text: string) => scanText(text, 'fixture.ts', acronyms, names)

describe('the authority', () => {
  it('knows what the acronyms actually expand to', () => {
    expect(acronyms.get('oa')).toContain('orbital augment')
    expect(acronyms.get('gt')).toContain('golden tower')
  })

  it('does not know the invented expansion', () => {
    // If this ever passes, the authority has been widened until it cannot catch anything.
    expect(acronyms.get('oa')).not.toContain('omni amplifier')
    expect(names.has('omni amplifier')).toBe(false)
  })

  it('knows the real names that merely collide, so they are not reported', () => {
    for (const name of ['orbital augment', 'attack range', 'orb size', 'electrified net']) {
      expect(names.has(name), name).toBe(true)
    }
  })
})

describe('planted faults', () => {
  it('catches an invented expansion handed to an entity resolver', () => {
    const findings = scan(`const icon = moduleAssetPath('Omni Amplifier')`)
    expect(findings).toHaveLength(1)
    expect(findings[0]!.acronym).toBe('OA')
    expect(findings[0]!.claimed).toBe('Omni Amplifier')
    expect(findings[0]!.known).toContain('orbital augment')
  })

  it('catches an invented expansion stated outright, in either word order', () => {
    expect(scan('the OA (Omni Amplifier) module')[0]?.claimed).toBe('Omni Amplifier')
    expect(scan('the Omni Amplifier (OA) module')[0]?.claimed).toBe('Omni Amplifier')
  })

  it('catches the real name being attached to the wrong acronym', () => {
    // GT is Golden Tower. Writing it as an expansion of something else is the same defect.
    const findings = scan('Golden Tower (GS) doubles coins')
    expect(findings.map(f => f.claimed)).toEqual([])
    const wrong = scan('Guardian Tempo (GT) doubles coins')
    expect(wrong[0]?.acronym).toBe('GT')
    expect(wrong[0]?.known).toContain('golden tower')
  })
})

describe('the false positives that made earlier versions unreadable', () => {
  it('does not read a qualifier in brackets as an expansion', () => {
    // `Tank Ult (CD)` — CD is the cooldown, not an acronym of "Tank Ult". Six correct chart
    // labels were reported this way until the paired detector required the initials to line up.
    expect(scan(`'Tank Ult (CD)',`)).toEqual([])
  })

  it('does not report a phrase that is merely near the word "module"', () => {
    // The 80-character context window let a page about modules condemn its own axis labels.
    expect(scan(`// modules are shown below\nconst labels = ['Total Cost', 'Damage Dealt']`))
      .toEqual([])
  })

  it('does not read `label:` as naming a lab', () => {
    // `lab` is a prefix of `label`, and under the `i` flag the camelCase-hump guard matched
    // lowercase too. That single bug accounted for 60 of 76 findings.
    expect(scan(`{ key: 'cannonShardsFetched', label: 'Cannon Shards' },`)).toEqual([])
  })

  it('treats a plural or an abbreviation as the same name, not a disagreement', () => {
    expect(scan(`moduleName: 'Land Mines'`)).toEqual([])
    expect(scan(`botName: 'Amp Bot'`)).toEqual([])
  })

  it('still fires when the wording differs in substance, not just in form', () => {
    // The same-wording escape must not swallow a genuinely different phrase of equal shape.
    expect(scan(`moduleName: 'Omni Amplifier'`)).toHaveLength(1)
  })
})

describe('the corpus', () => {
  it('scans the package and the sites that render it', () => {
    const roots = scanRoots()
    expect(roots.some(root => root.endsWith('src')), 'the SDK source').toBe(true)
    expect(roots.length).toBeGreaterThanOrEqual(3)
  })

  it('names no invented acronym expansion anywhere', () => {
    const findings = findInventedExpansions()
    const report = findings.map(f => `${f.acronym} "${f.claimed}" — glossary: ${f.known.join(', ')} (${f.file}:${f.line})`)
    expect(report, report.join('\n')).toEqual([])
  })
})

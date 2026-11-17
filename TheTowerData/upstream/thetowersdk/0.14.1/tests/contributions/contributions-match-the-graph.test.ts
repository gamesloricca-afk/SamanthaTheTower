import { describe, expect, it } from 'vitest'
import { COMMUNITY_GUIDES, CONTRIBUTIONS } from '../../src/contributions'
import { allNodes, GAME_KNOWLEDGE } from '../../src/knowledge'

/**
 * A credit has to correspond to work this package actually took.
 *
 * Both directions matter, and they fail differently. Crediting a guide nothing uses claims a
 * relationship that does not exist — the worse of the two, because it puts someone's name on a
 * page they never contributed to. Dropping a guide the graph does cite is the ordinary kind of
 * unfair, and the one that happens quietly during a redesign.
 *
 * So the list is checked against the shipped graph rather than maintained beside it.
 */
function graphRefs(): Set<string> {
  const refs = new Set<string>()
  const add = (value: unknown) => {
    const ref = typeof value === 'string' ? value : (value as { ref?: string })?.ref
    if (ref) refs.add(ref)
  }

  for (const node of allNodes(GAME_KNOWLEDGE)) {
    for (const source of node.sources ?? []) add(source)
    for (const assertion of node.assertions ?? []) {
      for (const source of (assertion as { sources?: unknown[] }).sources ?? []) add(source)
      add((assertion as { source?: unknown }).source)
    }
  }
  return refs
}

describe('the contributions roster matches the knowledge graph', () => {
  const refs = graphRefs()

  it('cites every community guide it credits', () => {
    const uncited = COMMUNITY_GUIDES
      .filter(guide => !refs.has(guide.graphRef))
      .map(guide => `${guide.title} by ${guide.author} — no node cites "${guide.graphRef}"`)

    expect(
      uncited,
      'A guide credited here but cited nowhere puts someone\'s name on work the package did not take.',
    ).toEqual([])
  })

  it('credits every guide the graph names an author for', () => {
    /*
     * Only refs that name a person. The graph cites plenty of sources that are not anyone's
     * guide — catalogs, the wiki, this project's own code — and those are credited elsewhere or
     * are not a contribution at all.
     */
    const authored = [...refs].filter(ref => /guide by |guide, by /i.test(ref))
    const credited = new Set(COMMUNITY_GUIDES.map(guide => guide.graphRef))
    const missing = authored.filter(ref => !credited.has(ref))

    expect(
      missing,
      `${missing.length} authored guide(s) the graph uses and this roster does not credit.`,
    ).toEqual([])
  })

  it('names a real person or group for every area, with something they did', () => {
    for (const area of CONTRIBUTIONS) {
      expect(area.people.length, `${area.area} credits nobody`).toBeGreaterThan(0)
      for (const person of area.people) {
        expect(person.name.trim().length, `${area.area} has an empty name`).toBeGreaterThan(0)
      }
    }
  })

  it('spells Mattew without an h, wherever the roster carries it', () => {
    /* The sheet spells it Mattew. Autocorrect does not, and a misspelled credit is a wrong one. */
    const everyName = CONTRIBUTIONS.flatMap(area => area.people.map(person => person.name))
    expect(everyName).toContain('Mattew')
    expect(everyName.filter(name => name === 'Matthew')).toEqual([])
  })
})

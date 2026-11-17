import { describe, expect, it } from 'vitest'
import { GAME_KNOWLEDGE } from '../../src/knowledge'
import { UNIQUE_MODULE_NAMES_BY_TYPE } from '../../src/knowledge/compartments/modules'
import { UNIQUE_MODULE_TEMPLATES } from '../../src/data/modules/templates'

/**
 * The compartment's unique-module list is hand-written and the catalog is
 * shipped data. This holds them to each other in BOTH directions.
 *
 * Both directions matters. A one-way check — every listed name exists in the
 * catalog — passes while the catalog grows a module the graph has never heard
 * of, and a player naming that module resolves to the generic parent node or to
 * something coincidental. That is the failure the per-module nodes exist to
 * prevent, so checking only the direction that is easy to write would defeat
 * their purpose.
 *
 * The list is NOT derived from the catalog on purpose: two sides from one
 * source cannot disagree, and a check that cannot fail is not a check. Until
 * 2026-08-18 a comment on that list claimed a test kept the two in step. There
 * was no such test.
 */

const modules = GAME_KNOWLEDGE.compartments.find(c => c.id === 'modules')!
const listed = Object.entries(UNIQUE_MODULE_NAMES_BY_TYPE)
  .flatMap(([type, names]) => names.map(name => ({ type, name })))
const templates = UNIQUE_MODULE_TEMPLATES as readonly {
  name: string
  initials: string
  type: string
  minRarity: string
  maxRarity: string
}[]

describe('unique modules correspond to the shipped catalog', () => {
  it('keeps Being Annihilator at five guaranteed shots while its rarity changes passive chance', () => {
    const module = UNIQUE_MODULE_TEMPLATES.find(row => row.name === 'Being Annihilator')!
    expect(typeof module.description).toBe('function')
    if (typeof module.description !== 'function') throw new Error('Being Annihilator description must render rarity chance')
    expect(module.rarityBonuses?.map(row => row.value)).toEqual([5, 7, 10, 14])
    for (const chance of [5, 7, 10, 14]) {
      const text = module.description(chance)
      expect(text).toContain(`Gain ${chance}% Super Crit chance.`)
      expect(text).toContain('next 5 shots')
    }
  })
  it('every listed module exists in the catalog, with the same type', () => {
    const byName = new Map(templates.map(t => [t.name, t]))
    const problems: string[] = []
    for (const { type, name } of listed) {
      const template = byName.get(name)
      if (!template) problems.push(`${name} (${type}) is listed but not in the catalog`)
      else if (template.type !== type) problems.push(`${name} listed as ${type}, catalog says ${template.type}`)
    }
    expect(problems, problems.join('\n  ')).toEqual([])
  })

  it('every catalog module is listed — the direction a one-way check misses', () => {
    const listedNames = new Set(listed.map(entry => entry.name))
    const missing = templates.filter(t => !listedNames.has(t.name)).map(t => `${t.name} (${t.type})`)
    expect(missing, `in the catalog with no node:\n  ${missing.join('\n  ')}`).toEqual([])
  })

  it('has one graph node per catalog module', () => {
    const nodes = modules.nodes.filter(n => n.id.startsWith('module.unique.') && n.id !== 'module.unique')
    expect(nodes).toHaveLength(templates.length)
  })

  it('carries the catalog initials, which is how players name these', () => {
    for (const template of templates) {
      const node = modules.nodes.find(n => n.id === `module.unique.${template.name.replace(/\s+/g, '')}`)
      const initials = node?.assertions?.find(a => a.predicate === 'initials')?.value
      expect(initials, `${template.name} initials`).toBe(template.initials)
    }
    // Initials must stay unique or resolving "MVN" becomes ambiguous.
    const all = templates.map(t => t.initials)
    expect(new Set(all).size).toBe(all.length)
  })

  it('reports no failed join anywhere in the compartment', () => {
    const failed = modules.nodes
      .flatMap(n => n.assertions ?? [])
      .filter(a => ['resolvesToCatalogTemplate', 'typeAgreesWithCatalog'].includes(a.predicate))
      .filter(a => a.value !== true)
      .map(a => a.subject)
    expect(failed).toEqual([])
  })

  it('agrees that every unique spans Epic to the top Ancestral tier', () => {
    // The node summaries say the unique effect strengthens "from Epic through
    // Ancestral". The catalog spells the ceiling "Ancestral 5", so the claim is
    // asserted against the catalog's own spelling rather than the prose.
    for (const template of templates) {
      expect(template.minRarity, `${template.name} min`).toBe('Epic')
      expect(template.maxRarity, `${template.name} max`).toBe('Ancestral 5')
    }
  })
})

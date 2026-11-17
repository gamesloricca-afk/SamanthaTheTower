import { describe, expect, it } from 'vitest'
import {
  EFFECTIVE_PATH_CURRENCIES,
  EFFECTIVE_PATHS,
  SHARED_ACROSS_CURRENCIES,
} from '../../src/mechanics/effective-paths/currencies'
import { EFFECTIVE_DAMAGE_CANDIDATES_BY_PATH } from '../../src/mechanics/effective-paths/edamage-candidates'
import { EFFECTIVE_HEALTH_UPGRADES } from '../../src/mechanics/effective-paths/ehp-plan'
import { EFFECTIVE_REGEN_UPGRADES } from '../../src/mechanics/effective-paths/regen-plan'
import { EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH } from '../../src/mechanics/effective-paths/eecon-candidates'

/**
 * The currency map, checked against the candidate lists it describes.
 *
 * A count drifting out of step here means the map is stale, which is worse
 * than not having one — it would be the thing a later reader trusts instead of
 * going back to the sheet.
 */

describe('the currency map', () => {
  it('describes a cost source for every currency', () => {
    for (const entry of EFFECTIVE_PATH_CURRENCIES) {
      expect(entry.buys.length, entry.currency).toBeGreaterThan(0)
      expect(entry.costSource.length, entry.currency).toBeGreaterThan(0)
    }
  })

  it('names a currency each path can actually spend', () => {
    const known = new Set(EFFECTIVE_PATH_CURRENCIES.map(entry => entry.currency))
    for (const path of EFFECTIVE_PATHS) {
      expect(known.has(path.currency), `${path.tab} / ${path.currency}`).toBe(true)
    }
  })
})

describe('the candidate counts match the ported lists', () => {
  const countFor = (domain: string, currency: string) =>
    EFFECTIVE_PATHS.find(path => path.domain === domain && path.currency === currency)?.candidates

  it('matches eHP', () => {
    const labCandidates = EFFECTIVE_HEALTH_UPGRADES
      .filter(upgrade => upgrade.variants.includes('lab-time')).length
    expect(countFor('ehp', 'research-time')).toBe(labCandidates)

    const stone = EFFECTIVE_HEALTH_UPGRADES
      .filter(upgrade => upgrade.variants.includes('stone')).length
    expect(countFor('ehp', 'power-stones')).toBe(stone)
  })

  it('matches eRegen', () => {
    expect(countFor('eregen', 'research-time')).toBe(EFFECTIVE_REGEN_UPGRADES.length)
  })

  it('matches eDamage on every path', () => {
    expect(countFor('edamage', 'research-time')).toBe(EFFECTIVE_DAMAGE_CANDIDATES_BY_PATH.lab.length)
    expect(EFFECTIVE_PATHS.filter(path => path.domain === 'edamage' && path.currency === 'coins'))
      .toEqual([{ domain: 'edamage', tab: 'eDamage', currency: 'coins', candidates: 45 }])
    expect(countFor('edamage', 'power-stones')).toBe(EFFECTIVE_DAMAGE_CANDIDATES_BY_PATH.stone.length)
    expect(countFor('edamage', 'keys')).toBe(EFFECTIVE_DAMAGE_CANDIDATES_BY_PATH.keys.length)
  })

  it('reports all ported economy paths and their pricing', () => {
    const economy = EFFECTIVE_PATHS.filter(entry => entry.domain === 'eecon')
    expect(economy.map(({ tab, currency, candidates }) => [tab, currency, candidates])).toEqual([
      ['eEcon', 'research-time', EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH.time.length],
      ['eEcon', 'coins', EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH.time.length],
      ['eEcon Stones', 'power-stones', EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH.stone.length],
      ['eEcon Discount', 'coins', EFFECTIVE_ECONOMY_CANDIDATES_BY_PATH.discount.length],
    ])
  })
})

describe('the upgrades more than one currency buys', () => {
  it('records why each one matters', () => {
    for (const entry of SHARED_ACROSS_CURRENCIES) {
      expect(entry.currencies.length, entry.upgrade).toBeGreaterThan(0)
      expect(entry.note.length, entry.upgrade).toBeGreaterThan(0)
    }
  })

  it('keeps the assist slot efficiency apart from its lab', () => {
    // The distinction three separate porting errors turned on: the stone-bought
    // slot upgrade and the lab of the same name are different quantities that
    // add, not one quantity bought two ways.
    const assist = SHARED_ACROSS_CURRENCIES
      .find(entry => entry.upgrade === 'Assist module slot efficiency')
    expect(assist?.currencies).toEqual(['power-stones'])
    expect(assist?.note).toMatch(/separate quantity/)
  })

  it('has the eHP plan agree that masteries are bought two ways', () => {
    const mastery = EFFECTIVE_HEALTH_UPGRADES.find(u => u.sheetName === 'Health Mastery')
    expect(mastery?.variants).toContain('lab-time')
    expect(mastery?.variants).toContain('coin')
  })
})

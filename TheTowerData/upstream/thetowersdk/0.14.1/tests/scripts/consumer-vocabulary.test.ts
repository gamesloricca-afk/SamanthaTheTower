import { describe, expect, it } from 'vitest'
import { CONSUMER_WORDS } from '../../scripts/consumer-vocabulary.mjs'

function matches(text: string): string[] {
  return text.match(CONSUMER_WORDS) ?? []
}

describe('consumer vocabulary', () => {
  it.each([
    'tracker',
    'the Tracker page',
    'TRACKER',
    'SITE',
    'CALL SITE',
    'SITE_TABLE',
    'SPECIAL_SITE_LAB_LABELS',
    'CATALOG_SITE',
    'fromSite',
    'SiteLabs',
    'getSiteLabSlug',
  ])('flags %s', text => {
    expect(matches(text)).not.toEqual([])
  })

  it.each([
    'COMPOSITE',
    'STONE_COMPOSITE',
    'OPPOSITE',
    'OPPOSITELY',
    'LAB_PREREQUISITES',
    'PERK_EFFECT_SITES',
    'randomBasicCallSites',
    'WAVE_SPAWN_RANDOM_BASIC_CALL_SITES_DEFAULT',
    'call site',
    'WAVE_SPAWN_RANDOM_BASIC_CALL_SITE_COUNT_V29',
    'WAVE_UPDATE_SPAWN_BASIC_TICK_CAP_GATE_SITE_V29',
    'callSite',
    'website',
    'trackers',
  ])('does not flag %s', text => {
    expect(matches(text)).toEqual([])
  })
})

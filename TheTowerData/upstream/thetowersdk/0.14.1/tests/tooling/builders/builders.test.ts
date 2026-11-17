import { describe, expect, it } from 'vitest'
import { loadSdkGraph } from '../../../tooling/sdk-graph'
import { loadEpGraph } from '../../../src/mechanics/ep-graph'
import {
  TOWER_PREMADE_BUILDER_IDS,
  applySdkGraphMutate,
  applyEpGraphMutate,
  listSaveImportPayloadBuilders,
  describeDomainSettingsBundlePath,
  runPlannerCodegen,
} from '../../../tooling/builders'

describe('tower premade builders', () => {
  it('pins the six premade ids', () => {
    expect(TOWER_PREMADE_BUILDER_IDS).toHaveLength(6)
    expect(new Set(TOWER_PREMADE_BUILDER_IDS).size).toBe(6)
  })

  it('sdk-graph mutate wrapper calls real export (empty ops)', () => {
    const graph = loadSdkGraph()
    const r = applySdkGraphMutate(graph, [])
    expect(r.issues).toEqual([])
    expect(r.applied).toBe(0)
    expect(typeof r.contentVersion).toBe('number')
  })

  it('ep-graph mutate wrapper calls real export (empty ops)', () => {
    const graph = loadEpGraph()
    const r = applyEpGraphMutate(graph, [])
    expect(r.issues).toEqual([])
    expect(r.applied).toBe(0)
  })

  it('lists save import payload builders with vault present', () => {
    const list = listSaveImportPayloadBuilders()
    expect(list.some(x => x.exportName === 'buildVaultImportPayload')).toBe(true)
  })

  it('domain-settings descriptor points at platform factory', () => {
    const d = describeDomainSettingsBundlePath('labs')
    expect(d.platformFactory).toContain('revisioned-domain-settings-factory')
    expect(d.wrapsExport).toBe('buildRevisionedDomainSettingsModule')
  })

  it('planner codegen wrapper returns citations array for eEcon', () => {
    const r = runPlannerCodegen({ family: 'eEcon' })
    expect(r.family).toBe('eEcon')
    expect(Array.isArray(r.citations)).toBe(true)
  })
})

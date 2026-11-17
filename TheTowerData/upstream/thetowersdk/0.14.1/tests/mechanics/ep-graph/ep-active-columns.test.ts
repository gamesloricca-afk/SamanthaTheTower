import { describe, expect, it } from 'vitest'

import { loadEpGraph } from '../../../src/mechanics/ep-graph'

/**
 * The card and perk `Active` columns, which are answers rather than switches.
 *
 * These were the last 75 rows on the work list, described as mechanical: 
 * repetitive toggles to wire and be done. Reading them settled that they are
 * not toggles at all.
 *
 *     AZ31  =AND(AZ28, IDS_CARDS_IN_PRESET(AZ6, AU31))
 *     AZ32  =AND(AZ31, IDS_CARD_MASTERY(AU31))
 *     AZ45  =IDS_PERK_IN_PRESET($AZ$9, "All Coin Bonus")
 *
 * A card is active when the Cards master is on AND the card is in the Cards
 * preset. A mastery row depends on its own base card row, not on the master. A
 * perk is active when it is in the Perks preset — and, unlike cards, does NOT
 * consult its master at all.
 *
 * All three authored tabs have now been read, and they do not agree:
 *
 *     eEcon   base card row ANDs the master; mastery row hangs off the base row
 *     eHP     base card row does NOT read the master; mastery row reads BOTH
 *     eDamage the eHP shape
 *
 * So eEcon is the odd one out, and it was the one read first. Two blocks that
 * look alike have differed every time anyone checked.
 */
describe('EP Active columns', () => {
  const graph = loadEpGraph()
  const reads = (id: string) => graph.edges
    .filter(edge => edge.from === id && edge.kind === 'reads')
    .map(edge => edge.to)

  it('models the card column as reading the master and the preset', () => {
    const targets = reads('display.eEcon.cardActiveBlock')
    expect(targets).toContain('control.eEcon.cardsMaster')
    expect(targets).toContain('display.eEcon.presetCards')
  })

  it('records that perks do not consult their master, unlike cards', () => {
    // The asymmetry is the finding. Assuming the two blocks work alike gets one
    // of them wrong, and nothing on the sheet hints which.
    const perks = reads('display.eEcon.perkActiveBlock')
    expect(perks).toContain('display.eEcon.presetPerks')
    expect(perks).not.toContain('control.eEcon.perksMaster')

    const node = graph.nodes['display.eEcon.perkActiveBlock']
    expect(node?.traps.some(trap => trap.note.includes('DO NOT AND'))).toBe(true)
  })

  it('records the two label-derived lookups', () => {
    // AZ34 takes LEFT(AU34, 9) of its own label to name the card, and AZ49
    // reads its label cell for the perk name. Both make a display string
    // load-bearing, and both are invisible from the value they produce.
    const cards = graph.nodes['display.eEcon.cardActiveBlock']
    const perks = graph.nodes['display.eEcon.perkActiveBlock']
    expect(cards?.traps.some(trap => trap.note.includes('LEFT(AU34, 9)'))).toBe(true)
    expect(perks?.traps.some(trap => trap.note.includes('AU49'))).toBe(true)
  })

  it('records that mastery rows hang off their base card row', () => {
    const cards = graph.nodes['display.eEcon.cardActiveBlock']
    expect(cards?.traps.some(trap => trap.note.includes('AZ32 is'))).toBe(true)
  })

  it('records the master dependency per tab, because it differs per tab', () => {
    // eEcon's base card rows read the master. eHP's and eDamage's do not — only
    // their mastery rows do. Modelling one shape for all three would be wrong
    // for two of them.
    expect(reads('display.eEcon.cardActiveBlock')).toContain('control.eEcon.cardsMaster')

    for (const [tab, node] of [
      ['eHP', 'display.eHP.cardActiveBlock'],
      ['eDamage', 'display.eDamage.cardActiveBlock'],
    ] as const) {
      const trap = graph.nodes[node]?.traps.map(t => t.note).join(' ')
      expect(trap, tab).toMatch(/mastery rows/i)
    }
  })

  it('models the eHP perks master as derived, not as a toggle', () => {
    // AY28 is =AY10<>"Tourney": perks are on unless the Simulated Tier is
    // Tourney. It was wired as a control because a value read shows TRUE and
    // the row sits in a column of switches.
    expect(graph.nodes['control.eHP.perksMaster']).toBeUndefined()
    const node = graph.nodes['display.eHP.perksMaster']
    expect(node?.type).toBe('display')
    expect(reads('display.eHP.perksMaster')).toContain('control.eHP.simulatedTier')
  })

  it('records the two eEcon inputs that turned out to be derived', () => {
    // The last two rows on the work list, and neither is a setting.
    const kps = graph.nodes['display.eEcon.goldenComboKillsPerSecond']
    expect(kps?.type).toBe('display')
    expect(kps?.traps.some(t => t.note.includes('CROSS-TAB'))).toBe(true)

    const boss = graph.nodes['display.eEcon.bossWaveInterval']
    expect(boss?.type).toBe('display')
    expect(boss?.traps.some(t => t.note.includes('tier'))).toBe(true)
    expect(graph.nodes['control.eEcon.bossWaveInterval']).toBeUndefined()
  })

  it('keeps the two same-named boss interval cells apart', () => {
    // eEcon AZ25 and eDamage AY28 carry the same label and different formulas:
    // one derives from the tier, the other from Galaxy Compressor and Run Type.
    // Collapsing them to one concept would make a tier change move an eDamage
    // number it does not touch.
    const link = graph.edges.find(edge => edge.id === 'e.eEcon.bossWaveInterval.differsFrom.eDamage')
    expect(link).toBeTruthy()
    expect(graph.nodes['display.eEcon.bossWaveInterval']).toBeTruthy()
    expect(graph.nodes['display.eDamage.bossWaveInterval']).toBeTruthy()
  })
})

describe('the eEcon block a formula read never reached', () => {
  const graph = loadEpGraph()

  it('models Calculation Rows as derived on eEcon and as input elsewhere', () => {
    // Same name, three tabs, three behaviours: eDamage AI21 and eHP AJ22 hold
    // literals; eEcon AK4 is =IF(IDS!E6="✅", 25, 1).
    expect(graph.nodes['display.eEcon.calculationRows']?.type).toBe('display')
    expect(graph.nodes['control.eEcon.calculationRows']).toBeUndefined()
    expect(graph.nodes['control.eDamage.rowsCalculated']?.type).toBe('control')
    expect(graph.nodes['control.eHP.rowsCalculated']?.type).toBe('control')
  })

  it('records the coin chain and the two string-typed terms in it', () => {
    // AK13 multiplies eight terms. Two of its inputs are TEXT: the tier
    // multiplier switches on a tier NAME and can land on "Unknown Tier", and
    // the Ad/Starter/Epic cell falls back to the string "x1", which AK13 strips
    // a character from before using.
    const all = graph.nodes['display.eEcon.allCoinBonus']
    expect(all?.traps.some(t => t.note.includes('eight'))).toBe(true)
    expect(all?.traps.some(t => t.note.includes('RIGHT(AK11'))).toBe(true)

    const tier = graph.nodes['display.eEcon.tierCoinMultiplier']
    expect(tier?.traps.some(t => t.note.includes('Unknown Tier'))).toBe(true)

    const reads = graph.edges
      .filter(edge => edge.from === 'display.eEcon.allCoinBonus' && edge.kind === 'reads')
      .map(edge => edge.to)
    expect(reads).toContain('display.eEcon.themesBonus')
    expect(reads).toContain('display.eEcon.tierCoinMultiplier')
    expect(reads).toContain('display.eEcon.adStarterEpicMultiplier')
  })

  it('records the farming tier fallback, which hides a missing import', () => {
    const node = graph.nodes['display.eEcon.farmingTier']
    expect(node?.traps.some(t => t.note.includes('reads as tier 1 rather than as missing'))).toBe(true)
  })
})

describe('the eRegen import into eHP', () => {
  const graph = loadEpGraph()

  it('records that eHP reads the hidden tab, not only the other way round', () => {
    // AH6 is ={eRegen!$J$6:$J}, AJ10 is =eRegen!AJ4, AJ13 is =eRegen!AJ6.
    // eRegen mirrors eHP's AL3:BM37 and eHP imports eRegen's results from
    // columns the mirror does not cover, so the hidden tab sits in the middle
    // of the eHP calculation rather than downstream of it.
    const node = graph.nodes['display.eHP.regenImport']
    expect(node).toBeTruthy()
    expect(node?.traps.some(t => t.note.includes('two-way'))).toBe(true)

    const reads = graph.edges
      .filter(edge => edge.from === 'display.eHP.regenImport' && edge.kind === 'reads')
      .map(edge => edge.to)
    expect(reads).toContain('display.eRegen.mirroredPanel')
  })

  it('keeps the mirror node from reading as inert', () => {
    const mirror = graph.nodes['display.eRegen.mirroredPanel']
    expect(mirror?.traps.some(t => t.note.includes('NOT one-directional'))).toBe(true)
  })
})

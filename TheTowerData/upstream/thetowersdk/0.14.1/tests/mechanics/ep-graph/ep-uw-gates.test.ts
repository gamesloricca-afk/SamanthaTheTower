import { describe, expect, it } from 'vitest'

import { loadEpGraph } from '../../../src/mechanics/ep-graph'

/**
 * The eDamage ownership gates, and the one that is a string.
 *
 * Every ultimate weapon stat on eDamage is wrapped in `IF($BH$nn, ..., "")`.
 * The `BH` column is a block of owned-flags, one per weapon, and it carries no
 * labels at all — each row was identified by the `STAT_UW_*` function the
 * formula reading it calls, not by anything next to it.
 *
 *     BH30 Death Wave        BH33 Spotlight          BH37 Inner Land Mines
 *     BH31 Chain Lightning   BH34 Spotlight Missiles BL37 Inner Land Mines+
 *     BH32 Smart Missiles    BH35 Poison Swamp
 *
 * BH36 was recorded unnamed on the first pass because nothing read so far
 * referenced it. Reading the gate cell itself settled it — every one of them is
 * `AND(IDS_UW_OWN("<weapon>"), AX19<>"UW Disso")`, which names the weapon
 * outright and reveals that Run Type gates all seven. BH36 is Chrono Field.
 */
describe('eDamage ownership gates', () => {
  const graph = loadEpGraph()
  const gatesFor = (id: string) => graph.edges
    .filter(edge => edge.to === id && edge.kind === 'gates')
    .map(edge => edge.from)

  it('gates every ultimate weapon stat on its own weapon being owned', () => {
    const expected: Record<string, string> = {
      'stat.eDamage.deathWaveQuantity': 'gate.eDamage.deathWaveOwned',
      'stat.eDamage.chainLightningDamage': 'gate.eDamage.chainLightningOwned',
      'stat.eDamage.smartMissilesQuantity': 'gate.eDamage.smartMissilesOwned',
      'stat.eDamage.spotlightDamage': 'gate.eDamage.spotlightOwned',
      'stat.eDamage.innerLandMinesQuantity': 'gate.eDamage.innerLandMinesOwned',
    }
    for (const [stat, gate] of Object.entries(expected)) {
      expect(gatesFor(stat), stat).toContain(gate)
    }
  })

  it('Spotlight Missiles needs two weapons, not one', () => {
    // AV9 is IF(AND($BH$33, $BH$34), ...). A model gating it on the Spotlight
    // Missiles flag alone shows a stat for an account that owns the module but
    // not Spotlight.
    const gates = gatesFor('stat.eDamage.spotlightMissilesDamage')
    expect(gates).toContain('gate.eDamage.spotlightOwned')
    expect(gates).toContain('gate.eDamage.spotlightMissilesAvailable')
    expect(gates.length).toBe(2)
  })

  it('the UW+ gate is a string comparison, not a boolean', () => {
    // BL37 holds "Locked", and the sheet tests BL37<>"Locked". Reading it as
    // truthy inverts the meaning outright: a non-empty string is truthy, so a
    // LOCKED weapon reads as unlocked.
    const node = graph.nodes['gate.eDamage.ilmPlusUnlocked']
    expect(node).toBeTruthy()
    expect(node?.traps.some(trap => trap.note.includes('"Locked"'))).toBe(true)

    const gates = gatesFor('display.eDamage.ilmPlusHitsOnSameTargets')
    expect(gates).toContain('gate.eDamage.ilmPlusUnlocked')
    expect(gates).toContain('gate.eDamage.innerLandMinesOwned')
  })

  it('names BH36 from its own formula, not from its position', () => {
    // It was recorded `researching` and unnamed because nothing read so far
    // referenced it. Reading the gate cell itself named it at once: position
    // told nothing, the formula told everything.
    expect(graph.nodes['gate.eDamage.unidentifiedRow36']).toBeUndefined()
    expect(graph.nodes['gate.eDamage.chronoFieldOwned']?.status).toBe('verified')
  })

  it('gates every weapon on Run Type as well as ownership', () => {
    // Each gate is AND(IDS_UW_OWN(...), AX19<>"UW Disso"). A model gating only
    // on ownership leaves every ultimate active in a run type that disables
    // them all — one control, seven weapons.
    const owned = Object.values(graph.nodes)
      .filter(node => node.type === 'gate' && node.id.endsWith('Owned'))

    expect(owned.length).toBe(7)
    for (const gate of owned) {
      const reads = graph.edges
        .filter(edge => edge.from === gate.id && edge.kind === 'reads')
        .map(edge => edge.to)
      expect(reads, gate.id).toContain('control.eDamage.runType')
    }
  })

  it('Spotlight Missiles availability is derived, not owned', () => {
    // BH34 is AND(BH33, BC33>0): Spotlight owned and its Spotlight Missiles
    // substat above zero. It sits in the ownership block and is not an
    // ownership flag, which is what reading it by position got wrong.
    const node = graph.nodes['gate.eDamage.spotlightMissilesAvailable']
    expect(node?.label).toBe('Spotlight Missiles available')
    expect(node?.traps.some(trap => trap.note.includes('BC33'))).toBe(true)

    const derives = graph.edges
      .filter(edge => edge.from === 'gate.eDamage.spotlightMissilesAvailable' && edge.kind === 'derives')
      .map(edge => edge.to)
    expect(derives).toEqual(['gate.eDamage.spotlightOwned'])
  })

  it('Poison Swamp carries a condition the other weapons do not', () => {
    // AI17, the PS Beta Testing toggle. Poison Swamp can be owned and still
    // contribute nothing, and no other gate in the block works that way.
    const reads = graph.edges
      .filter(edge => edge.from === 'gate.eDamage.poisonSwampOwned' && edge.kind === 'reads')
      .map(edge => edge.to)
    expect(reads).toContain('control.eDamage.psBetaTesting')

    const others = ['deathWaveOwned', 'chainLightningOwned', 'smartMissilesOwned', 'spotlightOwned']
    for (const key of others) {
      const theirs = graph.edges
        .filter(edge => edge.from === `gate.eDamage.${key}` && edge.kind === 'reads')
        .map(edge => edge.to)
      expect(theirs, key).not.toContain('control.eDamage.psBetaTesting')
    }
  })

  it('every gate records how it was identified', () => {
    // None of the BH rows carries a label, so "which weapon is this" is a
    // claim, and every one of them needs its evidence attached.
    const gates = Object.values(graph.nodes).filter(node => node.type === 'gate')
    expect(gates.length).toBeGreaterThanOrEqual(9)
    for (const gate of gates) {
      expect(gate.traps.length, gate.id).toBeGreaterThan(0)
    }
  })
})

describe('Hide UW Cooldown is not uniform', () => {
  const graph = loadEpGraph()

  it('hides two of the four cooldown columns', () => {
    // The 20-column UW hide row on eDamage Stone (EJ2:FB2) was read in full.
    // $AY$24 is on DW Cooldown and SM Cooldown ONLY. PS Cooldown is
    // =NOT($BH$35) and ILM Cooldown is =AND(NOT($BH$37)) -- neither mentions
    // it. "Hide UW Cooldown" reads like a blanket switch and is not one, and a
    // model that treats it as one hides two columns the sheet keeps.
    const hidden = graph.edges
      .filter(e => e.to === 'control.eDamage.hideUwCooldown')
      .map(e => e.from)
      .sort()
    expect(hidden).toEqual([
      'hide.eDamageStone.dwCooldownColumn',
      'hide.eDamageStone.smCooldownColumn',
    ])

    const note = graph.nodes['hide.eDamageStone.smCooldownColumn']?.traps
      .map(t => t.note).join(' ')
    expect(note).toContain('EZ2')
    expect(note).toContain('FD2')
  })

  it('applies the target-level switch to every column in the band', () => {
    // All twenty read, not sampled. The assumption held -- every UW stone
    // column passes $AY$23 to EPG_UW_TARGET_LEVEL -- but reading them turned
    // up three things a fill-down assumption would have flattened, pinned
    // below.
    const excerpts = graph.edges
      .filter(e => e.to === 'control.eDamage.ignoreUwTargetLevels')
      .map(e => e.evidence?.formulaExcerpt ?? '')
    expect(excerpts.length).toBeGreaterThanOrEqual(5)
    for (const excerpt of excerpts) {
      expect(excerpt).toContain('EPG_UW_TARGET_LEVEL')
      expect(excerpt).toContain('$AY$23')
    }
    // spanning the band rather than clustering in it
    expect(excerpts.some(x => x.includes('"Death Wave", "Cooldown"'))).toBe(true)
    expect(excerpts.some(x => x.includes('"Inner Land Mines", "Cooldown"'))).toBe(true)
  })

  it('maps the five current UW+ cells to the nine-weapon gate', () => {
    const gate = graph.nodes['gate.eDamageStone.uwPlusRequiresNineUws']
    expect(gate?.sourceCells.map(ref => [ref.sheet, ref.cell])).toEqual(
      ['ER5', 'EV5', 'EZ5', 'FD5', 'FF5', 'ES5'].map(cell => ['eDamage Stone', cell]),
    )
    expect(gate?.formula).toContain('IDS_UW_COUNT()<=8')
  })

  it('stops the Spotlight angle column at a value ceiling, not a missing cost', () => {
    // Every other column ends when DVT_UW_STAT returns "". SL Angle ends at
    // INDEX(AUW_SL_ANGLE_VAL, BZ5)+$AM$30>=90 -- base PLUS SUBSTAT, so a
    // substat can retire the upgrade before the base value reaches 90.
    const formula = graph.nodes['gate.eDamageStone.spotlightAngleCap']?.formula ?? ''
    expect(formula).toContain('>=90')
    expect(formula).toContain('$AM$30')
  })

  it('records that the four ILM columns share one hide flag', () => {
    // FB5, FC5, FD5 and FE5 all open with OR($EH5, FB$2). Every other column
    // reads its own flag. Inert today because FB2:FE2 are the identical
    // expression -- which is precisely why it is invisible, and why a change
    // to FC2, FD2 or FE2 would silently do nothing.
    const note = graph.nodes['hide.eDamageStone.ilmColumnsShareOneFlag']?.traps
      .map(t => t.note).join(' ') ?? ''
    expect(note).toContain('FB$2')
    expect(note).toContain('=AND(NOT($BH$37))')
  })
})

describe('eDamage Stone level columns and matrix', () => {
  const graph = loadEpGraph()

  it('parses UW levels out of a string by its first two characters', () => {
    // VALUE(LEFT(IDS_UW_LEVEL(...), 2)). A level of 100+ reads as its first two
    // digits. Whether that is reachable depends on the max UW stat level, which
    // is NOT established here -- the bound lives in DVT_UWs. Pinned as a hazard
    // with the check named, so nobody re-derives the parse from the values,
    // which are all 0 on the demo IDS and would tell them nothing.
    const node = graph.nodes['display.eDamageStone.uwLevelColumns']
    expect(node?.formula).toContain('LEFT(IDS_UW_LEVEL')
    expect(node?.formula).toContain(', 2)')
    expect(node?.traps.some(t => t.kind === 'maxed-account')).toBe(true)
  })

  it('uses -1, not 0, for a locked UW+ stat', () => {
    // IFERROR(..., -1) on exactly the five UW+ level columns, and the consumers
    // test against -1: IF(BX5>-1, ...), IF(CB5=-1, 1, ...), IF(CJ5=-1, 1, ...).
    // Defaulting a locked stat to 0 makes it look owned at level zero.
    const note = graph.nodes['display.eDamageStone.uwPlusLockedSentinel']?.traps
      .map(t => t.note).join(' ') ?? ''
    expect(note).toContain('-1')
    for (const cell of ['BX', 'CB', 'CF', 'CJ', 'CL']) {
      expect(note, cell).toContain(cell)
    }
  })

  it('has one more level column than it has simulations', () => {
    // 29 level columns (BO:CQ), 29 ROI columns (FM:GO), 28 simulations
    // (EJ:FK). Assist Module Bonus - Cannon is the odd one: GK5 computes its
    // ROI in a single step. Counting simulations as the path width is off by
    // one, and the missing one is not missing.
    const roi = graph.nodes['stat.eDamageStone.assistCannonBonusRoi']
    expect(roi?.formula).toContain('EPG_MODULE_BONUS')
    expect(roi?.formula).not.toContain('EPG_UW_TARGET_LEVEL')
    const note = roi?.traps.map(t => t.note).join(' ') ?? ''
    expect(note).toContain('29')
    expect(note).toContain('28')
  })

  it('does not apply the UW target switch to assist module columns', () => {
    // The module columns cap at hard levels -- 69, 69, 99, 69 -- and never call
    // EPG_UW_TARGET_LEVEL. "Ignore UW Target Levels" is a UW-stat switch, not a
    // path-wide one, and a port that applies it to the whole stone path lifts
    // caps the sheet keeps.
    const gate = graph.nodes['gate.eDamageStone.moduleLevelCaps']
    expect(gate?.formula).toContain('CN5>=69')
    expect(gate?.formula).not.toContain('EPG_UW_TARGET_LEVEL')

    const targetGated = graph.edges
      .filter(e => e.to === 'control.eDamage.ignoreUwTargetLevels')
      .map(e => e.from)
    expect(targetGated).not.toContain('gate.eDamageStone.moduleLevelCaps')
    expect(targetGated).not.toContain('stat.eDamageStone.assistCannonBonusRoi')
  })
})

describe('satellite ROI is not one formula', () => {
  const graph = loadEpGraph()

  it('flips the ratio direction between adjacent discount columns', () => {
    // CL5 is a MULTIPLIER and rises: (New/Old-1). CM5:CQ5 are COSTS and fall:
    // (Old/New-1). The two are adjacent, identical in shape, and both return a
    // positive number — so using one form for the whole band is wrong for five
    // of six columns and looks perfectly healthy.
    expect(graph.nodes['stat.eEconDiscount.multiplierRoi']?.formula).toContain('(New/Old-1)')
    expect(graph.nodes['stat.eEconDiscount.costRoi']?.formula).toContain('(Old/New-1)')
  })

  it('records that one discount column is not gated by the hide switch', () => {
    // Five of six discount columns carry AY14. Labs Coin Discount does not.
    const note = graph.nodes['hide.eEconDiscount.labsCoinDiscountColumn']?.traps
      .map(t => t.note).join(' ') ?? ''
    expect(note).toContain('AY14')
    expect(graph.nodes['hide.eEconDiscount.labsCoinDiscountColumn']?.formula)
      .not.toContain('AY14')
  })

  it('infers the vault level by division, with a per-stat divisor', () => {
    // =BM8/5%. Nothing stores the vault level. The divisor differs per stat, so
    // a single one is wrong for eight of eleven columns, and the result is used
    // unrounded as an exponent.
    const node = graph.nodes['display.eDamageKeys.vaultLevelColumns']
    expect(node?.formula).toBe('=BM8/5%')
    const note = node?.traps.map(t => t.note).join(' ') ?? ''
    expect(note).toContain('FRACTIONAL')
    expect(note).toContain('POW(2, BO5)')
  })
})

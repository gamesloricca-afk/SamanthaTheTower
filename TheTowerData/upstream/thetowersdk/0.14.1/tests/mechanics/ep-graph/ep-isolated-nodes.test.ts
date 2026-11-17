import { describe, expect, it } from 'vitest'

import { loadEpGraph } from '../../../src/mechanics/ep-graph'

/**
 * Nodes that record a control exists and nothing about what it affects.
 *
 * An isolated node is the EP graph's version of this repo's signature defect:
 * supported by the model, never wired, nothing reports it. It is not wrong —
 * the cell is real and correctly typed — it just answers "does this exist"
 * while the question worth asking is "if I flip this, what moves".
 *
 * The count is a CEILING that should only fall. Every one closed needs the same
 * evidence as any other edge: the formula of the cell that reads it.
 *
 * 41 -> 1, and the one left is terminal.
 *
 * The last five closed together, and the reason they held out is worth keeping:
 * every one of them is read on a DIFFERENT TAB from the one that shows it. The
 * satellite tabs — `eDamage Stone`, `eDamage Coins`, `eEcon Discount`,
 * `eEcon Stones` — spill the planner's control panel into themselves and read
 * the switches there. Searching the tab a control appears on cannot find them,
 * and searching harder would not have helped.
 *
 * Two things made that band invisible. A FORMULATEXT read of a spilled cell
 * returns empty, so the mirror looks like a reference to nothing; only a value
 * read shows the panel. And `eEcon Discount` spills at a ONE-COLUMN OFFSET, so
 * the letters do not carry across.
 *
 * The test below outlived that: an isolated node must say WHERE it was looked
 * for. "Not wired yet" and "searched four bands and it is not there" are
 * different claims, and only the second is a finding — this is what turned the
 * last five from a backlog into a question with an answer.
 *
 * One node is TERMINAL by nature rather than unwired. `authorDisclaimer` is a
 * drawing over the path table; nothing can read it, so it will never gain an
 * edge and should not be counted as work outstanding. Declared below, because
 * "cannot have one" and "does not have one yet" are different states and a bare
 * count conflates them.
 */
const ISOLATED_CEILING = 1

function isolatedIds(): string[] {
  const graph = loadEpGraph()
  const touched = new Set<string>()
  for (const edge of graph.edges) {
    touched.add(edge.from)
    touched.add(edge.to)
  }
  return Object.keys(graph.nodes).filter(id => !touched.has(id)).sort()
}

describe('EP graph isolated nodes', () => {
  /** Nodes nothing can read. Not gaps — see the file comment. */
  const TERMINAL = new Set(['display.eDamage.authorDisclaimer'])

  it('counts terminal nodes apart from unwired ones', () => {
    // A drawing cannot be referenced by a formula. Counting it as outstanding
    // work would mean the ceiling can never reach zero and nobody could tell
    // whether that was progress stalling or arithmetic.
    const isolated = isolatedIds()
    for (const id of TERMINAL) {
      expect(isolated, `${id} should still be isolated`).toContain(id)
    }
    const unwired = isolated.filter(id => !TERMINAL.has(id))
    expect(unwired.length).toBe(isolated.length - TERMINAL.size)
  })

  it('never has more isolated nodes than today', () => {
    // Lower this when edges are added. Raising it means a node was added
    // without recording what reads it, which is the state this test exists to
    // stop becoming permanent.
    expect(isolatedIds().length).toBeLessThanOrEqual(ISOLATED_CEILING)
  })

  it('has no isolated node that another node already depends on', () => {
    // A contradiction check rather than a count: if anything reads a cell, the
    // node for that cell cannot be isolated. Catches an edge added with a
    // mistyped endpoint, which otherwise leaves both nodes looking unconnected.
    const graph = loadEpGraph()
    const isolated = new Set(isolatedIds())
    for (const edge of graph.edges) {
      expect(isolated.has(edge.from), `${edge.id} from`).toBe(false)
      expect(isolated.has(edge.to), `${edge.id} to`).toBe(false)
    }
  })

  it('keeps the wired heart of each tab connected', () => {
    // The controls that drive the most: Run Type gates seven weapons and drives
    // five presets; the module preset feeds every UW substat. If either goes
    // isolated, something structural broke rather than a leaf being dropped.
    const isolated = new Set(isolatedIds())
    for (const id of [
      'control.eDamage.runType',
      'display.eDamage.presetModules',
      'control.eEcon.cardsMaster',
      'control.eHP.cardsMaster',
      'stat.eDamage.assistEffectiveness',
    ]) {
      expect(isolated.has(id), id).toBe(false)
    }
  })

  it('records where each unwired node was searched for', () => {
    // The rule this enforces: a thing is used, or it is EXPLAINED - never
    // neither. An isolated node with no note is indistinguishable from one
    // nobody has got to yet, and that ambiguity is what let 41 of them sit.
    //
    // Deliberately a substring of prose rather than a flag: the note has to
    // name the bands actually read, and a boolean field could be set without
    // reading anything.
    const graph = loadEpGraph()
    const unexplained = isolatedIds()
      .filter(id => !TERMINAL.has(id))
      .filter(id => !graph.nodes[id]?.traps.some(t => t.note.includes('Consumer not located')))
    expect(unexplained).toEqual([])
  })

  // REMOVED: "every isolated node still carries provenance".
  //
  // It could not fail. The node schema refines on provenance, so a node with no
  // source cell makes the whole graph unloadable — planting one produced a
  // LOAD-FAIL, not a failed assertion. The check was restating Zod, and a test
  // whose only failure mode is "nothing loads" tells you nothing about the
  // thing it names.
})

describe('Ignore Lab Target Levels', () => {
  const graph = loadEpGraph()

  it('blanks the target rather than raising it', () => {
    // The whole BF column is =IF($AZ$15, , IDS_LAB_TARGET(...)). A model that
    // reads the control as "use a very large target" tests something different
    // from the sheet, which tests against an EMPTY cell.
    const node = graph.nodes['stat.eEcon.labTargetLevel']
    expect(node?.traps.some(t => t.note.includes('BLANKS'))).toBe(true)

    const reads = graph.edges
      .filter(e => e.from === 'stat.eEcon.labTargetLevel' && e.kind === 'reads')
      .map(e => e.to)
    expect(reads).toContain('control.eEcon.ignoreLabTargetLevels')
  })

  it('does not remove the second ceiling', () => {
    // EPG_LEVEL_CHECK takes $BF$33 and $BG$33. Only BF is blanked; BG is a hard
    // cap the control never touches, so "ignore targets" is not "no limits".
    const node = graph.nodes['stat.eEcon.labTargetLevel']
    expect(node?.traps.some(t => t.note.includes('$BG$33'))).toBe(true)
  })

  it('takes the switch directly where the lab version blanks a cell', () => {
    // The two controls read the same to a player and differently to the sheet.
    // Labs: BF is =IF($AZ$15, , IDS_LAB_TARGET(...)) — the TARGET is blanked.
    // UW:   EPG_UW_TARGET_LEVEL(level, uw, stat, AZ18) — the SWITCH is passed.
    // A port that models one after the other gets the ignore semantics wrong on
    // whichever it copied.
    const reads = graph.edges
      .filter(e => e.to === 'control.eEcon.ignoreUwTargetLevels')
      .map(e => e.from)
    expect(reads).toContain('hide.eEconStones.uwTargetColumn')

    const node = graph.nodes['hide.eEconStones.uwTargetColumn']
    expect(node?.formula).toContain('EPG_UW_TARGET_LEVEL')
    expect(node?.formula).toContain('AZ18')
  })
})

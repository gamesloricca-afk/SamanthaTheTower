import { describe, expect, it } from 'vitest'

import {
  EP_CONTROL_SURFACE_SHEET_VERSION,
  EP_VISIBLE_TABS,
  epPlayerVisibleRowCount,
  epControlsOutsidePanelColumn,
  epMirroredControls,
  epConditionalLabelControls,
  epControlDisplayName,
  EP_WIRED_CONTROL_CELLS,
  epControlCoverage,
  epControlRows,
  epReportedControlCounts,
  epUnwiredControls,
} from '../../../src/mechanics/ep-controls'

/**
 * The EP control surface, and the size of the gap in the port.
 *
 * The counts below are the numbers `inspect_tab_ui` reported for each tab at
 * capture time. They are written out because the capture is a transcription,
 * and a transcription that is only ever compared to itself proves nothing — if
 * a row were dropped while writing the JSON, the totals would simply be smaller
 * and every derived figure would agree with them.
 */
const TOOL_REPORTED_ROWS = {
  eEcon: 46,
  eHP: 32,
  eRegen: 32,
  eDamage: 65,
} as const

describe('EP control surface', () => {
  it('transcribed every row the sheet tooling reported', () => {
    // Discovered rows are excluded on both sides. `inspect_tab_ui` reads ONE
    // value column per tab, so a row carrying two controls is reported once --
    // eDamage row 23 holds AU23 (Ignore Lab Target Levels) and AY23 (Ignore UW
    // Target Levels). On v5.10 the Lab value lives in AU and the UW value in AY,
    // so the tool's AY read is the UW control and Lab must be discovered.
    const discovered = epControlRows().filter(row => row.discoveredBy)
    expect(discovered.map(row => `${row.tab}!${row.cell}`)).toEqual(['eDamage!AU23'])

    const coverage = Object.fromEntries(epControlCoverage().map(c => [
      c.tab,
      c.total - discovered.filter(row => row.tab === c.tab).length,
    ]))
    expect(coverage).toEqual(TOOL_REPORTED_ROWS)

    // And the capture agrees with itself about what it was told.
    expect(epReportedControlCounts()).toEqual(TOOL_REPORTED_ROWS)
  })

  it('wires at least as many panel rows as it does today', () => {
    // A RATCHET. Wiring a control in ep-graph raises this on its own, because
    // the wired set is derived from the graph rather than listed. Raise the
    // floor when it grows; a fall means a control node was removed or a cell
    // drifted off its row.
    //
    // LOWERED ONCE, from 53, and the reason matters: eleven eRegen "controls"
    // turned out to be a spilled mirror of eHP. Unwiring them is a correction,
    // not a regression, and the floor had to follow. Lowering it to make a
    // change pass would be the opposite, so the reason belongs here rather
    // than only in a commit message.
    const WIRED_FLOOR = 69

    const rows = epControlRows()
    const wired = rows.filter(row => row.wired)

    expect(rows.length).toBe(176)
    expect(wired.length).toBe(EP_WIRED_CONTROL_CELLS.length)
    expect(wired.length).toBeGreaterThanOrEqual(WIRED_FLOOR)
  })

  it('covers every tab that has controls of its own', () => {
    // eRegen is excluded because it HAS none: its panel is a spilled mirror of
    // eHP. Asserting per-tab still stops the total hiding a real tab going to
    // zero, but the premise that every tab needs coverage was wrong.
    for (const tab of epControlCoverage()) {
      if (tab.tab === 'eRegen') {
        expect(tab.wired, tab.tab).toBe(0)
        continue
      }
      expect(tab.wired, tab.tab).toBeGreaterThan(0)
    }
  })

  it('marks the whole eRegen panel as mirrored, not as unwired work', () => {
    const mirrored = epMirroredControls()
    expect(mirrored.length).toBe(32)
    expect(mirrored.every(row => row.tab === 'eRegen')).toBe(true)
    expect(mirrored.every(row => row.mirroredFrom === 'eHP')).toBe(true)
    expect(epUnwiredControls().some(row => row.mirroredFrom)).toBe(false)
  })

  it('every wired cell matches a row that exists', () => {
    // Guards the wired list against the row drift the sheet warns about: if a
    // control moves rows in a later version, its cell stops matching and this
    // fails rather than silently dropping the wiring.
    const cells = new Set(epControlRows().map(row => `${row.tab}!${row.cell}`))
    for (const cell of EP_WIRED_CONTROL_CELLS) {
      expect(cells.has(cell), cell).toBe(true)
    }
  })

  it('names the unwired controls rather than counting them', () => {
    // The work remaining, addressable one row at a time. A CEILING rather than
    // a floor: this only ever goes down, and lowering it is how the port gets
    // finished. Raising it would mean a control stopped being modelled.
    const unwired = epUnwiredControls()

    // What is left is per-card and per-perk Active rows on the tabs where they
    // have NOT been formula-read. eEcon's turned out to be formulas rather than
    // toggles, so the rest are suspect until read rather than assumed to be
    // mechanical.
    // NOTHING is left. Every panel row is now a modelled cell, a mirror, a
    // computed display, a column header, or a value the capture could not read.
    // The assertion is `toBe(0)` rather than a ceiling because a row appearing
    // here again means the sheet changed or a node was lost — either way
    // something to look at, not a number to nudge.
    expect(unwired.length).toBe(0)

    for (const row of unwired) {
      expect(row.label.length, `${row.tab}!${row.cell}`).toBeGreaterThan(0)
    }
  })

  it('models every named User Specific Guess on every planner tab', () => {
    // These are the inputs that change an answer rather than pick a preset, and
    // they were the ones missing. Named individually so a tab losing one is a
    // failure rather than a smaller total.
    const wired = new Set(epControlRows().filter(row => row.wired).map(row => `${row.tab}!${row.cell}`))

    // eRegen is absent on purpose: its Guesses are eHP's, shown through a
    // mirror, and listing them here would count the same three controls twice.
    // The preset selectors are absent for a different reason — they are not
    // controls at all, see `preset selectors are spills` below.
    for (const cell of [
      'eHP!AY10', 'eHP!AY11', 'eHP!AY12',
      'eDamage!AY22', 'eDamage!AY23',
      'eEcon!AZ12', 'eEcon!AZ13',
    ]) {
      expect(wired.has(cell), cell).toBe(true)
    }
  })

  it('keeps value-unknown rows out of the unwired work list', () => {
    // A row that read back null may be a section header or an empty control.
    // The capture cannot tell, so those are excluded from the work list rather
    // than counted as controls nobody wired.
    const rows = epControlRows()
    const unknown = rows.filter(row => row.valueUnknown)

    expect(unknown.length).toBeGreaterThan(0)
    expect(unknown.some(row => String(row.label).replace(/ ?🔗$/, '') === 'PRESETS')).toBe(true)
    expect(epUnwiredControls().some(row => row.valueUnknown)).toBe(false)
    // Every row lands in exactly one bucket, and the buckets are checked to be
    // disjoint rather than assumed: an earlier version double counted a row
    // that was both mirrored and value-unknown.
    const bucket = (row: { wired: boolean, valueUnknown: boolean, isComputedDisplay?: boolean, mirroredFrom?: string, isHeader?: boolean }) =>
      row.wired ? 'wired'
        : row.mirroredFrom ? 'mirrored'
          : row.isHeader ? 'header'
            : row.valueUnknown ? 'unknown'
              : row.isComputedDisplay ? 'display' : 'unwired'
    const counts = new Map<string, number>()
    for (const row of rows) counts.set(bucket(row), (counts.get(bucket(row)) ?? 0) + 1)

    expect([...counts.values()].reduce((sum, n) => sum + n, 0)).toBe(rows.length)
    expect(counts.get('unwired') ?? 0).toBe(epUnwiredControls().length)

    // Every remaining unknown is a section header or a computed display. The
    // sixteen that turned out to be controls in another column are resolved,
    // and this is what stops them sliding back into the unknown pile.
    expect(unknown.length).toBeLessThanOrEqual(22)
  })

  it('records the sheet version, because the rows drift between them', () => {
    expect(EP_CONTROL_SURFACE_SHEET_VERSION).toMatch(/^v\d+\.\d+\.\d+/)
  })

  it('resolves the ten eDamage labels that are placeholders', () => {
    // Each of these label cells is an IF that shows the real name once the
    // prerequisite is owned. A demo account records `// Unlock SM //`; a WC
    // seeded with a real IDS records the unlocked spelling as `label` while
    // `labelWhenUnlocked` still names the control.
    const conditional = epConditionalLabelControls()

    expect(conditional.length).toBe(10)
    expect(conditional.every(row => row.tab === 'eDamage')).toBe(true)

    for (const row of conditional) {
      expect(row.labelWhenUnlocked, row.cell).toBeTruthy()
      expect(row.labelWhenUnlocked?.startsWith('//'), row.cell).toBe(false)
      expect(row.unlockCondition, row.cell).toBeTruthy()
      if (row.label.startsWith('//')) {
        expect(epControlDisplayName(row)).toBe(row.labelWhenUnlocked)
      } else {
        expect(
          row.label === row.labelWhenUnlocked
          || row.label.startsWith(row.labelWhenUnlocked!),
          `${row.cell}: unlocked label should match labelWhenUnlocked`,
        ).toBe(true)
        expect(epControlDisplayName(row)).toBe(row.labelWhenUnlocked)
      }
    }

    // One of them is a control eEcon also carries, which is why resolving the
    // labels matters beyond tidiness: unresolved, the two look unrelated.
    expect(conditional.map(row => row.labelWhenUnlocked))
      .toContain('Boss spawns every # of waves')
  })

  it('marks the two whose value is computed rather than entered', () => {
    // AY28 and AY37 compute their value from the same condition that sets the
    // label, so the captured number is a default for this account. Wiring them
    // as free inputs would invent a control the sheet does not offer.
    const computed = epControlRows().filter(row => row.valueIsComputed)

    expect(computed.map(row => row.cell).sort()).toEqual(['AY28', 'AY37'])
  })

  it('falls back to the captured label when there is nothing to resolve', () => {
    const plain = epControlRows().find(row => row.label === 'Game Speed')
    expect(plain).toBeTruthy()
    expect(epControlDisplayName(plain!)).toBe('Game Speed')
  })

  it('finds the controls the panel column cannot see', () => {
    // `inspect_tab_ui` reads one value column per tab. Eighteen controls live
    // elsewhere on v5.10 — seventeen in AX (preset selectors on three tabs,
    // plus eDamage Run Type and Simulated Tier) and AU23 for Ignore Lab.
    const outside = epControlsOutsidePanelColumn()

    expect(outside.length).toBe(18)
    expect(outside.filter(row => row.valueColumn === 'AX')).toHaveLength(17)
    expect(outside.filter(row => row.valueColumn === 'AU').map(row => `${row.tab}!${row.cell}`))
      .toEqual(['eDamage!AU23'])
    // eRegen's four are mirrored rather than wired, which is why this is not
    // "every one of them is modelled".
    expect(outside.every(row => row.wired || row.mirroredFrom)).toBe(true)
    expect(new Set(outside.map(row => row.tab))).toEqual(new Set(['eHP', 'eRegen', 'eDamage']))

    // eEcon keeps its controls in its own panel column, which is why it was the
    // only tab that looked complete.
    expect(outside.some(row => row.tab === 'eEcon')).toBe(false)
  })

  it('does not assume the tabs are laid out alike', () => {
    // eHP puts a value in the PRESETS master row; eRegen leaves it a header.
    // Inferring eRegen from eHP would have invented a control.
    const presetRow = (tab: string) => epControlRows()
      .find(row => row.tab === tab && row.row === 3)

    expect(presetRow('eHP')?.value).toBe('Farming')
    expect(presetRow('eRegen')?.value).toBeNull()
    expect(presetRow('eHP')?.wired).toBe(true)
    expect(presetRow('eRegen')?.wired).toBe(false)
  })

  it('keeps the eDamage damage-share block out of the work list', () => {
    // Rows 3-10 are formulas showing the damage split, not controls.
    const displays = epControlRows().filter(row => row.isComputedDisplay)
    const byTab = displays.reduce<Record<string, number>>((acc, row) => {
      acc[row.tab] = (acc[row.tab] ?? 0) + 1
      return acc
    }, {})

    // eDamage's damage-share block, plus eEcon's card and perk Active columns,
    // which read as toggles and are formulas over the presets.
    expect(byTab).toEqual({ eDamage: 36, eEcon: 17, eHP: 16 })
    expect(displays.map(row => row.label)).toContain('Bullet Damage %')
    expect(epUnwiredControls().some(row => row.isComputedDisplay)).toBe(false)
  })

  it('models the preset selectors as spills, not as dropdowns', () => {
    // eHP AX3:AX7 and eDamage AX12:AX16 look like five preset dropdowns each.
    // They are spill results: the formula sits one column left in AW as
    // `={"", IDS_PRESET_PRESET(...)}` and spills two cells. A value read shows
    // a preset name; a formula read of the AX cell shows nothing.
    const rows = epControlRows()
    for (const [tab, cells] of [
      ['eHP', ['AX3', 'AX4', 'AX5', 'AX6', 'AX7']],
      ['eDamage', ['AX12', 'AX13', 'AX14', 'AX15', 'AX16']],
    ] as const) {
      for (const cell of cells) {
        const row = rows.find(r => r.tab === tab && r.cell === cell)
        expect(row, `${tab}!${cell}`).toBeTruthy()
        expect(row?.wired, `${tab}!${cell}`).toBe(true)
      }
    }
  })
})

describe('tab visibility', () => {
  it('records eRegen as hidden, which is why it can be a mirror', () => {
    // Read from the workbook's rendered tab bar. Nothing in sheet_info or
    // inspect_tab_ui carries this: both list all thirty tabs unmarked, and
    // inspect_tab_ui accepts eRegen as a planner tab.
    const coverage = epControlCoverage()
    const eRegen = coverage.find(tab => tab.tab === 'eRegen')
    expect(eRegen?.playerVisible).toBe(false)

    for (const tab of coverage.filter(entry => entry.tab !== 'eRegen')) {
      expect(tab.playerVisible, tab.tab).toBe(true)
    }
  })

  it('counts the player-facing surface separately from the total', () => {
    // 32 of the 176 panel rows belong to a tab nobody can open. Quoting 176 as
    // the surface a player configures overstates it by those rows.
    expect(epControlRows().length).toBe(176)
    // 144, not 143: eDamage row 23 carries a second checkbox that
    // `inspect_tab_ui` could not see. Found by reading formulas, not by
    // re-running the capture.
    expect(epPlayerVisibleRowCount()).toBe(144)
  })

  it('lists the visible tabs, and they are the minority', () => {
    expect(EP_VISIBLE_TABS).toContain('eEcon')
    expect(EP_VISIBLE_TABS).not.toContain('eRegen')
    expect(EP_VISIBLE_TABS).not.toContain('_IDS')
    // 6 of 31 on v5.10.02 — Master Sheet is hidden; companions and DVT stay hidden.
    expect(EP_VISIBLE_TABS.length).toBe(6)
    expect(EP_VISIBLE_TABS).toEqual([
      'Home Page', 'IDS', 'Giveaways', 'eHP', 'eDamage', 'eEcon',
    ])
  })
})

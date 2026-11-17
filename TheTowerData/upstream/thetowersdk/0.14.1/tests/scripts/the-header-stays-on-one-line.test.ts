import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { SITE } from '../helpers/paths'

/**
 * The header is one row, and the creator code is always in it.
 *
 * Both rules had already been broken at once, and neither broke anything a check could see.
 *
 * `flex-wrap` is the dangerous half. It does not overflow when the bar runs out of room — it
 * relieves the pressure by dropping the nav onto a second row, so the header silently doubles in
 * height somewhere between the breakpoints. Nothing errors, nothing overflows, the page still
 * renders, and the only evidence is that it looks wrong at widths nobody screenshots. `flex-nowrap`
 * converts the same condition into an overflow, which is visible.
 *
 * The second half: the badge used to be `hidden md:flex` with a duplicate copy inside the mobile
 * menu. So on a phone the creator code did not exist until the reader opened a nav they had no
 * reason to open. Every other control in that bar has something behind it — a nav link has the page
 * it points at — but a creator code the reader never sees does nothing at all, which makes hiding
 * it the one change here with a real cost.
 *
 * This is a static read rather than a render. It cannot tell you the bar LOOKS right; the widths
 * were measured in a browser when it was written (34px tall and no overlap from 320px to 1440px).
 * What it can do is notice the two specific edits that would undo that, which is what a guard is
 * for.
 */

const HEADER = path.join(SITE, 'src', 'lib', 'ui', 'SiteHeader.svelte')

describe.skipIf(!existsSync(HEADER))('the site header stays on one line', () => {
  const source = readFileSync(HEADER, 'utf8')

  /** The markup only — the docblock above it discusses `flex-wrap` by name. */
  const markup = source.slice(source.indexOf('<header'))

  it('never lets the bar wrap', () => {
    const wrapping = [...markup.matchAll(/class="[^"]*\bflex-wrap\b[^"]*"/g)].map(m => m[0])

    expect(
      wrapping,
      'flex-wrap hides an overflow by silently doubling the header height — use flex-nowrap',
    ).toEqual([])
  })

  it('keeps the creator code in the bar at every width', () => {
    /*
     * One instance, and it must sit above the collapsible block. Two instances is the shape the
     * bug had: a hidden one in the bar and a real one in the menu.
     */
    const uses = [...markup.matchAll(/<CreatorCode\b/g)]
    expect(uses, 'exactly one creator code — a second copy means it moved into the menu').toHaveLength(1)

    const collapsible = markup.indexOf('{#if open}')
    expect(collapsible, 'expected a collapsible mobile menu to check against').toBeGreaterThan(-1)
    expect(
      uses[0].index,
      'the creator code is inside the mobile menu — it must stay in the bar',
    ).toBeLessThan(collapsible)
  })

  it('does not hide the creator code below a breakpoint', () => {
    /*
     * `hidden md:flex` on the badge's own wrapper is exactly how it disappeared on phones. The
     * wordmark's TEXT may still be hidden — that is the column that is supposed to yield first.
     */
    const wrapper = markup.slice(0, markup.indexOf('<CreatorCode'))
    const enclosing = wrapper.lastIndexOf('<div')
    const attrs = wrapper.slice(enclosing)

    expect(
      /\bhidden\b/.test(attrs),
      'the creator code is behind a breakpoint; it must render at every width',
    ).toBe(false)
  })
})

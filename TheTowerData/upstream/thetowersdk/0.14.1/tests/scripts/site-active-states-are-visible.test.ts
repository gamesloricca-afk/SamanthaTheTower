import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { SITE as SITE_ROOT } from '../helpers/paths'

/**
 * An active state has to be visible, not merely applied.
 *
 * `layout.css` sets `a { color: var(--color-accent) }`. A bare element selector in a global
 * stylesheet outranks a single utility class, so the docs contents list rendered
 * `text-accent` and `text-muted` as the same colour: every entry looked identical, and the
 * highlight for the section being read was invisible.
 *
 * The code was correct throughout. Two browser checks asserted that the class was on the right
 * element and passed while nothing on screen changed — which is the difference between testing
 * what the code does and testing what a reader sees, and is why this file exists.
 *
 * It reads the stylesheet rather than a browser, so it cannot prove a colour reaches the screen.
 * What it can prove is that the rule which lost is not the one being relied on again.
 */
const SITE = path.join(SITE_ROOT, 'src')
const LAYOUT = path.join(SITE, 'routes/docs/+layout.svelte')
const GLOBAL_CSS = path.join(SITE, 'routes/layout.css')

describe.skipIf(!existsSync(LAYOUT))('the docs contents highlight can be seen', () => {
  const layout = readFileSync(LAYOUT, 'utf8')

  it('still has the global rule that defeats a utility class', () => {
    /*
     * If this ever goes away the reasoning below stops applying, and whoever removes it should
     * find out here rather than by rediscovering the bug.
     */
    const css = readFileSync(GLOBAL_CSS, 'utf8')
    expect(css).toMatch(/\ba\s*\{[^}]*color:\s*var\(--color-accent\)/)
  })

  it('does not colour the active entry with a bare utility class', () => {
    /*
     * The markup only. The first `doc-subnav` in the file is a selector string in the script, so
     * slicing from there swept in the toggle's own label and the test failed on the wrong element.
     */
    const listStart = layout.indexOf('<ul class="doc-subnav">')
    const subnavMarkup = layout.slice(listStart, layout.indexOf('</ul>', listStart))
    expect(listStart, 'the subnav list markup moved or was renamed').toBeGreaterThan(-1)
    expect(
      subnavMarkup.includes('text-accent'),
      'A single utility class loses to `a { color }` — the highlight renders identical to every '
      + 'other entry. Style it in the component, where the selector is two classes deep.',
    ).toBe(false)
  })

  it('styles the active entry with a selector that outranks the element rule', () => {
    /* Two classes beats one element selector, so this wins regardless of stylesheet order. */
    expect(layout).toMatch(/\.doc-subnav\s+\.doc-subnav-link\.is-active\s*\{/)
  })

  it('distinguishes the active entry by more than colour alone', () => {
    /*
     * Colour is the first thing lost to a theme change, a filter, or simply being read quickly on
     * a dim screen — so the current section carries weight and a marker as well.
     */
    const rule = layout.slice(layout.indexOf('.doc-subnav .doc-subnav-link.is-active'))
    const block = rule.slice(0, rule.indexOf('}'))

    expect(block).toMatch(/font-weight/)
    expect(block).toMatch(/background|box-shadow/)
  })
})

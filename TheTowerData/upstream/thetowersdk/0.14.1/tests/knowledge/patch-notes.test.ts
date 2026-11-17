import { describe, expect, it } from 'vitest'
import {
  PATCH_NOTES,
  PATCH_NOTES_SOURCE,
  patchNoteVersions,
  patchNotesBetween,
  patchNotesForVersion,
  recentPatchNotes,
  searchPatchNotes,
  whenIntroduced,
} from '../../src/knowledge/history/patch-notes'

/**
 * The patch-note archive, and the two ways reading it went wrong.
 *
 * Both produced a confident wrong answer rather than a visible failure, which is the only kind
 * of bug this dataset can really have: nobody checks a date they were told.
 */

describe('the patch-note archive', () => {
  it('spans the real history, not the day it was forwarded', () => {
    /*
     * 176 of these were forwarded into the channel on one afternoon in 2025. Dating by the
     * message timestamp collapsed four years onto that day; the snapshot carries the original.
     */
    expect(PATCH_NOTES.length).toBeGreaterThan(200)
    expect(PATCH_NOTES[0].postedAt.slice(0, 4)).toBe('2021')
    expect(PATCH_NOTES_SOURCE.earliest < PATCH_NOTES_SOURCE.latest).toBe(true)
  })

  it('is ordered oldest first', () => {
    const dates = PATCH_NOTES.map(note => note.postedAt)
    expect([...dates].sort()).toEqual(dates)
  })

  it('never files a note under a version that does not exist', () => {
    /*
     * `\bv?(\d+\.\d+…)` is case-sensitive, so "V26.1.2" did not match at the capital V, and with
     * no word boundary between `V` and `2` the match began mid-number and returned `1.2`. Real
     * versions here are 0.x through 28.x.
     */
    const impossible = PATCH_NOTES
      .filter(note => note.version)
      .filter(note => !/^(0|[1-9]|1[0-9]|2[0-9])\./.test(note.version!))
    expect(
      impossible.map(note => `${note.version} — ${note.title}`),
      'a version outside 0.x–29.x means the number was cut out of the middle of something',
    ).toEqual([])
  })

  it('does not mistake a multiplier for a version', () => {
    // "x1.05" in the opening of a note about a new card filed it under v1.05.
    const cells = PATCH_NOTES.find(note => note.body.startsWith('# New Card - Cells'))
    expect(cells, 'the note this was found on').toBeDefined()
    expect(cells!.version, 'it states no version, so it has none').toBeNull()
  })

  it('reads a capitalised version out of a heading', () => {
    const versions = patchNoteVersions()
    expect(versions).toContain('26.1.2')
    expect(versions).toContain('27.1.4')
  })

  it('does not file a continuation under the next release mentioned in its look-ahead', () => {
    const continuation = PATCH_NOTES.find(note => note.id === '1545083801062088766')
    expect(continuation?.body).toContain('## A Look Ahead')
    expect(continuation?.body).toContain('(v29.1)')
    expect(continuation?.version).toBeNull()
  })

  it('keeps each official source post once, including the separately dated v29.1 announcements', () => {
    expect(new Set(PATCH_NOTES.map(note => note.id)).size).toBe(PATCH_NOTES.length)
    const announcements = patchNotesForVersion('29.1').filter(note => [
      '1559665187181826149',
      '1560299053789749419',
    ].includes(note.id))
    expect(announcements.map(note => note.id)).toEqual([
      '1559665187181826149',
      '1560299053789749419',
    ])
    expect(announcements.map(note => note.postedAt.slice(0, 10))).toEqual([
      '2026-10-13',
      '2026-10-15',
    ])
    expect(PATCH_NOTES_SOURCE.latest >= '2026-10-15T14:31:36.955000+00:00').toBe(true)
    expect(PATCH_NOTES_SOURCE.notes).toBe(PATCH_NOTES.length)
  })

  it('answers when something was introduced, from the developers own words', () => {
    const shockwave = whenIntroduced('shockwave')
    expect(shockwave?.postedAt.slice(0, 10)).toBe('2021-07-15')
    expect(shockwave?.version).toBe('0.1.29')
    expect(shockwave?.body).toContain('Shockwave')
  })

  it('returns null for something never mentioned, rather than a nearest guess', () => {
    expect(whenIntroduced('kumquat trebuchet')).toBeNull()
    expect(searchPatchNotes('kumquat trebuchet')).toEqual([])
  })

  it('searches newest first and finds a term however it was capitalised', () => {
    const hits = searchPatchNotes('GOLDEN TOWER')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].postedAt >= hits[hits.length - 1].postedAt).toBe(true)
  })

  it('selects by version and by date range', () => {
    const version = patchNoteVersions().find(v => patchNotesForVersion(v).length > 0)!
    expect(patchNotesForVersion(version).every(note => note.version === version)).toBe(true)
    // The `v` prefix a player would type is accepted.
    expect(patchNotesForVersion(`v${version}`)).toEqual(patchNotesForVersion(version))

    const ranged = patchNotesBetween('2024-01-01', '2024-12-31')
    expect(ranged.length).toBeGreaterThan(0)
    expect(ranged.every(note => note.postedAt >= '2024' && note.postedAt < '2025')).toBe(true)
  })

  it('every note is traceable back to the post it came from', () => {
    expect(PATCH_NOTES.every(note => /^\d{17,20}$/.test(note.id))).toBe(true)
    expect(PATCH_NOTES_SOURCE.channelId).toMatch(/^\d+$/)
  })

  it('recent notes are the newest ones', () => {
    const recent = recentPatchNotes(3)
    expect(recent).toHaveLength(3)
    expect(recent[0].postedAt).toBe(PATCH_NOTES[PATCH_NOTES.length - 1].postedAt)
  })
})

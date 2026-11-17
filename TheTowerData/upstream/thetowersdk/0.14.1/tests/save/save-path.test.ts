import { describe, expect, it } from 'vitest'

import {
  isMisplacedAndroidDataPlayerInfoPath,
  looksLikeMisplacedParentPlayerInfoContent,
} from '../../src/save/access/path'

/*
 * Which copy of the save a player picked is save-format knowledge, and stays here. The warning a
 * page shows about it is the platform layer's `detectMisplacedPlayerInfoSave`, tested there.
 */

describe('player-info-save-path', () => {
  it('flags Android/data package-root playerInfo.dat', () => {
    expect(
      isMisplacedAndroidDataPlayerInfoPath(
        '/storage/emulated/0/Android/data/com.TechTreeGames.TheTower/playerInfo.dat',
      ),
    ).toBe(true)
    expect(
      isMisplacedAndroidDataPlayerInfoPath(
        'C:\\Users\\x\\Android\\data\\com.TechTreeGames.TheTower\\playerInfo.dat',
      ),
    ).toBe(true)
  })

  it('accepts the files/playerInfo.dat copy', () => {
    expect(
      isMisplacedAndroidDataPlayerInfoPath(
        '/storage/emulated/0/Android/data/com.TechTreeGames.TheTower/files/playerInfo.dat',
      ),
    ).toBe(false)
    expect(
      isMisplacedAndroidDataPlayerInfoPath('com.TechTreeGames.TheTower/files/playerInfo.dat'),
    ).toBe(false)
  })

  it('flags folder-picker relative paths under the package folder', () => {
    expect(isMisplacedAndroidDataPlayerInfoPath('com.TechTreeGames.TheTower/playerInfo.dat')).toBe(true)
    expect(isMisplacedAndroidDataPlayerInfoPath('Downloads/playerInfo.dat')).toBe(false)
  })

  it('recognises the parent-folder copy by its content: uncompressed, with no battle history', () => {
    expect(
      looksLikeMisplacedParentPlayerInfoContent({ recordCount: 3, strings: ['x'] }, { wasGzip: false }),
    ).toBe(true)
    expect(
      looksLikeMisplacedParentPlayerInfoContent({ recordCount: 3, strings: ['x'] }, { wasGzip: true }),
    ).toBe(false)
  })
})

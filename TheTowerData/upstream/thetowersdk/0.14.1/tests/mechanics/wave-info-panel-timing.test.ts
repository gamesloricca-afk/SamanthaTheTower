import { describe, expect, it } from 'vitest'

import {

  UPTIME_WAVE_INTER_COOLDOWN_AT_MAX_WA_SECONDS,

} from '../../src/mechanics/uptime/compute'

import {

  waveInfoPanelWaveCooldownSeconds,

  waveInfoPanelWaveTimeSeconds,

} from '../../src/mechanics/waves/info-panel-timing'


describe('wave-info-panel-timing', () => {

  it('wave combat time is 26s standard / 13s tournament (not WA-modified)', () => {
    expect(waveInfoPanelWaveTimeSeconds({ tournament: false })).toBe(26)
    expect(waveInfoPanelWaveTimeSeconds({ tournament: true })).toBe(13)
  })


  it('wave cooldown without WA uses uptime inter-wave base (~8.7s)', () => {

    expect(waveInfoPanelWaveCooldownSeconds({})).toBeCloseTo(8.696, 2)

  })


  it('WA level 7 floors cooldown at 4s', () => {

    expect(waveInfoPanelWaveCooldownSeconds({ waveAcceleratorLevel: 7 })).toBe(

      UPTIME_WAVE_INTER_COOLDOWN_AT_MAX_WA_SECONDS,

    )

  })


  it('WA level ignored when card not equipped (null level)', () => {
    expect(waveInfoPanelWaveCooldownSeconds({ waveAcceleratorLevel: null })).toBeCloseTo(8.696, 2)
  })

  it('tournament halves inter-wave cooldown after WA reduction', () => {
    const normal = waveInfoPanelWaveCooldownSeconds({ waveAcceleratorLevel: 7, tournament: false })
    const tournament = waveInfoPanelWaveCooldownSeconds({ waveAcceleratorLevel: 7, tournament: true })
    expect(tournament).toBeCloseTo(normal * 0.5, 5)
  })
})

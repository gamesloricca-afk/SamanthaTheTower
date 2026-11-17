import { describe, expect, it } from 'vitest'
import { computeV29VaultDamageBonus, V29_VAULT_DAMAGE_POLICY } from '../../../src/mechanics/vault'

describe('qualified v29 Power damage benefits', () => {
  it('adds 5% per level inside each supported bucket, not a repeated 1.05 multiplier', () => {
    for (const node of ['Damage', 'Ultimate Damage', 'Spotlight Bonus']) {
      for (const level of [0, 3, 5]) {
        const bonus = computeV29VaultDamageBonus(node, level, V29_VAULT_DAMAGE_POLICY)!
        expect(bonus.fraction).toBeCloseTo(level * .05)
        expect(bonus.multiplier).toBeCloseTo(1 + level * .05)
        expect(bonus.nativeParity).toBe(false)
        expect(bonus.sourceUrls).toHaveLength(3)
      }
    }
    expect(computeV29VaultDamageBonus('Damage', 3, V29_VAULT_DAMAGE_POLICY)!.multiplier).not.toBeCloseTo(1.05 ** 3, 5)
  })
  it('refuses unsupported names, Bastion and invalid levels instead of extending the policy', () => {
    for (const node of ['Bastion', 'Health', 'UW Damage', 'dmg']) expect(computeV29VaultDamageBonus(node, 3, V29_VAULT_DAMAGE_POLICY)).toBeNull()
    for (const level of [-1, .5, 6, NaN, Infinity]) expect(computeV29VaultDamageBonus('Damage', level, V29_VAULT_DAMAGE_POLICY)).toBeNull()
  })
  it('exposes weaker Spotlight corroboration explicitly', () => {
    expect(computeV29VaultDamageBonus('Spotlight Bonus', 5, V29_VAULT_DAMAGE_POLICY)!.confidence).toBe('corroborated-community')
    expect(computeV29VaultDamageBonus('Ultimate Damage', 5, V29_VAULT_DAMAGE_POLICY)!.confidence).toBe('direct-community')
  })
})
describe('qualified v29 Free Upgrade benefits', () => {
  it('is a separate three-node relative policy with independently sourced metadata', async () => {
    const m = await import('../../../src/mechanics/vault')
    for (const node of ['Free Attack Upgrade', 'Free Defense Upgrade', 'Free Utility Upgrade']) {
      const benefit = m.computeV29VaultFreeUpgradeBonus(node, 3, m.V29_VAULT_FREE_UPGRADE_POLICY)!
      expect(benefit.fraction).toBeCloseTo(.15)
      expect(benefit.multiplier).toBeCloseTo(1.15)
      expect(benefit.sourceUrls).toHaveLength(2)
      expect(benefit.confidence).toBe('direct-player-measurement')
      expect(benefit.nativeParity).toBe(false)
      expect(m.computeV29VaultDamageBonus(node, 3, m.V29_VAULT_DAMAGE_POLICY)).toBeNull()
    }
    for (const node of ['Damage', 'Bastion', 'Free Attack']) expect(m.computeV29VaultFreeUpgradeBonus(node, 3, m.V29_VAULT_FREE_UPGRADE_POLICY)).toBeNull()
    for (const level of [-1, 6, .5, NaN]) expect(m.computeV29VaultFreeUpgradeBonus('Free Attack Upgrade', level, m.V29_VAULT_FREE_UPGRADE_POLICY)).toBeNull()
  })
  it('reproduces the September 2026 independently reported 407.16% chance', async () => {
    const { freeUpgradeChance } = await import('../../../src/mechanics/effective-paths/eecon-stats')
    // Reported (49.5+10+12+12+31.25)% x2.49 x1.25 x1.14 =407.1616875%.
    // SDK assist capacity=(1+stoneCap+labCap)/100: 99+base1 gives exactly 100%.
    const chance = freeUpgradeChance({ workshopValue:.495, hasFreeUpgradesCard:true, cardValue:.1,
      hasPerk:true, standardPerksBonusLabLevel:25, primarySubstat:.12, assistSubstat:.12,
      stoneCap:99, labCap:0, enhancementLevel:149, relicPct:.14, vaultPct:.25 })
    expect(chance * 100).toBeCloseTo(407.1616875, 8)
  })
})
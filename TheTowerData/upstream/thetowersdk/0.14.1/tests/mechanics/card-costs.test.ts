/**
 * Card level upgrade gem costs.
 *
 * Mirrors the shop: each missing copy costs 20 gems. Levels use the cumulative
 * copy table shipped with the game data.
 */
import { describe, expect, it } from 'vitest'
import {
	CARD_LEVEL_COPY_REQUIREMENTS,
	cardLevelCopiesRequired,
	cardLevelUpgradeGemCost
} from '../../src/mechanics/cards/costs'

describe('cardLevelUpgradeGemCost', () => {
	it('prices a single level step from the copy table', () => {
		// Level 0→1 needs 1 copy → 20 gems
		expect(cardLevelUpgradeGemCost(0, 1)).toBe(20)
		// Level 3→4 needs 16-8=8 copies → 160 gems
		expect(cardLevelUpgradeGemCost(3, 4)).toBe(160)
	})

	it('sums across multiple levels', () => {
		expect(cardLevelUpgradeGemCost(0, 7)).toBe(80 * 20)
	})

	it('exposes cumulative copy requirements', () => {
		expect(CARD_LEVEL_COPY_REQUIREMENTS).toHaveLength(8)
		expect(cardLevelCopiesRequired(5)).toBe(28)
	})
})

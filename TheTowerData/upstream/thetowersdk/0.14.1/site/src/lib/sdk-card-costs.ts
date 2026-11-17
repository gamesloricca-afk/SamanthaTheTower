/**
 * Card gem costs — same numbers as `thetowersdk/mechanics` (`card-costs`).
 * Demo runtime stays self-contained: Vite SSR cannot reliably surface CJS
 * `__exportStar` / default interop for this package entry. Apps should still:
 *   import { cardLevelUpgradeGemCost } from 'thetowersdk/mechanics'
 */
export const CARD_LEVEL_COPY_REQUIREMENTS = [0, 1, 3, 8, 16, 28, 48, 80] as const;

const GEM_PER_COPY = 20;

function clampCardLevel(level: number): number {
	if (!Number.isFinite(level)) return 0;
	return Math.max(0, Math.min(7, Math.floor(level)));
}

/** Gems to upgrade a card from `fromGameLevel` to `toGameLevel`. */
export function cardLevelUpgradeGemCost(fromGameLevel: number, toGameLevel: number): number {
	const fromIdx = clampCardLevel(fromGameLevel);
	const toIdx = clampCardLevel(toGameLevel);
	if (toIdx <= fromIdx) return 0;
	const copies = CARD_LEVEL_COPY_REQUIREMENTS[toIdx] - CARD_LEVEL_COPY_REQUIREMENTS[fromIdx];
	return copies * GEM_PER_COPY;
}

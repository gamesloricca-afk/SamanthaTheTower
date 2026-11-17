/** In-game Player IDs are numeric strings shown in The Tower settings. */
const PLAYER_ID_PATTERN = /^\d{6,16}$/;

export function normalizePlayerId(raw: string): string {
	return raw.replace(/\s+/g, '').trim();
}

export function isValidPlayerId(raw: string): boolean {
	const id = normalizePlayerId(raw);
	return PLAYER_ID_PATTERN.test(id) && !/^0+$/.test(id);
}

export function playerIdHint(raw: string): string | null {
	const id = normalizePlayerId(raw);
	if (!id) return null;
	if (!/^\d+$/.test(id)) return 'Player IDs are digits only — copy it from The Tower settings.';
	if (id.length < 6) return 'That looks short. In-game Player IDs are usually 6–16 digits.';
	if (id.length > 16) return 'That looks long. Double-check the ID from Settings.';
	if (/^0+$/.test(id)) return 'That is not a real Player ID.';
	return null;
}

export function buildLicenseIssueUrl(input: {
	playerId: string;
	github: string;
	repo: string;
}): string {
	const title = `Personal ACS grant — Player ID ${normalizePlayerId(input.playerId)}`;
	const body = [
		'## Personal ACS grant request',
		'',
		`- **Player ID:** \`${normalizePlayerId(input.playerId)}\``,
		`- **GitHub:** ${input.github.trim() || '(required)'}`,
		'',
		'I confirm this is for personal, non-commercial Tower work, bound to this Player ID.',
		'',
		'I understand a grant may be declined for accounts with no meaningful play history.'
	].join('\n');

	const params = new URLSearchParams({ title, body, labels: 'license' });
	return `${input.repo}/issues/new?${params.toString()}`;
}

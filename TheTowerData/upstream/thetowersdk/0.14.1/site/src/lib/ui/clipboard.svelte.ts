import { onDestroy } from 'svelte';

/** Shared copy feedback, including denied permissions and cleanup after navigation. */
export function createClipboardFeedback() {
	let status = $state<'idle' | 'copied' | 'failed'>('idle');
	let timer: ReturnType<typeof setTimeout> | undefined;
	let disposed = false;
	let request = 0;
	onDestroy(() => {
		disposed = true;
		clearTimeout(timer);
	});
	return {
		get status() {
			return status;
		},
		async copy(text: string) {
			const current = ++request;
			clearTimeout(timer);
			try {
				await navigator.clipboard.writeText(text);
				if (disposed || current !== request) return;
				status = 'copied';
			} catch {
				if (disposed || current !== request) return;
				status = 'failed';
			}
			timer = setTimeout(
				() => {
					status = 'idle';
				},
				status === 'failed' ? 5000 : 1400
			);
		}
	};
}

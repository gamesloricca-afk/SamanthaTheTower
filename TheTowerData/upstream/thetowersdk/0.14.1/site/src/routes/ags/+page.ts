import { SHOW_GOVERNANCE } from '$lib/content';

/*
 * ACS is still in development. With the flag off this page is not prerendered at all, so the
 * static build has nothing to serve and the section cannot be found by wandering in — which is
 * the point of gating rather than merely unlinking it.
 */
export const prerender = SHOW_GOVERNANCE;

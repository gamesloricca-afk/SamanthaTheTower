# Agent instructions — the TheTowerSDK documentation site

This site lives in `site/` inside the TheTowerSDK repository. It has its own toolchain
(SvelteKit, its own eslint and prettier, its own lockfile); the SDK's lint and type-check
deliberately skip it, and it is excluded from the published package.

## The server is not yours to start

This repo owns its preview lifecycle. There is exactly **one** server, a detached
Vite HMR supervisor on **port 4173**.

```bash
npm run serve         # idempotent: starts it, or says it is already healthy
npm run serve:status  # check without touching anything
```

Then browse **http://127.0.0.1:4173/**. HMR is on, so an edit is usually visible
without a rebuild.

**Never** run `vite dev`, `vite preview`, `sirv`, `http-server`, or any other
server for this repo, and never pick a different port. The rules are in the
header of `scripts/ensure-preview.mjs`: one port only, never fall back to
4174/4175, never restart a healthy server, never spawn a second one.

> This exists because an agent once started four throwaway previews on
> 4319–4323 while the real server was up on 4173. The user then looked at a
> stale port and reported a completed fix as missing. **A check against a server
> nobody else is using proves nothing.** If a verification seems to contradict an
> edit you just made, confirm the port before touching the code again.

## Content conventions

- **Titles are Title Case** — every word capitalized, including short ones.
- **American spellings** (behavior, normalization, license, math).
- **Objective voice.** Say what a thing is and does. Do not define it by what it
  is not, and do not argue for it.
- **Even section length.** Home-page sections sit around 75–90 words of prose.
  Measure before adding: a section at 200 words needs cutting, not more panels.
- **Branding**: **TowerAI** is the public, package-facing name. _TrackerAI_ is
  the owner's branding for the Run Tracker site — do not use it here.

## Checks

```bash
npm run check   # svelte-check, must be 0 errors
npm run build   # static build
npm run lint    # prettier + eslint
```

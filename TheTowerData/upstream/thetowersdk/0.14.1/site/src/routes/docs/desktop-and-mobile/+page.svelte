<script lang="ts">
	import CodeBlock from '$lib/ui/CodeBlock.svelte';
	import { href } from '$lib/paths';
</script>

<h1 class="text-3xl font-semibold">Desktop and Mobile</h1>
<p class="mt-3 text-muted">
	The package is plain TypeScript with no DOM assumptions, so it runs unchanged in an Electron
	renderer, an Electron main process, and a Capacitor WebView. Nothing here is web-only.
</p>

<h2 class="mt-10 text-xl font-semibold">The One Boundary</h2>
<p class="mt-3 text-muted">
	<code>thetowersdk/node</code> is the only entry point that needs Node, because it is the one that reads
	files. That is the boundary you want anyway: the decoder belongs on the side that is allowed to touch
	the filesystem, and everything else — catalogs, formulas, builders, charts, formatting — runs happily
	in a renderer or a WebView.
</p>
<CodeBlock
	code={`// Renderer or WebView: catalogs and formulas, no filesystem.
import { LAB_CATALOG } from 'thetowersdk/data'
import { computeWaveBaseHealth } from 'thetowersdk/mechanics'

// Main process only: this one reads a file.
import { decodePlayerInfoSaveBytes } from 'thetowersdk/node'`}
/>

<h2 class="mt-10 text-xl font-semibold">Pin The Toolchain</h2>
<p class="mt-3 text-muted">
	Electron and Capacitor builds are sensitive to the toolchain that produced them, so pin it with
	the hash corepack verifies against:
</p>
<CodeBlock
	code={`{
  "packageManager": "pnpm@10.8.1+sha512.c50088ba…",
  "engines": { "node": ">=22 <23" }
}`}
/>

<h2 class="mt-10 text-xl font-semibold">Reading A Save On Each Platform</h2>
<p class="mt-3 text-muted">
	On desktop, the save is a file and <code>thetowersdk/node</code> reads it directly from the main
	process. On mobile, a connected device can hand it over without the player exporting anything —
	see <a class="underline" href={href('/docs/save/')}>Save Files</a> for the whole route, including the
	bridge.
</p>

<h2 class="mt-10 text-xl font-semibold">Further Detail</h2>
<p class="mt-3 text-muted">
	The main/renderer split, the IPC boundary, running the bridge in-process, and what is available on
	mobile are covered in <code>docs/DESKTOP_AND_MOBILE.md</code> in the repository.
</p>

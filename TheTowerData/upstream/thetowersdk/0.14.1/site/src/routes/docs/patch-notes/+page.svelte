<script lang="ts">
	import { sdkFacts } from '$lib/sdk-facts';
	import CodeBlock from '$lib/ui/CodeBlock.svelte';
	import { href } from '$lib/paths';
</script>

<h1 class="text-3xl font-semibold">Patch Notes</h1>
<p class="mt-3 text-muted">
	Five years of the developers' own announcements, in the package and ready to query — {sdkFacts.patchNotes}
	notes from July 2021 onward. The catalogs tell you what a number is; these tell you when it became that,
	and what was said about it at the time. Everything here is a plain function call over data that ships
	with the install, so it works offline and returns the same answer every time.
</p>

<h2 class="mt-10 text-xl font-semibold">The Shape Of A Note</h2>
<p class="mt-3 text-muted">
	Every function on this page returns notes in this shape, so once you can read one you can read all
	of them.
</p>
<div class="mt-4">
	<CodeBlock
		code={`interface PatchNote {
  id: string           // the announcement's own message id
  postedAt: string     // ISO timestamp of the original post
  version: string | null
  kind: 'update' | 'hotfix' | 'bugfix' | 'note'
  title: string
  body: string         // the note as written, in markdown
}`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Find When Something Arrived</h2>
<p class="mt-3 text-muted">
	<code>whenIntroduced</code> walks the archive from the oldest note forward and hands back the first
	one that mentions your term — the announcement where a mechanic first appears.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { whenIntroduced } from 'thetowersdk/knowledge'

const note = whenIntroduced('shockwave')

console.log(note.version)   // '0.1.29'
console.log(note.postedAt)  // '2021-07-15T…'
console.log(note.title)     // 'v0.1.29 is out for everyone now…'`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Search Across Every Note</h2>
<p class="mt-3 text-muted">
	<code>searchPatchNotes</code> matches on title and body and returns newest first, so the top result
	is the most recent time the developers wrote about it. Pass a limit when you only want the latest few.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { searchPatchNotes } from 'thetowersdk/knowledge'

for (const note of searchPatchNotes('guardian', 5)) {
  console.log(\`\${note.postedAt.slice(0, 10)}  \${note.version ?? '—'}  \${note.title}\`)
}`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Read One Version, Or A Date Range</h2>
<p class="mt-3 text-muted">
	<code>patchNotesForVersion</code> takes the version with or without its <code>v</code>, and
	<code>patchNotesBetween</code> takes two ISO dates — useful for "what changed while I was away".
	<code>patchNoteVersions</code> lists every version the archive names, which makes a version picker a
	one-liner.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import {
  patchNotesForVersion,
  patchNotesBetween,
  patchNoteVersions,
  recentPatchNotes
} from 'thetowersdk/knowledge'

patchNotesForVersion('26.1.2')      // 'v26.1.2' works too
patchNotesBetween('2024-01-01', '2024-12-31')
patchNoteVersions()                 // every version named, for a dropdown
recentPatchNotes(5)                 // the latest five, newest first`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Build A Changelog Page</h2>
<p class="mt-3 text-muted">
	Put those together and a browsable archive is a short file. This renders the newest notes with
	their version and date, grouped the way the announcements arrived.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { recentPatchNotes, patchNoteVersions } from 'thetowersdk/knowledge'

const versions = patchNoteVersions()
const latest = recentPatchNotes(20)

const html = latest
  .map(
    (note) => \`
      <article>
        <h3>\${note.title}</h3>
        <p><time datetime="\${note.postedAt}">\${note.postedAt.slice(0, 10)}</time>
           \${note.version ? \` · v\${note.version}\` : ''} · \${note.kind}</p>
        <div>\${note.body}</div>
      </article>\`
  )
  .join('')

console.log(\`\${versions.length} versions covered\`)`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Pair It With The Catalogs</h2>
<p class="mt-3 text-muted">
	The archive is at its best next to the numbers. Show a cost curve from
	<a href={href('/docs/data/')}>the catalogs</a> and the note that changed it, and a reader gets both
	the value and the reason for it in one view.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { LAB_CATALOG } from 'thetowersdk/data'
import { searchPatchNotes } from 'thetowersdk/knowledge'

const lab = LAB_CATALOG.find((entry) => entry.name === 'Attack Speed')
const history = searchPatchNotes(lab.name, 3)

console.log(lab.levels.length, 'levels')
console.log(history.map((note) => note.title))`}
	/>
</div>

<p class="mt-4 text-sm text-muted">
	Each note keeps the id of the announcement it came from, so anything you show can be traced back
	to the original post.
</p>

<p class="mt-8 text-sm">
	<a href={href('/docs/knowledge/')}>Knowledge Graph →</a>
	·
	<a href={href('/docs/data/')}>Catalogs →</a>
</p>

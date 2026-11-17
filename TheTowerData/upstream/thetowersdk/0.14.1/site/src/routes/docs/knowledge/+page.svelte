<script lang="ts">
	import { sdkFacts, grouped } from '$lib/sdk-facts';
	import CodeBlock from '$lib/ui/CodeBlock.svelte';
	import { href } from '$lib/paths';
</script>

<h1 class="text-3xl font-semibold">The Knowledge Graph</h1>
<p class="mt-3 text-muted">
	The catalogs hold what a number is. This holds what it <em>means</em> — {sdkFacts.graphNodes} mechanics
	across {sdkFacts.compartments} compartments, joined by 398 typed relationships, carrying {grouped(
		sdkFacts.graphClaims
	)} individual claims that each name their source and the date it was checked. It is queryable like any
	other data structure, and it is built so a wrong number is detectable rather than merely unlikely.
</p>

<h2 class="mt-10 text-xl font-semibold">A Node</h2>
<p class="mt-3 text-muted">
	Every mechanic is a node. Beyond a summary, it carries the SDK exports that implement it, the
	specific ways it has been misread, and its assertions.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { knowledgeFor } from 'thetowersdk/knowledge'

const gt = knowledgeFor('ultimateWeapon.goldenTower')

console.log(gt.label)          // 'Golden Tower'
console.log(gt.kind)           // 'system'  — also: rule, entity, currency, stat, tier
console.log(gt.claimType)      // 'objective'
console.log(gt.verification)   // 'verified_here'
console.log(gt.summary)
// 'Golden Tower upgrades Multiplier, Duration, Cooldown with stones, and its UW+
//  enhancement is Golden Combo. Maxing every stat costs 47,256 stones.'

console.log(gt.disambiguation)
// 'The weapon itself, not its enhancement — Golden Combo is a separate purchase…'

console.log(gt.implementedBy)  // ['uwStoneChartData'] — the export that holds these numbers`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Claims Are Checkable</h2>
<p class="mt-3 text-muted">
	An assertion is a subject, a predicate and a value, with provenance attached. That is what makes
	the graph testable: a claim says where it came from, so it can be re-checked against the same
	place rather than taken on trust.
</p>
<div class="mt-4">
	<CodeBlock
		code={`console.log(gt.assertions[0])
// {
//   subject: 'ultimateWeapon.goldenTower',
//   predicate: 'statCount',
//   value: 4,
//   provenance: {
//     origin: 'code',
//     ref: 'thetowersdk/data uwStoneChartData',
//     verifiedAt: '2026-08-17'
//   }
// }

import { collectAssertions, GAME_KNOWLEDGE } from 'thetowersdk/knowledge'

console.log(collectAssertions(GAME_KNOWLEDGE).length)   // 1642`}
	/>
</div>
<p class="mt-3 text-muted">
	<code>origin</code> says what kind of source it is — <code>game</code> for something you can see
	in the game itself, <code>code</code> for a value that ships in an SDK export, <code>wiki</code>
	for community writing, and <code>save</code> for something read out of a real account. A claim you can
	confirm in game outranks one taken from a guide, and the graph records that ranking.
</p>

<h2 class="mt-10 text-xl font-semibold">Sources Are Ranked, So Disagreement Is Visible</h2>
<p class="mt-3 text-muted">
	When two sources give different values for the same thing, the graph keeps both and says which one
	it believes. This is the part you cannot get from a wiki page or a spreadsheet.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { findContradictions } from 'thetowersdk/knowledge'

for (const conflict of findContradictions()) {
  console.log(conflict.subject, conflict.predicate, '->', conflict.likelyValue)
  for (const claim of conflict.claims) {
    console.log(\`   \${claim.value}  (\${claim.origin}, rank \${claim.authorityRank}) \${claim.ref}\`)
  }
}

// module.subEffect.slot8 opensAtLevel -> 241
//    241  (game, rank 0) Observed in game
//    242  (wiki, rank 5) The Tower: Early Game Tower Guide (community, 2026-08)`}
	/>
</div>
<p class="mt-3 text-muted">
	A lower <code>authorityRank</code> wins, and <code>likelyValue</code> is the graph's answer.
	<code>crossSource</code> marks a disagreement between different kinds of source rather than two readings
	of the same one.
</p>

<h2 class="mt-10 text-xl font-semibold">Fact And Opinion Stay Separate</h2>
<p class="mt-3 text-muted">
	<code>claimType</code> divides measured behaviour from community consensus. Both are worth having —
	players ask what is good, not only what is true — and keeping them apart means a build planner can use
	the measurements and quote the opinions as opinions.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { allNodes, GAME_KNOWLEDGE } from 'thetowersdk/knowledge'

const nodes = allNodes(GAME_KNOWLEDGE)
console.log(nodes.filter((node) => node.claimType === 'objective').length)   // 311
console.log(nodes.filter((node) => node.claimType === 'sentiment').length)   // 10

// 'Coins per kill versus coins per wave' — the community consensus, marked as such
// rather than presented as a measurement.`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Traps: What Goes Wrong Here</h2>
<p class="mt-3 text-muted">
	{sdkFacts.graphTraps} recorded misreadings across {sdkFacts.graphNodes} nodes — the specific mistakes
	people have actually made, kept next to the mechanic they belong to. Asking a mechanic what goes wrong
	with it is a different question from asking what it is, and the answer is the more useful one when you
	are about to model it.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { trapsFor } from 'thetowersdk/knowledge'

// Walks the node and everything it connects to, so a trap that lives on a
// neighbour still reaches you. Golden Tower's own node holds one; through its
// edges to the weapon set and the economy chain, this returns 18.
const traps = trapsFor('ultimateWeapon.goldenTower')
console.log(traps.length)   // 18

console.log(traps[0])
// 'Maxing Golden Tower costs 47,256 stones. The nine weapons range from 26,296 to
//  90,536, so they are not interchangeable purchases — pricing one from another is
//  out by more than a factor of two at the extremes.'`}
	/>
</div>
<p class="mt-3 text-muted">
	<code>trapsByClaimType</code> splits the same list into <code>objective</code> and
	<code>sentiment</code>, which is the difference between a measurement you can rely on and a
	community view worth quoting as one.
</p>

<h2 class="mt-10 text-xl font-semibold">Relationships Are Typed</h2>
<p class="mt-3 text-muted">
	Edges say how two mechanics relate, not merely that they do. The kinds in use are
	<code>gates</code>, <code>derivedFrom</code>, <code>memberOf</code>, <code>scales</code>,
	<code>caps</code>, <code>independentOf</code>, <code>separatePurchaseFrom</code> and
	<code>appliedBefore</code> — enough to answer "what does this multiply" and "what must come first" by
	walking the graph.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { relationsOf, neighboursOf } from 'thetowersdk/knowledge'

for (const edge of relationsOf('ultimateWeapon.goldenTower')) {
  console.log(edge.kind, '->', edge.to)
  console.log('   ', edge.note)
}

// memberOf -> ultimateWeapon
//     Golden Tower is one of the nine weapons, described from the shipped stone catalog.
// scales -> economy.cashPerKill
//     The one term the cash and coin chains share…

console.log(neighboursOf('ultimateWeapon.goldenTower'))
// ['ultimateWeapon', 'economy.cashPerKill', 'economy.killAward']`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Resolving A Name</h2>
<p class="mt-3 text-muted">
	Players type acronyms. <code>resolve</code> maps one to a node, and
	<code>resolveWithConfidence</code> returns how sure it is with the runners-up, so a weak match can be
	treated as one.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { resolve, resolveWithConfidence, search } from 'thetowersdk/knowledge'

resolve('gt')    // 'ultimateWeapon.goldenTower'
resolve('gt+')   // 'ultimateWeaponPlus.goldenCombo' — a different thing entirely

resolveWithConfidence('golden tower')
// { id: 'ultimateWeapon.goldenTower', score: 1000, confidence: 'exact', alternatives: [] }

resolveWithConfidence('gt')
// { id: 'ultimateWeapon.goldenTower', score: 800, confidence: 'strong', … }

search('golden tower')   // ranked hits, each with its node`}
	/>
</div>
<p class="mt-3 text-muted">
	Confidence is <code>exact</code>, <code>strong</code>, <code>weak</code> or <code>none</code>.
	Reading the score lets your tool ask "did you mean…" instead of guessing.
</p>

<h2 class="mt-10 text-xl font-semibold">Compartments, And How Well Covered They Are</h2>
<p class="mt-3 text-muted">
	The {sdkFacts.compartments} compartments group mechanics by domain —
	<code>ultimate-weapons</code>,
	<code>economy</code>,
	<code>labs</code>, <code>enemies</code>, <code>jargon</code> and so on. Each one scores itself, so you
	can see how thoroughly a domain has been checked before relying on it.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { compartmentMaturity, describeMaturity, compartmentOf, GAME_KNOWLEDGE } from 'thetowersdk/knowledge'

for (const report of compartmentMaturity('2026-08-26')) {
  console.log(report.id.padEnd(18), describeMaturity(report))
}
// attack             7 claims · 100% primary-sourced
// …

const first = compartmentMaturity('2026-08-26')[0]
console.log(first)
// { id: 'attack', domain: 'multishot, rapid fire, bounce shot, …',
//   nodeCount: 7, edgeCount: 9, sourcedPct: 100, primarySourcedPct: 100,
//   staleCount: 0, contradictionCount: 0, unverifiedCount: 0,
//   trapDensity: 2.9, assertionCount: 37, sentimentCount: 0 }

console.log(compartmentOf(GAME_KNOWLEDGE, 'ultimateWeapon.goldenTower').id)
// 'ultimate-weapons'`}
	/>
</div>
<p class="mt-3 text-muted">
	<code>staleCount</code> counts claims last checked before the date you pass, so a domain that has
	drifted since the last game update reports it. <code>primarySourcedPct</code> is the share backed by
	the game itself or by a shipped catalog rather than by community writing.
</p>

<h2 class="mt-10 text-xl font-semibold">Build A Mechanic Briefing</h2>
<p class="mt-3 text-muted">
	Put those together and a tool can hand a reader — or an assistant — everything known about a
	mechanic, with its sources, before a line of code is written about it.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { resolve, knowledgeFor, relationsOf, trapsFor } from 'thetowersdk/knowledge'

function brief(term) {
  const id = resolve(term)
  if (!id) return null

  const node = knowledgeFor(id)
  return {
    label: node.label,
    summary: node.summary,
    isOpinion: node.claimType === 'sentiment',
    implementedBy: node.implementedBy,
    relatedTo: relationsOf(id).map((edge) => \`\${edge.kind} \${edge.to}\`),
    watchOutFor: trapsFor(id),
    sources: node.sources.map((source) => \`\${source.origin}: \${source.ref} (\${source.verifiedAt})\`)
  }
}

console.log(brief('gt'))`}
	/>
</div>

<p class="mt-8 text-sm">
	<a href={href('/docs/mcp/')}>Reach It From An Assistant Over MCP →</a>
	·
	<a href={href('/docs/patch-notes/')}>Patch Notes →</a>
	·
	<a href={href('/docs/data/')}>Catalogs →</a>
</p>

<script lang="ts">
	import CodeBlock from '$lib/ui/CodeBlock.svelte';
	import InstallCmd from '$lib/ui/InstallCmd.svelte';
	import { towerAiSnippet } from '$lib/content';
	import { href } from '$lib/paths';
</script>

<h1 class="text-3xl font-semibold">TowerAI</h1>
<p class="mt-3 text-muted">
	The assistant core behind The Tower Run Tracker's in-app assistant, published as its own MIT
	package. It answers from a knowledge base you curate rather than from whatever a general model
	absorbed.
</p>

<div class="mt-4">
	<InstallCmd command="npm install towerai" showVersion={false} />
</div>

<h2 class="mt-10 text-xl font-semibold">Get A Model Key</h2>
<p class="mt-3 text-muted">
	TowerAI does the retrieval and prompting; the sentences come from a model you point it at. Groq
	has a free tier that is plenty for a personal tool, and its API speaks the OpenAI chat format, so
	the setup below is the same shape for any provider that does.
</p>
<ol class="mt-4 list-decimal space-y-2 pl-5 text-muted">
	<li>
		Sign up at <a href="https://console.groq.com" rel="noreferrer">console.groq.com</a> — a Google or
		GitHub account is enough, and the free tier needs no card.
	</li>
	<li>
		Open <strong>API Keys</strong> in the left sidebar and choose <strong>Create API Key</strong>.
		Name it after the tool you are building.
	</li>
	<li>Copy the key when it is shown. It is displayed once; create a new one if you lose it.</li>
	<li>
		Put it in your environment rather than in your code, so it never reaches a browser bundle or a
		commit.
	</li>
</ol>
<div class="mt-4">
	<CodeBlock
		code={`# .env  — and add .env to .gitignore
GROQ_API_KEY=gsk_your_key_here
GROQ_ENDPOINT=https://api.groq.com/openai/v1/chat/completions
GROQ_MODEL=openai/gpt-oss-120b`}
	/>
</div>
<p class="mt-3 text-muted">
	<code>console.groq.com</code> lists the models available to you and the requests per minute your
	tier allows. Any of them work here; <code>openai/gpt-oss-120b</code> is a good default, and
	<code>openai/gpt-oss-20b</code> is faster.
</p>

<h2 class="mt-10 text-xl font-semibold">Call The Model</h2>
<p class="mt-3 text-muted">
	Retrieve from your knowledge base, put what you find in a system message, and send the question.
	That grounding step is what makes the answer about your subject rather than about the model's
	general impression of it.
</p>
<div class="mt-4">
	<CodeBlock
		code={`async function ask(question, knowledgeBase) {
  const context = retrieve(knowledgeBase, question)   // your top matches, as text

  const response = await fetch(process.env.GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: \`Bearer \${process.env.GROQ_API_KEY}\`
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: \`Answer using only the reference below.\\n\\nReference:\\n\${context}\`
        },
        { role: 'user', content: question }
      ]
    })
  })

  const payload = await response.json()
  return payload.choices[0].message.content
}`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Keep The Key Off The Client</h2>
<p class="mt-3 text-muted">
	Bundlers inline anything they can see. In Vite, a variable named <code>VITE_*</code> becomes a string
	literal in the shipped JavaScript, which puts your key in every visitor's browser. Call the model from
	a server route, a serverless function, or your own small proxy, and let the browser talk to that. The
	demo on this site does exactly that — the page sends a question and receives an answer, and holds no
	credential.
</p>

<h2 class="mt-10 text-xl font-semibold">How The Knowledge Base Works</h2>
<p class="mt-2 text-sm text-muted">
	A knowledge base is an array of chunks. Each chunk carries a topic, tags, a disambiguation line
	saying what it is <em>not</em> about, and its content. Retrieval scores a question against those chunks
	and answers from the best match.
</p>
<p class="mt-3 text-sm text-muted">
	The split that matters: curated prose supplies meaning, and the SDK catalogs supply numbers. A
	chunk that says "Attack Speed has 99 levels" in prose goes stale the next time the game
	rebalances; one that reads the count from <code>LAB_CATALOG</code> does not.
</p>

<h2 class="mt-8 text-xl font-medium">Building One</h2>
<div class="mt-3">
	<CodeBlock code={towerAiSnippet} />
</div>

<h2 class="mt-8 text-xl font-medium">Exports</h2>
<ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
	<li>
		<code>buildTrackerAiCanonicalKbChunks</code> — the shipped chunk set, to extend or replace
	</li>
	<li>
		<code>validateCanonicalKbArray</code> — reports malformed chunks up front, not at query time
	</li>
	<li><code>formatKbValidationError</code> — turns a validation failure into a readable message</li>
	<li><code>buildCanonicalKbVersion</code> — a content-derived version string for cache keys</li>
	<li>
		<code>loadCanonicalKbFromJson</code> / <code>loadCanonicalKbFromFile</code> — load a prebuilt base
	</li>
	<li><code>toCanonicalRuntimeKnowledgeRecord</code> — chunk to the runtime record shape</li>
</ul>

<h2 class="mt-8 text-xl font-medium">Artifacts Are Fetched, Not Bundled</h2>
<p class="mt-2 text-sm text-muted">
	Embedding indexes are served from a manifest URL rather than shipped in the tarball, which keeps
	the package small. Point it at your own manifest to serve a knowledge base you host.
</p>

<h2 class="mt-8 text-xl font-medium">A Note On Accuracy</h2>
<p class="mt-2 text-sm text-muted">
	AI assistants are known to make mistakes. A curated base narrows what an assistant can say, and
	declining to answer is a valid outcome worth designing for — but it is not a guarantee of
	correctness. Say so wherever you surface answers to players.
</p>

<p class="mt-8 text-sm">
	<a href={href('/docs/mcp/')}>MCP &amp; Oracles →</a>
	·
	<a href={href('/docs/knowledge/')}>Knowledge Graph →</a>
</p>

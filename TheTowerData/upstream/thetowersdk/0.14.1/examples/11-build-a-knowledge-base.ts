/**
 * Building a knowledge base whose numbers cannot go stale.
 *
 *   npx tsx examples/11-build-a-knowledge-base.ts
 *
 * `towerai` is an optional add-on and is not installed here, so this builds the chunks and
 * validates them with a local copy of the rules. With `npm install towerai` the same chunks
 * go straight to `validateCanonicalKbArray` — the shape below is `CanonicalKbRecord`.
 *
 * See docs/OPTIONAL_ADD_ONS.md.
 */
import { LAB_CATALOG, WSP_WORKSHOP_COST_LEVELS } from 'thetowersdk/data'
import { workshopCostMaxLevel, getWorkshopCostLevelsByKey } from 'thetowersdk/data'

/** The required fields of a canonical chunk. */
interface KbChunk {
  chunk_type: 'atomic' | 'relational'
  chunk_id: string
  source: string
  section: string
  topic: string
  title: string
  disambiguation: string
  content: string
  mechanics: string[]
  tags?: string[]
}

/*
 * ---------------------------------------------------------------------------
 * 1. Derive the numbers. Never type them.
 * ---------------------------------------------------------------------------
 *
 * A hand-written "the Damage lab has 100 levels" is correct until a game update, and then
 * it is wrong, still retrieves, still reads plausibly, and nothing reports it. Interpolating
 * from the catalog means the sentence moves when the catalog does.
 */
// >>> snippet: knowledge-base-derived
const labChunks: KbChunk[] = LAB_CATALOG.slice(0, 5).map(lab => ({
  chunk_type: 'atomic',
  chunk_id: `mine_lab_${lab.name}`,        // prefixed: a collision with a shipped id is silent
  source: 'My Notes',
  section: 'Labs',
  topic: `${lab.name} levels`,
  title: `${lab.name} lab size`,
  // The field that stops the wrong chunk answering confidently.
  disambiguation: 'How many levels this lab has — not what order to research it in.',
  content: `The ${lab.name} lab has ${lab.levels?.length ?? 0} levels.`,
  mechanics: [lab.name],
  tags: ['labs', lab.name.toLowerCase()],
}))
// <<< snippet

/*
 * Curve lengths differ per stat, so this is exactly the kind of fact worth deriving: it is
 * easy to state wrongly from memory and impossible to state wrongly from the table.
 */
const workshopChunks: KbChunk[] = Object.keys(WSP_WORKSHOP_COST_LEVELS).slice(0, 5).map(key => {
  const curve = getWorkshopCostLevelsByKey(key)!
  return {
    chunk_type: 'atomic',
    chunk_id: `mine_workshop_${key}`,
    source: 'My Notes',
    section: 'Workshop',
    topic: `${key} maximum level`,
    title: `${key} level cap`,
    disambiguation: 'The highest level this curve prices, not the stat value at that level.',
    content: `${key} is priced up to level ${workshopCostMaxLevel(curve)}.`,
    mechanics: ['Workshop'],
    tags: ['workshop'],
  }
})

const knowledgeBase = [...labChunks, ...workshopChunks]

/*
 * ---------------------------------------------------------------------------
 * 2. Validate before querying, not during.
 * ---------------------------------------------------------------------------
 *
 * A malformed chunk does not error — it simply never gets retrieved. A knowledge base that
 * quietly answers nothing looks exactly like one that has nothing to say, so the checks
 * have to run when the base is built.
 */
const REQUIRED = ['chunk_type', 'chunk_id', 'source', 'section', 'topic', 'title', 'disambiguation', 'content', 'mechanics'] as const

const problems: string[] = []
const seen = new Set<string>()

for (const chunk of knowledgeBase) {
  for (const field of REQUIRED) {
    const value = (chunk as unknown as Record<string, unknown>)[field]
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      problems.push(`${chunk.chunk_id}: ${field} is empty`)
    }
  }
  // Two chunks with one id is not an error: one silently wins, and which depends on order.
  if (seen.has(chunk.chunk_id)) problems.push(`${chunk.chunk_id}: duplicate id`)
  seen.add(chunk.chunk_id)
}

console.log(`${knowledgeBase.length} chunks, ${problems.length} problem(s)`)
for (const problem of problems) console.log(`  ${problem}`)

console.log('\nSample:')
for (const chunk of knowledgeBase.slice(0, 3)) {
  console.log(`  [${chunk.section}] ${chunk.title}`)
  console.log(`      ${chunk.content}`)
  console.log(`      disambiguation: ${chunk.disambiguation}`)
}

/*
 * ---------------------------------------------------------------------------
 * 3. Prove a derived fact is actually derived.
 * ---------------------------------------------------------------------------
 *
 * The point of generating prose from the catalog is that the two cannot disagree. That is
 * only true if something checks — otherwise a refactor that changes the catalog and leaves
 * a stale literal in the template reintroduces exactly the problem this avoids.
 */
const first = LAB_CATALOG[0]
const derived = labChunks[0].content
const expected = `The ${first.name} lab has ${first.levels?.length ?? 0} levels.`
console.log(`\nderived matches the catalog: ${derived === expected}`)

if (problems.length > 0) process.exitCode = 1

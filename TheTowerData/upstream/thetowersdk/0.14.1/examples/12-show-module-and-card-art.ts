/**
 * Pointing at artwork you supply yourself.
 *
 *   npx tsx examples/12-show-module-and-card-art.ts
 *
 * This package ships **no images and no catalogue of them**. The art belongs to TechTree Games,
 * there is no permission to redistribute it, and a list naming every sprite in the game is derived
 * from the game whoever typed it — so that is withheld too.
 *
 * What ships is the naming rule, so a tool can find a file in a directory of artwork you already
 * have. This example runs with no artwork present at all, because building a path and loading a
 * file are different steps: it prints where each file WOULD be.
 */
import { gameAssetPath, gameAssetPaths, assetSlug, towerAssetUrl } from 'thetowersdk/assets'
import { CARD_TEMPLATES, MODULE_TEMPLATES } from 'thetowersdk/data'

/** Wherever you serve your own extraction from. */
const ART_ROOT = '/art'

console.log('Modules')
for (const module of MODULE_TEMPLATES.slice(0, 5)) {
  const path = gameAssetPath(module.name, { domain: 'modules' })
  console.log(`  ${module.name.padEnd(22)} ${towerAssetUrl(path, ART_ROOT)}`)
}

console.log('\nCards')
for (const card of CARD_TEMPLATES.slice(0, 5)) {
  const path = gameAssetPath(card.name, { domain: 'cards' })
  console.log(`  ${card.name.padEnd(22)} ${towerAssetUrl(path, ART_ROOT)}`)
}

/*
 * Every size at once, for a `srcset`. Nothing requires you to have all three — use the subset
 * your extraction produced and ignore the rest.
 */
console.log('\nOne module at every size')
const sizes = gameAssetPaths('Om Chip', { domain: 'modules' })
for (const [size, path] of Object.entries(sizes ?? {})) {
  console.log(`  ${size}  ${path}`)
}

/*
 * Name your own files with `assetSlug` rather than reimplementing the rule. Two implementations
 * of one convention is how a name silently stops matching its file — and a missing image does not
 * throw, it renders as a gap on one card, at one size, which nobody notices for months.
 */
console.log('\nThe slug rule')
for (const name of ['Om Chip', 'Amplifying Strike', 'Damage / Meter']) {
  console.log(`  ${name.padEnd(22)} -> ${assetSlug(name)}`)
}

/*
 * A name that slugifies to nothing returns null rather than `modules/-md.webp`, which would look
 * like a real path and resolve to nothing.
 */
console.log('\nRefusals')
console.log('  empty name  ->', gameAssetPath('   ', { domain: 'modules' }))
console.log('  no domain   ->', gameAssetPath('Om Chip', { domain: '' }))

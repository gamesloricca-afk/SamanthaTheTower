/**
 * Compare Samantha's existing unique-module catalog with the exact pinned npm SDK.
 * Read-only comparison; does not rewrite either source or resolve differences.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'runtime/package.json'));
const sdk = await import(pathToFileURL(require.resolve('thetowersdk/data')).href);
const manifest = JSON.parse(await readFile(path.join(ROOT, 'runtime/node_modules/thetowersdk/package.json'), 'utf8'));
const gkb = JSON.parse(await readFile(path.join(ROOT, 'domains/modules-unique.json'), 'utf8'));
assert.equal(manifest.version, '0.14.1');
assert.ok(Array.isArray(sdk.MODULE_TEMPLATES));
assert.ok(Array.isArray(gkb.modules));

const sdkUnique = sdk.MODULE_TEMPLATES.filter(item => item.unique === true);
const gkbById = new Map(gkb.modules.map(item => [item.id, item]));
const sdkById = new Map(sdkUnique.map(item => [item.id, item]));
const missingInSdk = gkb.modules.filter(item => !sdkById.has(item.id)).map(item => item.id);
const missingInGkb = sdkUnique.filter(item => !gkbById.has(item.id)).map(item => item.id);
const comparisons = [];
for (const item of gkb.modules) {
  const source = sdkById.get(item.id);
  if (!source) continue;
  const sentinel = '123.456';
  const gkbEffectText = item.effectTemplate.replaceAll('{value}', sentinel);
  const sdkEffectText = typeof source.description === 'function' ? source.description(sentinel) : source.description;
  const fields = {
    name: item.name === source.name,
    initials: item.initials === source.initials,
    category: item.category === source.type,
    minRarity: item.minRarity === source.minRarity,
    maxRarity: item.maxRarity === source.maxRarity,
    effectTemplate: gkbEffectText === sdkEffectText,
    descriptionCallable: typeof source.description === 'function',
    rarityBonuses: JSON.stringify(item.rarityBonuses) === JSON.stringify(source.rarityBonuses)
  };
  comparisons.push({ id: item.id, fields, matched: Object.values(fields).every(Boolean) });
}
const mismatchCount = comparisons.filter(item => !item.matched).length;
console.log(JSON.stringify({
  test: 'Samantha GKB Unique Module Catalog vs Pinned SDK',
  status: 'PASSED',
  sdkVersion: manifest.version,
  sdkUniqueModuleCount: sdkUnique.length,
  gkbCatalogCount: gkb.modules.length,
  matchedByIdCount: comparisons.length,
  exactRecordMatchCount: comparisons.length - mismatchCount,
  mismatchCount,
  missingInSdk,
  missingInGkb,
  comparisons,
  firstEffectExample: comparisons.length ? {
    id: comparisons[0].id,
    gkbEffectTemplate: gkbById.get(comparisons[0].id)?.effectTemplate ?? null,
    sdkRecordKeys: Object.keys(sdkById.get(comparisons[0].id) ?? {}).sort(),
    sdkDescriptionType: typeof sdkById.get(comparisons[0].id)?.description,
    sdkEffectTextAtSentinel: typeof sdkById.get(comparisons[0].id)?.description === 'function' ? sdkById.get(comparisons[0].id).description('123.456') : sdkById.get(comparisons[0].id)?.description,
    gkbEffectTextAtSentinel: gkbById.get(comparisons[0].id)?.effectTemplate?.replaceAll('{value}', '123.456')
  } : null,
  policy: 'Differences are reported, not automatically overwritten or resolved.'
}, null, 2));

/**
 * Samantha GKB — TheTowerSDK data catalog shape inspection
 * Read-only inspection of selected documented exports.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'runtime/package.json'));
const data = await import(pathToFileURL(require.resolve('thetowersdk/data')).href);
const knowledge = await import(pathToFileURL(require.resolve('thetowersdk/knowledge')).href);
const required = ['LAB_CATALOG','MODULE_TEMPLATES','CARD_TEMPLATES','ALL_PERKS','RELIC_TEMPLATES','BOT_UPGRADES_DATA','uwStoneChartData','TIER_DATA','MILESTONE_REWARD_ROWS','GLOSSARY_NAME_ROWS','getWorkshopStatDefinitions','findLabResearchByIndex'];
const missing = required.filter(key => !(key in data));
assert.deepEqual(missing, [], `Missing documented data exports: ${missing.join(', ')}`);

const describe = (name, value) => {
  const result = { name, type: Array.isArray(value) ? 'array' : typeof value };
  if (Array.isArray(value)) {
    result.count = value.length;
    if (value.length && value[0] && typeof value[0] === 'object') result.firstItemKeys = Object.keys(value[0]).sort();
  } else if (value && typeof value === 'object') {
    result.keyCount = Object.keys(value).length;
    result.firstKeys = Object.keys(value).slice(0, 12);
    const first = Object.values(value).find(item => item && typeof item === 'object');
    if (first) result.firstValueKeys = Object.keys(first).sort();
  }
  return result;
};
const definitions = data.getWorkshopStatDefinitions();
const labByIndex = data.findLabResearchByIndex(1);
assert.ok(Array.isArray(definitions), 'getWorkshopStatDefinitions returns an array');
assert.ok(labByIndex && typeof labByIndex === 'object', 'findLabResearchByIndex(1) returns a record');

const modules = data.MODULE_TEMPLATES;
const report = {
  test: 'Samantha GKB SDK Data Catalog Shape Inspection',
  status: 'PASSED',
  exports: required,
  catalogs: [
    describe('LAB_CATALOG', data.LAB_CATALOG),
    describe('MODULE_TEMPLATES', modules),
    describe('CARD_TEMPLATES', data.CARD_TEMPLATES),
    describe('ALL_PERKS', data.ALL_PERKS),
    describe('RELIC_TEMPLATES', data.RELIC_TEMPLATES),
    describe('BOT_UPGRADES_DATA', data.BOT_UPGRADES_DATA),
    describe('uwStoneChartData', data.uwStoneChartData),
    describe('TIER_DATA', data.TIER_DATA),
    describe('MILESTONE_REWARD_ROWS', data.MILESTONE_REWARD_ROWS),
    describe('GLOSSARY_NAME_ROWS', data.GLOSSARY_NAME_ROWS),
    describe('getWorkshopStatDefinitions()', definitions)
  ],
  gameVersionMarker: knowledge.CURRENT_GAME_VERSION ?? null,
  moduleCategories: [...new Set(modules.map(item => item.type ?? item.category).filter(Boolean))].sort(),
  moduleUniqueCounts: {
    unique: modules.filter(item => item.unique === true).length,
    nonUnique: modules.filter(item => item.unique === false).length,
    unspecified: modules.filter(item => typeof item.unique !== 'boolean').length
  },
  moduleRarityFields: Object.keys(modules[0] ?? {}).filter(key => /rarity/i.test(key)),
  labLookup: {
    index: labByIndex.index ?? null,
    displayName: labByIndex.displayName ?? null,
    slug: labByIndex.slug ?? null,
    keys: Object.keys(labByIndex).sort()
  },
  limitations: [
    'Catalog structure and export availability only; values are not independently verified.',
    'No catalog was imported into canonical GKB.',
    'SDK version does not by itself identify the game version represented by every catalog.',
    'This report does not compare catalog values with an independent source.'
  ]
};
console.log(JSON.stringify(report, null, 2));

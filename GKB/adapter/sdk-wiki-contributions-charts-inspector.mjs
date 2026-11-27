/**
 * Samantha GKB — SDK wiki, contributions, and charts structure inspection.
 * No network calls are made; wiki source metadata and attribution data are read locally.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'runtime/package.json'));
const manifest = JSON.parse(require('node:fs').readFileSync(path.join(ROOT, 'runtime/node_modules/thetowersdk/package.json'), 'utf8'));
assert.equal(manifest.version, '0.14.1');

const wiki = await import(pathToFileURL(require.resolve('thetowersdk/wiki')).href);
const contributions = await import(pathToFileURL(require.resolve('thetowersdk/contributions')).href);
const charts = await import(pathToFileURL(require.resolve('thetowersdk/charts')).href);

const required = {
  wiki: ['WIKI_SOURCES','DEFAULT_WIKI_SOURCE_ID','getWikiSource','fetchWikiPageAsMarkdown','searchWiki','fetchWikiPageLastEdited'],
  contributions: ['CONTRIBUTIONS','ATTRIBUTION_LINES'],
  charts: ['SHARED_CHART_REGISTRY','resolveCanonicalToolDataset','resolveCanonicalToolLookupTable']
};
for (const [group, names] of Object.entries(required)) {
  const namespace = { wiki, contributions, charts }[group];
  const missing = names.filter(name => !(name in namespace));
  assert.deepEqual(missing, [], `${group} missing exports: ${missing.join(', ')}`);
}

const wikiSources = wiki.WIKI_SOURCES;
assert.ok(Array.isArray(wikiSources));
const fandom = wiki.getWikiSource('fandom');
assert.ok(fandom && typeof fandom === 'object');

const areas = contributions.CONTRIBUTIONS;
assert.ok(Array.isArray(areas));
assert.ok(Array.isArray(contributions.ATTRIBUTION_LINES));

const registry = charts.SHARED_CHART_REGISTRY;
assert.ok(Array.isArray(registry));
const chart = charts.resolveCanonicalToolDataset('bot-upgrades', ['Golden Bot']);
assert.ok(chart && Array.isArray(chart.columns) && Array.isArray(chart.rows));

console.log(JSON.stringify({
  test: 'Samantha GKB SDK Wiki, Contributions, and Charts Inspection',
  status: 'PASSED',
  sdkVersion: manifest.version,
  wiki: {
    sourceCount: wikiSources.length,
    defaultSourceId: wiki.DEFAULT_WIKI_SOURCE_ID,
    sources: wikiSources.map(source => ({
      id: source.id,
      label: source.label,
      keys: Object.keys(source).sort()
    })),
    fandomLookupKeys: Object.keys(fandom).sort(),
    networkFetchPerformed: false
  },
  contributions: {
    areaCount: areas.length,
    totalPeople: areas.reduce((sum, area) => sum + (Array.isArray(area.people) ? area.people.length : 0), 0),
    attributionLineCount: contributions.ATTRIBUTION_LINES.length,
    areaNames: areas.map(area => area.area)
  },
  charts: {
    registryCount: registry.length,
    firstEntryKeys: Object.keys(registry[0] ?? {}).sort(),
    sample: {
      renderer: 'bot-upgrades',
      arguments: ['Golden Bot'],
      title: chart.title,
      columnCount: chart.columns.length,
      rowCount: chart.rows.length,
      firstColumnLabels: chart.columns.slice(0, 5).map(column => column.label)
    }
  },
  limitations: [
    'Wiki network requests and live page revision retrieval were not performed.',
    'Attribution data structure was inspected but no redistribution action was performed.',
    'Chart output is a formatted SDK dataset and is not independent source confirmation.',
    'No chart or wiki content was imported into GKB.'
  ]
}, null, 2));

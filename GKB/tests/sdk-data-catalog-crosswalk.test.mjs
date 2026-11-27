import assert from 'node:assert/strict';
import { buildSdkDataCatalogCrosswalk } from '../adapter/sdk-data-catalog-crosswalk.mjs';

const graph = { nodes: [
  { id: 'lab.damage', label: 'Damage' },
  { id: 'damage', label: 'Tower damage' },
  { id: 'x', label: 'Berserker' },
  { id: 'perk.node', label: 'x1.20 Max Health' },
  { id: 'none', label: 'Not present' }
]};
const staging = {
  source: { sdkGameVersion: 'v28.3.0' },
  catalogs: [
    { domain: 'Research', sourceRef: 'sdk/data#LAB_CATALOG', recordCount: 1, records: [
      { sourceIndex: 0, rawRecord: { slug: 'lab.damage', name: 'Damage' } }
    ]},
    { domain: 'Workshop', sourceRef: 'sdk/data#getWorkshopStatDefinitions', recordCount: 1, records: [
      { sourceIndex: 0, rawRecord: { key: 'damage', label: 'Tower damage' } }
    ]},
    { domain: 'Cards and Masteries', sourceRef: 'sdk/data#CARD_TEMPLATES', recordCount: 1, records: [
      { sourceIndex: 0, rawRecord: { id: 'card.berserker', name: 'Berserker' } }
    ]},
    { domain: 'Perks', sourceRef: 'sdk/data#ALL_PERKS', recordCount: 1, records: [
      { sourceIndex: 0, rawRecord: { perk: 'x1.20 Max Health' } }
    ]}
  ]
};
const result = buildSdkDataCatalogCrosswalk({
  graph, staging, sdkVersion: '0.14.1', retrievedAt: '2026-11-27'
});
assert.equal(result.status, 'PASSED');
assert.equal(result.scope.graphNodeCount, 5);
assert.equal(result.summary.domainSummary.length, 4);
assert.equal(result.records[0].domainCandidates[0].status, 'EXACT_SOURCE_ID_MATCH');
assert.equal(result.records[0].domainCandidates[0].candidates[0].matchMethods.includes('EXACT_LABEL'), true);
assert.equal(result.records[1].domainCandidates[1].status, 'EXACT_SOURCE_ID_MATCH');
assert.equal(result.records[2].domainCandidates[2].status, 'EXACT_LABEL_CANDIDATE');
assert.equal(result.records[3].domainCandidates[3].status, 'EXACT_LABEL_CANDIDATE');
assert.equal(result.records[4].domainCandidates.every(item => item.status === 'UNMATCHED'), true);
assert.equal(result.summary.nodeCountWithAtLeastOneCandidate, 4);
assert.equal(result.policy.canonicalIdsCreated, false);
assert.equal(result.policy.canonicalImportPerformed, false);
assert.equal(result.sourceGameVersion, 'v28.3.0');

const ambiguous = structuredClone(staging);
ambiguous.catalogs[0].records.push({ sourceIndex: 1, rawRecord: { slug: 'other', name: 'Damage' } });
const ambiguousResult = buildSdkDataCatalogCrosswalk({
  graph: { nodes: [{ id: 'other-id', label: 'Damage' }] },
  staging: ambiguous, sdkVersion: '0.14.1', retrievedAt: '2026-11-27'
});
assert.equal(ambiguousResult.records[0].domainCandidates[0].status, 'AMBIGUOUS');
assert.equal(ambiguousResult.records[0].domainCandidates[0].candidateCount, 2);

assert.throws(() => buildSdkDataCatalogCrosswalk({
  graph, staging: { catalogs: null }, sdkVersion: '0.14.1', retrievedAt: '2026-11-27'
}), /catalogs must be an array/);
assert.throws(() => buildSdkDataCatalogCrosswalk({
  graph, staging, sdkVersion: '', retrievedAt: '2026-11-27'
}), /sdkVersion is required/);
assert.throws(() => buildSdkDataCatalogCrosswalk({
  graph, staging, sdkVersion: '0.14.1', retrievedAt: '2026-02-30'
}), /valid YYYY-MM-DD/);

console.log(JSON.stringify({
  test: 'Samantha SDK-to-SDK Data Catalog Crosswalk',
  status: 'PASSED',
  cases: 17,
  graphNodes: result.scope.graphNodeCount,
  catalogs: result.scope.catalogCount,
  noCanonicalPromotion: true
}, null, 2));

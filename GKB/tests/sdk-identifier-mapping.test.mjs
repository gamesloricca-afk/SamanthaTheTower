import assert from 'node:assert/strict';
import { buildIdentifierMappingReport } from '../adapter/sdk-identifier-mapping.mjs';

const graph = {
  nodes: [
    { id: 'alpha', label: 'Alpha Module', kind: 'module', extra: { keep: true } },
    { id: 'sdk-beta', label: 'Beta Module', kind: 'module' },
    { id: 'unknown', label: 'Unknown', kind: 'mechanic' },
    { id: 'alpha', label: 'Beta Module', kind: 'module' }
  ]
};
const original = structuredClone(graph);
const catalogs = [{
  domain: 'Modules — Unique',
  sourcePath: 'GKB/domains/modules-unique.json',
  records: [
    { id: 'alpha', name: 'Alpha Module' },
    { id: 'beta', name: 'Beta Module' }
  ]
}];

const report = buildIdentifierMappingReport({
  graph, catalogs, sdkVersion: '0.14.1', retrievedAt: '2026-11-27'
});
assert.deepEqual(graph, original, 'source graph is not modified');
assert.equal(report.summary.total, 4);
assert.equal(report.summary.EXACT_ID_MATCH, 1);
assert.equal(report.summary.NAME_CANDIDATE, 1);
assert.equal(report.summary.UNMATCHED, 1);
assert.equal(report.summary.AMBIGUOUS, 1);
assert.equal(report.records[0].candidateCanonicalId, 'alpha');
assert.equal(report.records[0].matchMethod, 'EXACT_ID');
assert.equal(report.records[1].candidateCanonicalId, 'beta');
assert.equal(report.records[1].matchMethod, 'EXACT_NAME_ONLY');
assert.equal(report.records[2].candidateCanonicalId, null);
assert.deepEqual(report.records[3].candidateCanonicalIds, ['alpha', 'beta']);
assert.equal(report.records[3].status, 'AMBIGUOUS');
assert.equal(report.records.every(item => item.mappingApproved === false), true);
assert.equal(report.policy.automaticMapping, false);
assert.equal(report.policy.canonicalImportPerformed, false);

assert.throws(() => buildIdentifierMappingReport({
  graph: { nodes: [] },
  catalogs: [{ domain: 'x', sourcePath: 'x', records: [{ id: 'dup', name: 'A' }, { id: 'dup', name: 'B' }] }],
  sdkVersion: '0.14.1', retrievedAt: '2026-11-27'
}), /Duplicate canonical IDs/);
assert.throws(() => buildIdentifierMappingReport({
  graph: { nodes: [] }, catalogs, sdkVersion: '0.14.1', retrievedAt: '2026-02-30'
}), /valid YYYY-MM-DD/);

console.log(JSON.stringify({
  test: 'Samantha GKB SDK Identifier Mapping',
  status: 'PASSED',
  assertions: 18,
  cases: ['exact ID', 'exact name candidate', 'unmatched', 'ambiguous ID/name disagreement', 'duplicate canonical ID rejection', 'invalid date rejection', 'source preservation', 'no automatic approval']
}, null, 2));

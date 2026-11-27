import assert from 'node:assert/strict';
import { buildSdkDomainCatalogAudit } from '../adapter/sdk-domain-catalog-audit.mjs';

const report = buildSdkDomainCatalogAudit({ catalogs: [{
  domain: 'Workshop', sourceRef: 'sdk/data#WORKSHOP', recordCount: 2,
  records: [
    { sourceIndex: 0, rawRecord: { key: 'a', label: 'A', levels: [{ level: 1, cost: 10 }, { level: 2, cost: 20 }] } },
    { sourceIndex: 1, rawRecord: { key: 'b', label: 'B', levels: [{ level: 1, cost: 'unknown', note: null }] } }
  ]
}] });
const catalog = report.summary.catalogReports[0];
assert.equal(catalog.nestedFields.some(item => item.path === 'levels[].cost'), true);
const cost = catalog.nestedFields.find(item => item.path === 'levels[].cost');
assert.deepEqual(cost.observedTypes, ['number', 'string']);
assert.deepEqual(cost.numericObservation, { count: 2, min: 10, max: 20, distinctCount: 2 });
assert.ok(report.findings.some(item => item.code === 'NESTED_OBJECT_SHAPE_VARIATION'));
assert.ok(report.findings.some(item => item.code === 'NESTED_ARRAY_LENGTH_VARIATION'));
assert.ok(report.findings.some(item => item.code === 'FIELD_TYPE_VARIATION' && item.field === 'levels'));
assert.equal(report.policy.valuesNormalized, false);
console.log(JSON.stringify({ test: 'Samantha GKB SDK Nested Catalog Audit', status: 'PASSED', cases: 8 }, null, 2));

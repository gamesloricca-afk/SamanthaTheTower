import assert from 'node:assert/strict';
import { buildSdkDomainCatalogAudit } from '../adapter/sdk-domain-catalog-audit.mjs';

const staging = { source: { sdkVersion: '0.14.1' }, catalogs: [
  { domain: 'Research', sourceRef: 'sdk/data#LAB_CATALOG', recordCount: 3, observedRecordKeys: ['name','slug','value'], records: [
    { sourceIndex: 0, rawRecord: { slug: 'lab.a', name: 'Damage', value: 1, levels: [{ level: 1, value: 0.02 }] } },
    { sourceIndex: 1, rawRecord: { slug: 'lab.a', name: 'Damage II', value: '2' } },
    { sourceIndex: 2, rawRecord: { slug: 'lab.c', name: 'Damage', value: null, extra: true, levels: [{ level: 2, value: 0.03, note: 'source-specific' }, { level: 3, value: 0.04, note: 'source-specific' }] } }
  ]},
  { domain: 'Workshop', sourceRef: 'sdk/data#WORKSHOP', recordCount: 1, observedRecordKeys: ['key','label'], records: [
    { sourceIndex: 0, rawRecord: { key: 'workshop.damage', label: 'Damage' } }
  ]},
  { domain: 'Perks', sourceRef: 'sdk/data#ALL_PERKS', recordCount: 2, observedRecordKeys: ['perk','pool'], records: [
    { sourceIndex: 0, rawRecord: { perk: 'Health', pool: 'standard' } },
    { sourceIndex: 1, rawRecord: { perk: 'Health', pool: 'tradeoff' } }
  ]}
]};
const report = buildSdkDomainCatalogAudit(staging);
assert.equal(report.status, 'PASSED');
assert.equal(report.scope.totalRecords, 6);
const research = report.summary.catalogReports[0];
assert.equal(research.duplicateSourceIdGroups, 1);
assert.equal(research.repeatedLabelGroups, 1);
assert.equal(research.missingId, 0);
assert.ok(report.findings.some(item => item.code === 'FIELD_TYPE_VARIATION' && item.field === 'value'));
assert.ok(report.findings.some(item => item.code === 'NULL_FIELD_VALUE' && item.field === 'value'));
assert.ok(report.findings.some(item => item.code === 'NESTED_OBJECT_SHAPE_VARIATION' && item.path === 'levels[]'));
assert.ok(report.findings.some(item => item.code === 'NESTED_ARRAY_LENGTH_VARIATION' && item.path === 'levels'));
const levelValues = research.nestedFields.find(item => item.path === 'levels[].value');
assert.deepEqual(levelValues.numericObservation, { count: 3, min: 0.02, max: 0.04, distinctCount: 3 });
assert.equal(levelValues.presentRecordCount, 2);
assert.equal(report.policy.rawRecordsModified, false);
assert.equal(report.policy.canonicalImportPerformed, false);
const perks = report.summary.catalogReports[2];
assert.equal(perks.idField, null);
assert.equal(perks.missingId, 0);
assert.equal(perks.repeatedLabelGroups, 1);
assert.equal(report.summary.crossDomainLabelGroups.length, 1);
assert.equal(report.summary.crossDomainLabelGroups[0].label, 'Damage');
assert.ok(report.findings.some(item => item.code === 'CROSS_DOMAIN_LABEL_COLLISION'));
assert.ok(report.findings.some(item => item.code === 'DUPLICATE_SOURCE_ID'));
assert.equal(report.policy.valuesNormalized, false);
assert.throws(() => buildSdkDomainCatalogAudit({ catalogs: null }), /catalogs must be an array/);
assert.throws(() => buildSdkDomainCatalogAudit({ catalogs: [{ domain: 'Unknown', records: [] }] }), /No explicit field audit mapping/);
const broken = structuredClone(staging);
broken.catalogs[0].records[0].rawRecord = null;
const brokenReport = buildSdkDomainCatalogAudit(broken);
assert.ok(brokenReport.findings.some(item => item.code === 'NON_OBJECT_RECORD'));
console.log(JSON.stringify({ test: 'Samantha GKB SDK Domain Catalog Structural Audit', status: 'PASSED', cases: 21 }, null, 2));

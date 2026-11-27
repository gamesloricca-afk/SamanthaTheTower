import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import { buildSdkDomainCatalogStaging } from '../adapter/sdk-domain-catalog-staging.mjs';

const source = {
  id: 'research.attack-speed',
  name: 'Attack Speed',
  levels: [{ level: 1, value: 0.02, extra: { preserve: true } }],
  unknownField: ['keep', 7]
};
const inputCatalogs = [
  { domain: 'Research', exportName: 'LAB_CATALOG', sourceRef: 'thetowersdk/data#LAB_CATALOG', records: [source, { name: 'Empty Slug', slug: null }] },
  { domain: 'Workshop', exportName: 'getWorkshopStatDefinitions()', sourceRef: 'thetowersdk/data#getWorkshopStatDefinitions', records: [{ key: 'damage', label: 'Damage', maxLevel: 999 }] },
  { domain: 'Cards and Masteries', exportName: 'CARD_TEMPLATES', sourceRef: 'thetowersdk/data#CARD_TEMPLATES', records: [{ id: 'damage', masteryName: 'Damage Mastery', masteryValues: [1, 2] }] },
  { domain: 'Perks', exportName: 'ALL_PERKS', sourceRef: 'thetowersdk/data#ALL_PERKS', records: [{ perk: 'x', pool: 'standard', quantity: 1 }] }
];

const result = buildSdkDomainCatalogStaging({
  catalogs: inputCatalogs,
  sdkVersion: '0.14.1',
  sdkGameVersion: 'v28.3.0',
  retrievedAt: '2026-11-27'
});

const schema = JSON.parse(await readFile(new URL('../schema/sdk-domain-catalog-staging.schema.json', import.meta.url), 'utf8'));
const validate = new Ajv2020({ allErrors: true }).compile(schema);
assert.equal(validate(result), true, JSON.stringify(validate.errors));
assert.equal(result.schemaVersion, '1.0.0');
assert.equal(result.source.sdkVersion, '0.14.1');
assert.equal(result.source.sdkGameVersion, 'v28.3.0');
assert.equal(result.source.verificationStatus, 'EXTERNAL-UNVERIFIED');
assert.equal(result.catalogs.length, 4);
assert.deepEqual(result.catalogs.map(item => item.recordCount), [2, 1, 1, 1]);
assert.deepEqual(result.catalogs[0].records[0].rawRecord, source);
assert.deepEqual(result.catalogs[0].records[0].rawRecord.unknownField, ['keep', 7]);
assert.equal(result.catalogs[0].records[0].rawRecord.levels[0].extra.preserve, true);
assert.equal(result.catalogs[0].records[1].sourceIndex, 1);
assert.deepEqual(result.catalogs[1].observedRecordKeys, ['key', 'label', 'maxLevel']);
assert.equal(result.catalogs[2].records[0].rawRecord.masteryName, 'Damage Mastery');
assert.equal(result.catalogs[3].records[0].rawRecord.pool, 'standard');
assert.equal(result.policy.rawRecordsPreserved, true);
assert.equal(result.policy.sourceOrderPreserved, true);
assert.equal(result.policy.unknownFieldsPreserved, true);
assert.equal(result.policy.recordDeduplication, false);
assert.equal(result.policy.identifierGeneration, false);
assert.equal(result.policy.normalizationPerformed, false);
assert.equal(result.policy.canonicalClaimsCreated, false);
assert.equal(result.policy.canonicalImportPerformed, false);

assert.throws(() => buildSdkDomainCatalogStaging({
  catalogs: [], sdkVersion: '0.14.1', retrievedAt: '2026-11-27'
}), /non-empty array/);
assert.throws(() => buildSdkDomainCatalogStaging({
  catalogs: [{ domain: 'Research', exportName: 'LAB_CATALOG', sourceRef: 'x', records: [] }],
  sdkVersion: '0.14.1', retrievedAt: '2026-02-30'
}), /valid YYYY-MM-DD/);
assert.throws(() => buildSdkDomainCatalogStaging({
  catalogs: [
    { domain: 'Research', exportName: 'LAB_CATALOG', sourceRef: 'x', records: [] },
    { domain: 'Research', exportName: 'LAB_CATALOG', sourceRef: 'x', records: [] }
  ],
  sdkVersion: '0.14.1', retrievedAt: '2026-11-27'
}), /Duplicate catalog declaration/);
assert.throws(() => buildSdkDomainCatalogStaging({
  catalogs: [{ domain: 'Research', exportName: 'LAB_CATALOG', sourceRef: 'x', records: [] }],
  sdkVersion: '', retrievedAt: '2026-11-27'
}), /sdkVersion is required/);

console.log(JSON.stringify({
  test: 'Samantha GKB SDK Domain Catalog Staging',
  status: 'PASSED',
  cases: 22,
  domains: result.catalogs.length,
  records: result.catalogs.reduce((sum, item) => sum + item.recordCount, 0),
  rawFieldsPreserved: true,
  sourceOrderPreserved: true,
  canonicalImport: false
}, null, 2));

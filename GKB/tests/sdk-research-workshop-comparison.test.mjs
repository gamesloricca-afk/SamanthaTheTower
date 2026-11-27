import assert from 'node:assert/strict';
import { buildResearchWorkshopComparison } from '../adapter/sdk-research-workshop-comparison.mjs';

const staging = {
  source: { sdkVersion: '0.14.1', sdkGameVersion: 'v28.3.0', verificationStatus: 'EXTERNAL-UNVERIFIED' },
  catalogs: [
    {
      domain: 'Research', exportName: 'LAB_CATALOG', sourceRef: 'sdk/data#LAB_CATALOG', recordCount: 3,
      records: [
        { sourceIndex: 0, rawRecord: { slug: 'attack_speed', name: 'Attack Speed', category: 'Attack', value: 0.01, levels: [{ level: 1, cost: 10, duration: '1d' }] } },
        { sourceIndex: 1, rawRecord: { slug: 'health', name: 'Health', category: 'Defense', levels: [{ level: 1, cost: 20, duration: '2d' }] } },
        { sourceIndex: 2, rawRecord: { slug: 'other_lab', name: 'Other Lab', category: 'Main', levels: [{ level: 1, cost: 30, duration: '3d' }] } }
      ]
    },
    {
      domain: 'Workshop', exportName: 'getWorkshopStatDefinitions()', sourceRef: 'sdk/data#getWorkshopStatDefinitions', recordCount: 3,
      records: [
        { sourceIndex: 0, rawRecord: { key: 'Attack Speed', label: 'Attack Speed', category: 'attack', minLevel: 0, maxLevel: 99, levels: [{ level: 0, value: 1, cash: 5, coins: 10 }] } },
        { sourceIndex: 1, rawRecord: { key: 'Health', label: 'Health', category: 'defense', minLevel: 0, maxLevel: 99, levels: [{ level: 0, value: 10, cash: 5, coins: 10 }] } },
        { sourceIndex: 2, rawRecord: { key: 'Other', label: 'Other', category: 'utility', minLevel: 0, maxLevel: 10, levels: [{ level: 0, value: 1, cash: 5, coins: 10 }] } }
      ]
    }
  ]
};

const report = buildResearchWorkshopComparison(staging);
assert.equal(report.summary.sharedTopLevelFieldCount, 2);
assert.deepEqual(report.summary.sharedTopLevelFields, ['category', 'levels']);
assert.equal(report.summary.exactResearchSlugWorkshopKeyMatches, 0);
assert.equal(report.summary.exactResearchNameWorkshopLabelCandidates, 2);
assert.equal(report.summary.exactResearchNameWorkshopKeyTextMatches, 2);
assert.equal(report.fieldComparison.nestedLevelsForExactLabelCandidates.researchObjectKeyShapes[0].keys.join(','), 'cost,duration,level');
assert.equal(report.fieldComparison.nestedLevelsForExactLabelCandidates.workshopObjectKeyShapes[0].keys.join(','), 'cash,coins,level,value');
assert.equal(report.exactLabelCandidates.every(item => item.categoryExactEqual === false), true);
assert.equal(report.policy.rawRecordsModified, false);
assert.equal(report.policy.canonicalRelationshipsCreated, false);
assert.equal(report.source.sdkVersion, '0.14.1');

const duplicate = structuredClone(staging);
duplicate.catalogs[1].records.push({
  sourceIndex: 3,
  rawRecord: { key: 'Attack Speed duplicate', label: 'Attack Speed', category: 'attack', minLevel: 0, maxLevel: 1, levels: [] }
});
duplicate.catalogs[1].recordCount = 4;
const ambiguousReport = buildResearchWorkshopComparison(duplicate);
assert.equal(ambiguousReport.summary.ambiguousResearchNameWorkshopLabelCandidates, 1);
assert.equal(ambiguousReport.summary.exactResearchNameWorkshopLabelCandidates, 1);

assert.throws(() => buildResearchWorkshopComparison({ catalogs: [] }), /exactly one Research catalog/);
console.log(JSON.stringify({
  test: 'Samantha GKB SDK Research–Workshop Catalog Comparison',
  status: 'PASSED',
  cases: 12
}, null, 2));

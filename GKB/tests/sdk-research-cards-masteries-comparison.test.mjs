import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { buildResearchCardsMasteriesComparison } from '../adapter/sdk-research-cards-masteries-comparison.mjs';

const require=createRequire(new URL('../runtime/package.json',import.meta.url));
const Ajv2020=require('ajv/dist/2020').default;
const reportSchema=require('../schema/sdk-research-cards-masteries-comparison.schema.json');

const staging={
  source:{sdkVersion:'0.14.1',sdkGameVersion:'v28.3.0',verificationStatus:'EXTERNAL-UNVERIFIED'},
  catalogs:[
    {
      domain:'Research',exportName:'LAB_CATALOG',sourceRef:'sdk/data#LAB_CATALOG',recordCount:3,
      records:[
        {sourceIndex:0,rawRecord:{slug:'damage',name:'Damage',description:'Research damage',category:'Attack',levels:[{level:1,cost:10,duration:'1d'}]}},
        {sourceIndex:1,rawRecord:{slug:'damage_meter',name:'Damage / Meter',description:'Research meter',category:'Attack',levels:[{level:1,cost:20,duration:'2d'}]}},
        {sourceIndex:2,rawRecord:{slug:'other',name:'Other',category:'Main',levels:[{level:1,cost:30,duration:'3d'}]}}
      ]
    },
    {
      domain:'Cards and Masteries',exportName:'CARD_TEMPLATES',sourceRef:'sdk/data#CARD_TEMPLATES',recordCount:3,
      records:[
        {sourceIndex:0,rawRecord:{id:'dmg',name:'Damage',description:'Card damage',rarity:'common',levelType:'multi',levelValues:[1,2],masteryName:'Damage+',masteryDescription:'Mastery damage',masteryType:'multi',masteryValues:[1,2,3]}},
        {sourceIndex:1,rawRecord:{id:'range',name:'Range',description:'Card range',rarity:'common',levelType:'multi',levelValues:[1],masteryName:'Damage / Meter',masteryDescription:'Mastery range',masteryType:'multi',masteryValues:[1]}},
        {sourceIndex:2,rawRecord:{id:'other',name:'Other Card',description:'Other',rarity:'rare',levelType:'percent',levelValues:[1],masteryName:'Other Mastery',masteryDescription:'Other',masteryType:'percent',masteryValues:[1]}}
      ]
    }
  ]
};

const report=buildResearchCardsMasteriesComparison(staging);
assert.equal(report.summary.sharedTopLevelFieldCount,1);
assert.deepEqual(report.summary.sharedTopLevelFields,['description']);
assert.equal(report.summary.exactResearchSlugCardIdMatches,0);
assert.equal(report.summary.exactResearchNameCardNameCandidates,1);
assert.equal(report.summary.exactResearchNameCardMasteryNameCandidates,1);
assert.equal(report.exactNameCandidates[0].researchName,'Damage');
assert.equal(report.exactMasteryNameCandidates[0].masteryName,'Damage / Meter');
assert.deepEqual(report.fieldComparison.nestedArrays.cardLevelValues.observedEntryTypes,['number']);
assert.equal(report.policy.canonicalRelationshipsCreated,false);
assert.equal(report.source.sdkVersion,'0.14.1');
const ajv=new Ajv2020({allErrors:true});
assert.equal(ajv.validate(reportSchema,report),true,JSON.stringify(ajv.errors));

const ambiguous=structuredClone(staging);
ambiguous.catalogs[1].records.push({
  sourceIndex:3,
  rawRecord:{id:'dmg2',name:'Damage',description:'duplicate label',rarity:'rare',levelType:'multi',levelValues:[],masteryName:'Other+',masteryDescription:'x',masteryType:'multi',masteryValues:[]}
});
const ambiguousReport=buildResearchCardsMasteriesComparison(ambiguous);
assert.equal(ambiguousReport.summary.ambiguousResearchNameCardNameCandidates,1);
assert.throws(()=>buildResearchCardsMasteriesComparison({catalogs:[]}),/exactly one Research catalog/);

console.log(JSON.stringify({
  test:'Samantha GKB SDK Research–Cards and Masteries Comparison',
  status:'PASSED',
  cases:12
},null,2));

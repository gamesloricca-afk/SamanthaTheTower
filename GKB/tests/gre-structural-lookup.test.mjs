import assert from 'node:assert/strict';
import { buildGreMethodSearchIndex, searchGreMethods, linkGreClaimsToMethods } from '../adapter/gre-structural-lookup.mjs';
const methods = [
 {index:2295,name:'CalculateDamageReductionResult',token:'0x060008f8',offset:3150934,commit:'abc',sourceFile:'GRE/1/02_enemies.json',ownerType:{index:314,name:'Enemy',namespace:'Game'},parameters:[{name:'incomingDamage'}],evidenceClass:'DIRECT_METADATA_DECLARATION',verificationStatus:'EXTERNAL-UNVERIFIED'},
 {index:2296,name:'ApplyDamageReductionStats',token:'0x060008f9',offset:3150964,commit:'abc',sourceFile:'GRE/1/02_enemies.json',ownerType:{index:314,name:'Enemy',namespace:'Game'},parameters:[{name:'result'}],evidenceClass:'DIRECT_METADATA_DECLARATION',verificationStatus:'EXTERNAL-UNVERIFIED'},
 {index:4739,name:'ApplyTowerDamage',token:'0x06001284',offset:3224254,commit:'abc',sourceFile:'GRE/1/01_game_fundamentals.json',ownerType:{index:618,name:'Main',namespace:'Game'},parameters:[{name:'damage'}],evidenceClass:'DIRECT_METADATA_DECLARATION',verificationStatus:'EXTERNAL-UNVERIFIED'}
];
const index = buildGreMethodSearchIndex(methods,[{typeIndex:314,domain:'02_enemies'},{typeIndex:314,domain:'04_combat_mechanics'},{typeIndex:618,domain:'01_game_fundamentals'}]);
assert.equal(index.length,3);
assert.deepEqual(index[0].domainMemberships,['02_enemies','04_combat_mechanics']);
assert.equal(searchGreMethods(index,{query:'damage reduction',domain:'combat'}).length,2);
const result = linkGreClaimsToMethods({methods});
assert.ok(result.links.some(item=>item.claimId==='CLM-D04-DR-007'&&item.methodToken==='0x060008f8'));
assert.ok(result.links.some(item=>item.claimId==='CLM-D04-DR-008'&&item.methodToken==='0x06001284'));
assert.ok(result.links.every(item=>item.semanticRelationshipInferred===false));
console.log(JSON.stringify({test:'GRE structural method search and exact claim references',status:'PASSED',indexedMethods:index.length,exactReferenceLinks:result.links.length,semanticRelationshipsInferred:false},null,2));
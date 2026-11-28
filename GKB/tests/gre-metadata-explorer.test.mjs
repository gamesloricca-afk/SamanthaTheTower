import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
 loadGreExplorerData, listGreDomains, listGreTypes, getGreType,
 getGreMethod, getGreClaim, searchGreMetadata
} from '../adapter/gre-metadata-explorer.mjs';
const dir = fs.mkdtempSync(path.join(os.tmpdir(),'gre-explorer-'));
const write = (name, rows) => fs.writeFileSync(path.join(dir,name),rows.map(x=>JSON.stringify(x)).join('\n')+'\n');
try {
 const type1={recordKind:'GRE_TYPE_DECLARATION',index:10,name:'Enemy',namespace:'Game',token:'0x0200000a',offset:100,fields:[{}],properties:[],commit:'abc',verificationStatus:'EXTERNAL-UNVERIFIED'};
 const type2={recordKind:'GRE_TYPE_DECLARATION',index:11,name:'Tower',namespace:'Game',token:'0x0200000b',offset:200,fields:[],properties:[{}],commit:'abc',verificationStatus:'EXTERNAL-UNVERIFIED'};
 const method1={recordKind:'GRE_METHOD_DECLARATION',index:101,name:'CalculateDamageReductionResult',token:'0x06000065',offset:500,ownerType:{index:10,name:'Enemy',namespace:'Game'},parameters:[{name:'incomingDamage'}],commit:'abc',evidenceClass:'DIRECT_METADATA_DECLARATION',verificationStatus:'EXTERNAL-UNVERIFIED'};
 const method2={recordKind:'GRE_METHOD_DECLARATION',index:102,name:'ApplyTowerDamage',token:'0x06000066',offset:600,ownerType:{index:11,name:'Tower',namespace:'Game'},parameters:[{name:'damage'}],commit:'abc',evidenceClass:'DIRECT_METADATA_DECLARATION',verificationStatus:'EXTERNAL-UNVERIFIED'};
 write('gre-types.jsonl',[type1,type2]);
 write('gre-methods.jsonl',[method1,method2]);
 write('gre-domain-memberships.jsonl',[{typeIndex:10,domain:'02_enemies'},{typeIndex:10,domain:'04_combat_mechanics'},{typeIndex:11,domain:'01_game_fundamentals'}]);
 write('gre-claim-method-links.jsonl',[{claimId:'CLM-001',methodToken:'0x06000065',methodIndex:101,relationship:'REFERENCES_STRUCTURAL_DECLARATION',verificationStatus:'EXTERNAL-UNVERIFIED'}]);
 const data=loadGreExplorerData(dir);
 assert.equal(listGreDomains(data).length,3);
 assert.equal(listGreDomains(data).find(x=>x.domain==='02_enemies').methodCount,1);
 assert.equal(listGreTypes(data,{domain:'combat'}).length,1);
 assert.equal(getGreType(data,'10').methods.length,1);
 assert.equal(getGreMethod(data,'0x06000066').method.methodName,'ApplyTowerDamage');
 assert.equal(getGreMethod(data,'CalculateDamageReductionResult').found,true);
 assert.equal(getGreClaim(data,'CLM-001').references.length,1);
 assert.equal(searchGreMetadata(data,{query:'damage',domain:'enemies'}).methods.length,1);
 assert.equal(getGreType(data,'missing').found,false);
 console.log(JSON.stringify({test:'GRE metadata explorer navigation and search',status:'PASSED',domainCount:3,typeCount:2,methodCount:2,claimReferenceCount:1},null,2));
} finally { fs.rmSync(dir,{recursive:true,force:true}); }
import pathlib,struct,re,json,hashlib,collections,math,zipfile
src=pathlib.Path('/mnt/data/DOC-20261127-WA0002.bin'); b=src.read_bytes(); out=pathlib.Path('/mnt/data/Tower_Metadata_Knowledge');out.mkdir(exist_ok=True)
sections=[dict(index=i,offset=o,size=s,count=n) for i,(o,s,n) in enumerate(struct.iter_unpack('<III',b[8:380]))]; assert all(x['offset']+x['size']<=len(b) for x in sections)
labels={0:'literal_offsets',1:'literal_data',2:'identifier_strings',3:'events_candidate',4:'properties',5:'methods',6:'parameter_defaults_candidate',7:'field_defaults',8:'default_data',9:'field_marshaled_sizes_candidate',10:'parameters',11:'fields',12:'generic_parameters_candidate',13:'generic_constraints_candidate',14:'generic_containers_candidate',15:'nested_types_candidate',16:'interfaces_candidate',17:'vtable_methods_candidate',18:'interface_offsets_candidate',19:'types',20:'images',21:'assemblies_candidate',22:'field_refs_candidate',23:'referenced_assemblies_candidate',24:'attribute_data_candidate',25:'attribute_ranges_candidate',26:'unresolved_call_types_candidate',27:'unresolved_call_ranges_candidate',28:'empty_unknown',29:'empty_unknown',30:'exported_types_candidate'}
for s in sections:s['label']=labels[s['index']];s['record_size']=s['size']//s['count'] if s['count'] and s['size']%s['count']==0 else None

def row(t,i):
 s=sections[t]; assert 0<=i<s['count']; z=s['record_size']; assert z; o=s['offset']+i*z;return b[o:o+z],o

def st(i):
 s=sections[2]; assert 0<=i<s['size']; o=s['offset']+i;end=b.index(0,o,s['offset']+s['size']);return b[o:end].decode('utf-8','replace')
def u(r,o=0):return struct.unpack_from('<I',r,o)[0]
def I(r,o=0):return struct.unpack_from('<i',r,o)[0]
def h(r,o=0):return struct.unpack_from('<H',r,o)[0]
def dump(p,x): (out/p).write_text(json.dumps(x,ensure_ascii=False,indent=2,allow_nan=False)+'\n')
def text(p,x): (out/p).write_text(x+'\n')
images=[]
for j in range(sections[20]['count']):
 r,o=row(20,j); images.append(dict(index=j,name=st(u(r)),type_start=h(r,8),type_count=u(r,10),offset=o))
assert sum(x['type_count'] for x in images)==sections[19]['count']; assert all(x['type_start']==sum(y['type_count'] for y in images[:i]) for i,x in enumerate(images)); game=images[0];assert game['name']=='Assembly-CSharp.dll'
# All type names and runtime type references; byval index maps only direct type definitions, not arrays/byrefs/generic instantiations.
alltypes=[];refmap={}
for i in range(sections[19]['count']):
 r,o=row(19,i);name,ns=st(u(r)),st(u(r,4)); x=dict(index=i,name=name,namespace=ns,byval_type_index=h(r,8),declaring_type_ref=h(r,10),parent_type_ref=h(r,12),token=f'0x{u(r,72):08x}',offset=o);alltypes.append(x);refmap.setdefault(h(r,8),[]).append(i)
def ref(i):
 a=refmap.get(i,[]);return dict(index=i,resolved_type=(alltypes[a[0]]['namespace']+'.' if alltypes[a[0]]['namespace'] else '')+alltypes[a[0]]['name'] if len(a)==1 else None)
def integer(raw):
 if not raw:return None
 x=raw[0]
 if x<128:v=x;n=1
 elif x<192 and len(raw)>=2:v=((x&63)<<8)|raw[1];n=2
 elif x<224 and len(raw)>=4:v=((x&31)<<24)|(raw[1]<<16)|(raw[2]<<8)|raw[3];n=4
 elif x==240 and len(raw)>=5:v=u(raw,1);n=5
 elif x==254:v=0xfffffffe;n=1
 elif x==255:v=0xffffffff;n=1
 else:return None
 return (-(v>>1)-1 if v&1 else v>>1) if n==len(raw) else None
# Determine default record boundaries using both field and parameter default tables.
fd={}; offsets=set()
for table in (6,7):
 for i in range(sections[table]['count']):
  r,o=row(table,i);idx=u(r);ty=h(r,4);pos=I(r,6)
  if pos>=0: offsets.add(pos)
  if table==7:fd[idx]=(ty,pos,o)
end=sections[8]['size']; positions=sorted(offsets|{end});nextpos=dict(zip(positions,positions[1:]));base=sections[8]['offset']
# Primitive type references corroborated by direct definitions if available and known sequence of enum constants.
consts=[]; types=[]; checks=collections.Counter()
for i in range(game['type_count']):
 r,o=row(19,i); x=dict(alltypes[i]); f,m,e,p=struct.unpack_from('<iiii',r,20);mc,pc,fc,ec=struct.unpack_from('<HHHH',r,52); x.update(fields=[],methods=[],properties=[],event_count=ec,raw_type_record_hex=r.hex(),parent=ref(h(r,12)),declaring_type=ref(h(r,10)))
 for j in range(f,f+fc):
  q,off=row(11,j); assert u(q,6)>>24==4; v=dict(index=j,name=st(u(q)),type_ref=ref(h(q,4)),token=f'0x{u(q,6):08x}',offset=off)
  if j in fd:
   ty,pos,rec=fd[j]; d=dict(type_ref=ref(ty),data_index=pos,record_offset=rec)
   if pos>=0 and pos in nextpos:
    raw=b[base+pos:base+nextpos[pos]];d.update(data_offset=base+pos,raw_hex=raw.hex(),byte_count=len(raw));val=None
    if ty==21732: val=integer(raw);d['encoding']='candidate compressed signed int32'
    elif ty==26340 and len(raw)==4:
     v0=struct.unpack('<f',raw)[0];val=v0 if math.isfinite(v0) else None;d['encoding']='candidate float32 little endian'
    if val is not None:d['decoded_value']=val;d['status']='DECODED_CANDIDATE'
    else:d['status']='RAW_ONLY'
   v['default']=d;consts.append(dict(owner=x['name'],type_index=i,field=v['name'],field_index=j,**d))
  x['fields'].append(v);checks['fields']+=1
 for j in range(m,m+mc):
  q,off=row(5,j);assert h(q,4)==i,(i,j,h(q,4));assert u(q,18)>>24==6;start=I(q,12);count=h(q,28);params=[]
  for k in range(start,start+count):
   z,po=row(10,k);assert u(z,4)>>24==8;params.append(dict(index=k,name=st(u(z)),type_ref=ref(h(z,8)),offset=po));checks['parameters']+=1
  x['methods'].append(dict(index=j,name=st(u(q)),return_type_ref=ref(h(q,6)),parameters=params,token=f'0x{u(q,18):08x}',offset=off,raw_record_hex=q.hex()));checks['methods']+=1
 for j in range(p,p+pc):
  q,off=row(4,j); assert u(q,16)>>24==23; g,s=I(q,4),I(q,8); assert g==-1 or 0<=g<mc;assert s==-1 or 0<=s<mc;x['properties'].append(dict(index=j,name=st(u(q)),getter_method_index=m+g if g>=0 else None,setter_method_index=m+s if s>=0 else None,offset=off,token=f'0x{u(q,16):08x}'));checks['properties']+=1
 types.append(x)
print('checks',checks,'types',len(types),'constants',len(consts),'primitive refs',ref(21732),ref(26340))
# Domain grouping uses symbol names and deliberately allows overlap.
patterns={
'01_game_fundamentals':r'^(Main|GameClock|GameInitializer|GameplayUI|StatType|ActiveStatsTracker|FTUEManager|StatDefinition|StatsValueCalculator|StatsConfiguration)$',
'02_enemies':r'enemy|^DamageSource$|^FleetType$|^PoolType$|MiniBoss|BossNet|BossProjectile|VampireController|SummonPortal',
'03_battle_conditions':r'BattleCondition|HeatDefinition|Dissonance|Tournament|WaveInfo|BattleHistory|BattlePreset',
'04_combat_mechanics':r'^(Main|Enemy|DamageData|HitData|DamageReductionResult|Projectile|ProjectileType|Shock|ShockManager|Shockwave|LandMine|LandMineController|DeathRay|DeathRayController|TargetPriorityIndexPositions|LifeSaverType|LifeSavingOrderingPanel|StatsValueCalculator|ActiveStatsTracker|TowerBuddy)$',
'05_ultimate_weapons':r'BlackHole|GoldenTower|Deathwave|ChronoField|SmartMissile|SpotMissile|Spotlight|Swamp|ChainLightning|UltimateWeapon|WeaponChoice|^Main$',
'06_workshop':r'Workshop|^Main$|^UpgradeType$|^UpgradeMultiplier$|^PlayerData$',
'07_workshop_enhancements':r'Enhancement|^Main$|^PlayerData$',
'08_research':r'^Lab|Research|CompletedLab|^PlayerData$',
'09_modules':r'Module|^EffectRarity$|^SubstatsCluster|^Main$',
'10_cards_masteries':r'Card|Mastery|^Main$|^PlayerData$',
'11_bots':r'^Bot|UserBotData|Synchronicity|^Main$',
'12_guardians':r'Guardian|TowerBuddy|ChipType|ChipTile|GuildBuddy|BuddyModifier|^Main$',
'13_perks':r'Perk|^Main$|^PlayerData$',
'14_relics':r'Relic|^Main$',
'15_vault':r'Vault|TechTree|^Main$',
'16_economy_progression':r'Currency|RecoveryPackage|CoinBonus|Milestone|Mission|CalendarEvent|^Main$|^PlayerData$|^Bots$|^ModuleManager$',
'17_formulas_calculations':r'^Main$|^Enemy$|^StatsValueCalculator$|^DamageReductionResult$|^Lab$|^ModuleManager$|^Bots$|^UltimateWeaponStats$',
'18_strategy_interactions':r'^Main$|^Enemy$|^BlackHoleController$|^DeathwaveController$|^GoldenTower$|^ModuleManager$|^Bots$|^GlobalPresetManager$',
'19_version_history':r'Migration|^PlayerData$|^VersionLockManager$|^ModuleManager$|^SaveLoad$',
'20_experimental_community':r'^BetaModule|^Dissonance|^DevPanelUWEffectsState$'}
# Experimental category holds in-client feature markers only, not community evidence.
core=[]; matched=set(); domains={}
for domain,pat in patterns.items():
 ids={x['index'] for x in types if re.search(pat,x['name'],re.I) and not x['name'].startswith('<')};
 # Nested definitions selected by declared parent reference when resolved.
 changed=True
 while changed:
  old=len(ids); refs={types[i]['byval_type_index'] for i in ids};ids.update(x['index'] for x in types if x['declaring_type_ref'] in refs);changed=len(ids)>old
 matched|=ids;domains[domain]=sorted(ids);dump(domain+'.json',{'domain':domain,'evidence_status':'DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified','type_indices':sorted(ids),'types':[types[i] for i in sorted(ids)]})
dump('all_game_types.json',types);dump('other_game_assembly_types.json',[x for x in types if x['index'] not in matched]);dump('all_assembly_index.json',images);dump('all_type_names.json',alltypes);dump('field_defaults.json',consts)
# String literals split by actual offset table, not arbitrary printable runs.
s0,s1=sections[:2]; offs=struct.unpack_from('<%dI'%s0['count'],b,s0['offset']);assert all(a<=z for a,z in zip(offs,offs[1:]));assert offs[-1]<=s1['size'];print('literal end',offs[-1],s1['size'])
lit=[];keywords=re.compile(r'black hole|golden tower|death wave|chrono field|spotlight|poison swamp|smart missile|chain lightning|inner land mine|enemy|enemies|protector|saboteur|commander|overcharge|scatter|vampire|tournament|wave accelerator|recovery package|galaxy compressor|multiverse nexus|flame bot|golden bot|module|workshop|enhancement|relic|guardian|vault|mastery|perk|ultimate weapon|cooldown|synchronicity|damage reduction',re.I)
for i,(a,z) in enumerate(zip(offs,offs[1:])):
 raw=b[s1['offset']+a:s1['offset']+z];s=raw.decode('utf8','replace')
 if keywords.search(s) and not re.search(r'https?://|password|api.?key|authorization|token=|@\w+\.',s,re.I):lit.append(dict(index=i,offset=s1['offset']+a,length=z-a,text=s))
dump('gameplay_string_literals.json',lit);text('gameplay_string_literals.txt','\n'.join(f"[{x['index']} @ 0x{x['offset']:x}] {x['text']}" for x in lit))
# Evidence-linked mechanism notes: existence only, not call graph.
def member(t,n):
 x=next(y for y in types if y['name']==t);return next((z for k in ('methods','fields','properties') for z in x[k] if z['name']==n),None)
notes=[('Enemy behavior','Enemy',['EnemyMovement','EnemyUpdate','Attack','RangedAttack','VampireAttack','SaboteurAttack','CommanderBuffArea','OverchargeAttack','GetCurrentOverchargeAttackInterval','GetCurrentCommanderBuffInterval','GetCurrentSaboteurAttackInterval','UpdateUltimateFastLinkedEnemies','inProtector','inBlackHole','blackHoleTime','shockStack','burnStack','poisonCount','stunTime','flameBotDamageReduction','boostedFlameBotDamageReduction','thunderDamageReduction','CalculateDamageReductionResult','ApplyDamageReductionStats'],'Separate movement, attacks, state tracking and reduction routines exist; precise execution order and stacking are not recoverable here.'),('UW interactions','Enemy',['GoldenTowerBonus','BlackHoleCoinBonus','DeathWaveCoinBonus','DeathWaveCellBonus','SpotlightCoinBonus','OrbCoinBonus','BountyCoinBonus','BlackHoleDamage','BlackHolePlusDamage','DeathwaveFinalDamage','markedByDeathwave','deathwaveEnemyAmplifier','spawnedDuringGoldenTower','inBlackHolePlus'],'Enemy-level handlers expose multiple economy and combat effects; this is evidence for separate named mechanisms, not proof they multiply or trigger together.'),('UW cooldown and sync','Main',['GetAverageUltimateCooldownMultiverseNexus','GetBlackHoleDuration','GetBlackHoleCooldown','GetGoldenTowerCooldown','GetDeathwaveCooldown','GetGoldenTowerDuration','ApplyRecoveryPackage','SpawnRecoveryPackage'],'Dedicated MVN and cooldown functions exist. Arithmetic, package RNG, banked activations and exact pBH thresholds require method bodies.'),('Black Hole lifecycle','BlackHoleController',['get_Active','get_Duration','timer','activeTimer','blackHoleAlreadyActive','usingSecondGroup','blackHoles2','Play','DoPlay','CheckTimer','ForceStop','BlackHolePlusDamage'],'Two group identifiers and timer state are visible. No conclusion about banked activations or simultaneous group behavior follows solely from names.'),('Bots and synchronization','Bots',['GetCooldownTimers','SetCooldownTimers','GetBotBenefit','GetWildfireDuration','IsBotSynchronized','SynchronicityUpgrade','FindSynchronicityLeadBot','baseBenefit','benefitPerLevel'],'Bot benefit tables and synchronization interfaces exist; runtime values and formula order remain unknown.'),('Module migration and effects','ModuleManager',['GetSlotLevel','GetPrimarySlotLevel','GetAssistSlotLevel','MigrateModuleLevelsToSlots','TryCarePackageDrop','GetAssistModuleUniqueEffectEfficiency','GetAssistModuleMainEffectEfficiency','GetAssistModuleSubstatEfficiency','IsCappedAssistSubstatEffect'],'Primary and assist slot levels, efficiency and migration are separate interfaces; the metadata alone cannot recover GComp rarity reductions or assist caps.'),('Death Wave progression','Main',['ApplyDeathWaveHealthFromKill','ApplyDeathWaveHealthMultiplierGain','DEATH_WAVE_HEALTH_MULTIPLIER_PER_KILL'],'Health-from-kill and multiplier gain have named routines; the constant is separately extracted, but exact conditions and cap remain unknown.'),('Economy and recovery','Main',['CalculateCoinBonuses','GetThemesCoinBonus','SpawnRecoveryPackage','ApplyRecoveryPackage','ApplyAllyRecoveryPackage','GetProtectorRadiusGrowthFactor'],'Separate economy, recovery and protector calculations are exposed; no package chance or boss frequency formula inferred.'),('Save version and schema','PlayerData',['get_VersionNumber','get_DataVersion','slotLevels','moduleCannonShardsLifetime','moduleCannonShardsLifetime_v2','moduleRerollCurrencyLifetime','moduleRerollCurrencyLifetime_v2'],'Both legacy and v2 members and version accessors are present. This supports coexistence, not equivalence or a conversion factor.')]
links=[];md=['# Mechanism evidence map','Every item below is a declaration observed in the uploaded binary, not a reconstructed implementation. Offsets are absolute decimal/hex byte positions.']
for title,t,names,meaning in notes:
 md+=['\n## '+title,meaning]; evidence=[]
 for n in names:
  v=member(t,n)
  if v:
   evidence.append(dict(owner=t,member=n,offset=v['offset'],index=v['index']));md.append(f'- `{t}.{n}` — offset `0x{v["offset"]:x}`')
 links.append(dict(subject=title,status='DIRECT_METADATA_SYMBOLS; INTERPRETATION_LIMITED',interpretation=meaning,evidence=evidence))
dump('mechanism_evidence.json',links);text('MECHANISMS.md','\n'.join(md))
# Per-domain readable index, including all key names and counts; full methods in JSON.
for name,ids in domains.items():
 lines=['# '+name[3:].replace('_',' ').title(),'Source: Assembly-CSharp.dll metadata v39. Types may appear in more than one domain. Names are not proof of runtime behavior.','',f'{len(ids)} type records. Full field, method and property records in `{name}.json`.']
 for i in ids:
  x=types[i]
  if x['name'].startswith('<'):continue
  lines+=['\n## '+x['name'],f'Type #{i}, offset `0x{x["offset"]:x}`. Fields: {len(x["fields"])}; methods: {len(x["methods"])}; properties: {len(x["properties"])}.']
  selected=[v['name'] for v in x['methods'] if not v['name'].startswith(('get_','set_','<','add_','remove_')) and v['name'] not in ('.ctor','.cctor')];lines.append('Methods: '+(', '.join('`'+n+'`' for n in selected) or 'none selected'))
  cs=[v for v in x['fields'] if 'default' in v and 'decoded_value' in v['default']];
  if cs:lines.append('Candidate decoded constants: '+', '.join(f'`{v["name"]} = {v["default"]["decoded_value"]:.9g}`' for v in cs))
 text(name+'.md','\n'.join(lines))
# Focused defaults, raw values, validation report.
focused=[c for c in consts if c['owner'] in ('Enemy','Main','Bots','ModuleManager','BlackHoleController','GoldenTower','DeathwaveController','Lab','Perks','TowerBuddy','VaultManager')]
text('IMPORTANT_CONSTANTS.md','# Candidate decoded gameplay constants\n\nPrimitive decoding is based on inferred type reference encoding; no units or use sites are inferred. Raw bytes and offsets are retained. Float32 precision is displayed compactly.\n\n'+'\n'.join(f'- `{c["owner"]}.{c["field"]}` = **{c["decoded_value"]:.9g}** (offset `0x{c["data_offset"]:x}`, raw `{c["raw_hex"]}`)' for c in focused if 'decoded_value' in c))
report=dict(source=src.name,sha256=hashlib.sha256(b).hexdigest(),size=len(b),metadata_version=u(b,4),sections=sections,assemblies=len(images),total_types=len(alltypes),game_types=len(types),game_methods=checks['methods'],game_fields=checks['fields'],game_properties=checks['properties'],game_parameters=checks['parameters'],game_field_defaults=len(consts),candidate_decoded_defaults=sum('decoded_value' in c for c in consts),gameplay_literal_matches=len(lit),domain_counts={k:len(v) for k,v in domains.items()},domain_unique_types=len(matched),checks=['All section bounds checked','Image type ranges contiguous and sum to total type count','Every extracted method declaring type matches owning type','Method, field, property and parameter token tags checked','Property accessor indices checked','Literal offsets monotonic and bounded'],limitations=['No native executable method bodies, runtime type registration, serialized asset tables or remote configuration provided','Primitive default encodings inferred; do not treat as verified gameplay values','No game release version established by metadata version 39','Domain classification heuristic; overlapping records not independent evidence','Runtime type indices unresolved when no direct type definition matches','String literals are keyword-filtered across all assemblies; owner not established','No call graph or formula reconstruction from names alone'])
dump('manifest.json',report)
text('README.md',f'''# The Tower — reverse-engineered IL2CPP metadata knowledge package

Source: `{src.name}`, {len(b):,} bytes, SHA-256 `{report['sha256']}`. Metadata format version 39 (not a game version).

## Extraction

- {len(images)} assemblies, {len(alltypes):,} type definitions across the file.
- Assembly-CSharp.dll: {len(types):,} types, {checks['methods']:,} methods, {checks['fields']:,} fields, {checks['properties']:,} properties, {checks['parameters']:,} parameter records.
- {len(consts):,} field default records; {report['candidate_decoded_defaults']:,} candidate numeric decodes.
- {len(lit):,} gameplay-related string literals; {len(matched):,} distinct types grouped into 20 overlapping domains.

Start with `MECHANISMS.md`, `IMPORTANT_CONSTANTS.md`, and `manifest.json`. Each domain has a readable Markdown index and detailed JSON. `all_game_types.json` retains the complete game-assembly declaration inventory, including nested/compiler-generated types and types not classified into domains. `all_type_names.json` indexes all assemblies. `field_defaults.json` retains default record bytes and offsets. `gameplay_string_literals.txt` contains the filtered literal evidence, with JSON alongside. `mechanism_evidence.json` is a machine-readable map for Samantha.

## Evidence policy

DIRECT METADATA: names, indices, tokens and byte offsets; DECODED_CANDIDATE: inferred numeric encodings; INFERRED: interpretation of a symbol's role. Do not import these as VERIFIED game mechanics automatically. No game build mapping or executable code is supplied. A metadata method name does not establish the call graph, formula, order, conditional behavior, balance or duration.

## Essential next source for actual executable reverse engineering

Provide the matching native IL2CPP game library (Android `libil2cpp.so`, Windows `GameAssembly.dll`, or corresponding native binary for the same build/architecture). The matching APK's serialized Unity assets may also contain tuning/configuration data. No need to re-upload this file. The package does not contain the original binary, private player export or prior Samantha archives. The original input remains unchanged. GitHub has not been modified.
''')
# Include reproducible extractor, without copying input.
import shutil;shutil.copyfile(__file__,out/'extract_metadata.py')
archive=out.parent/'Tower_Metadata_Knowledge.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(out.iterdir()):z.write(p,p.name)
with zipfile.ZipFile(archive) as z:assert z.testzip() is None; print('archive',archive,len(z.namelist()),archive.stat().st_size)
print(json.dumps({k:v for k,v in report.items() if k not in ('sections','domain_counts')},indent=2))

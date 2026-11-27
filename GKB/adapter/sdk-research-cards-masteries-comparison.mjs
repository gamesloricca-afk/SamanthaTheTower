/**
 * Read-only Research ↔ Cards/Masteries comparison for staged TheTowerSDK catalogs.
 * Exact field comparisons are observations, never canonical mappings.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUNTIME = path.join(ROOT, 'runtime');
const INPUT = path.join(ROOT, 'staging/sdk-domain-catalogs.json');
const OUTPUT = path.join(ROOT, 'reports/sdk-research-cards-masteries-comparison.json');

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const sortedUnique = values => [...new Set(values)].sort();
const valueType = value => value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;

function catalogByDomain(staging, domain) {
  const matches = staging.catalogs.filter(item => item?.domain === domain);
  if (matches.length !== 1) throw new Error(`Expected exactly one ${domain} catalog; found ${matches.length}`);
  return matches[0];
}

function unwrap(catalog) {
  if (!Array.isArray(catalog.records)) throw new TypeError(`${catalog.domain}.records must be an array`);
  return catalog.records.map((entry, index) => {
    if (!isObject(entry) || !Number.isInteger(entry.sourceIndex) || !Object.hasOwn(entry, 'rawRecord') || !isObject(entry.rawRecord)) {
      throw new TypeError(`${catalog.domain} record at position ${index} is not a valid staged object`);
    }
    return { sourceIndex: entry.sourceIndex, raw: entry.rawRecord };
  });
}

function indexValues(records, field) {
  const index = new Map();
  for (const record of records) {
    const value = record.raw[field];
    if (typeof value === 'string' && value.length > 0) index.set(value, [...(index.get(value) ?? []), record]);
  }
  return index;
}

function exactMatches(leftRecords, leftField, rightRecords, rightField) {
  const rightIndex = indexValues(rightRecords, rightField);
  const pairs = [];
  const ambiguous = [];
  for (const left of leftRecords) {
    const value = left.raw[leftField];
    if (typeof value !== 'string' || value.length === 0) continue;
    const matches = rightIndex.get(value) ?? [];
    if (matches.length === 1) pairs.push({ left, right: matches[0] });
    else if (matches.length > 1) ambiguous.push({ left, rightCandidates: matches });
  }
  return { pairs, ambiguous };
}

function nestedArrayProfile(records, field) {
  const entries = records.flatMap(record => Array.isArray(record.raw[field]) ? record.raw[field] : []);
  const types = sortedUnique(entries.map(valueType));
  const objectShapes = new Map();
  for (const value of entries) {
    if (!isObject(value)) continue;
    const keys = Object.keys(value).sort();
    const signature = JSON.stringify(keys);
    objectShapes.set(signature, (objectShapes.get(signature) ?? 0) + 1);
  }
  const numeric = entries.filter(Number.isFinite);
  const lengths = records.map(record => Array.isArray(record.raw[field]) ? record.raw[field].length : null);
  const presentLengths = lengths.filter(Number.isInteger);
  return {
    recordsWithArray: lengths.filter(Number.isInteger).length,
    recordsWithoutArray: lengths.filter(value => value === null).length,
    observedEntryTypes: types,
    entryCount: entries.length,
    numericEntryCount: numeric.length,
    numericMin: numeric.length ? Math.min(...numeric) : null,
    numericMax: numeric.length ? Math.max(...numeric) : null,
    arrayLengthMin: presentLengths.length ? Math.min(...presentLengths) : null,
    arrayLengthMax: presentLengths.length ? Math.max(...presentLengths) : null,
    distinctArrayLengths: sortedUnique(presentLengths).sort((a,b)=>a-b),
    objectKeyShapes: [...objectShapes].map(([signature, occurrenceCount]) => ({
      keys: JSON.parse(signature), occurrenceCount
    })).sort((a,b)=>JSON.stringify(a.keys).localeCompare(JSON.stringify(b.keys)))
  };
}

function fieldProfile(records, field) {
  return {
    field,
    presentCount: records.filter(record => Object.hasOwn(record.raw, field)).length,
    observedTypes: sortedUnique(records.filter(record => Object.hasOwn(record.raw, field)).map(record => valueType(record.raw[field])))
  };
}

export function buildResearchCardsMasteriesComparison(staging) {
  if (!isObject(staging) || !Array.isArray(staging.catalogs)) {
    throw new TypeError('staging.catalogs must be an array');
  }
  const researchCatalog = catalogByDomain(staging, 'Research');
  const cardsCatalog = catalogByDomain(staging, 'Cards and Masteries');
  const research = unwrap(researchCatalog);
  const cards = unwrap(cardsCatalog);

  const idMatches = exactMatches(research, 'slug', cards, 'id');
  const nameMatches = exactMatches(research, 'name', cards, 'name');
  const masteryNameMatches = exactMatches(research, 'name', cards, 'masteryName');

  const researchFields = sortedUnique(research.flatMap(item => Object.keys(item.raw)));
  const cardsFields = sortedUnique(cards.flatMap(item => Object.keys(item.raw)));
  const sharedFields = researchFields.filter(field => cardsFields.includes(field));

  const cardLevelTypes = sortedUnique(cards.map(item => item.raw.levelType).filter(value => typeof value === 'string'));
  const masteryTypes = sortedUnique(cards.map(item => item.raw.masteryType).filter(value => typeof value === 'string'));
  const rarityValues = sortedUnique(cards.map(item => item.raw.rarity).filter(value => typeof value === 'string'));

  const labelCandidates = nameMatches.pairs.map(({left:r,right:c}) => ({
    researchSourceIndex:r.sourceIndex,
    researchSlug:r.raw.slug,
    researchName:r.raw.name,
    cardSourceIndex:c.sourceIndex,
    cardId:c.raw.id,
    cardName:c.raw.name,
    cardRarity:c.raw.rarity ?? null,
    cardMasteryName:c.raw.masteryName ?? null,
    candidateStatus:'EXACT_NAME_CANDIDATE'
  })).sort((a,b)=>String(a.researchSlug).localeCompare(String(b.researchSlug)));

  const masteryCandidates = masteryNameMatches.pairs.map(({left:r,right:c}) => ({
    researchSourceIndex:r.sourceIndex,
    researchSlug:r.raw.slug,
    researchName:r.raw.name,
    cardSourceIndex:c.sourceIndex,
    cardId:c.raw.id,
    cardName:c.raw.name,
    masteryName:c.raw.masteryName,
    candidateStatus:'EXACT_MASTERY_NAME_CANDIDATE'
  })).sort((a,b)=>String(a.researchSlug).localeCompare(String(b.researchSlug)));

  const report = {
    reportVersion:'1.0.0',
    test:'Samantha GKB SDK Research–Cards and Masteries Comparison',
    status:'PASSED',
    source:staging.source ?? null,
    scope:{
      research:{
        domain:'Research',
        sourceRef:researchCatalog.sourceRef,
        exportName:researchCatalog.exportName,
        recordCount:research.length,
        identifierField:'slug',
        labelField:'name'
      },
      cardsAndMasteries:{
        domain:'Cards and Masteries',
        sourceRef:cardsCatalog.sourceRef,
        exportName:cardsCatalog.exportName,
        recordCount:cards.length,
        identifierField:'id',
        labelField:'name',
        masteryLabelField:'masteryName'
      }
    },
    summary:{
      sharedTopLevelFieldCount:sharedFields.length,
      sharedTopLevelFields:sharedFields,
      researchOnlyTopLevelFields:researchFields.filter(field=>!cardsFields.includes(field)),
      cardsAndMasteriesOnlyTopLevelFields:cardsFields.filter(field=>!researchFields.includes(field)),
      exactResearchSlugCardIdMatches:idMatches.pairs.length,
      ambiguousResearchSlugCardIdMatches:idMatches.ambiguous.length,
      exactResearchNameCardNameCandidates:nameMatches.pairs.length,
      ambiguousResearchNameCardNameCandidates:nameMatches.ambiguous.length,
      exactResearchNameCardMasteryNameCandidates:masteryNameMatches.pairs.length,
      ambiguousResearchNameCardMasteryNameCandidates:masteryNameMatches.ambiguous.length,
      explicitCrossCatalogReferenceStatus:'NOT_ESTABLISHED_FROM_SELECTED_FIELDS'
    },
    fieldComparison:{
      sharedFields:sharedFields.map(field=>({
        field,
        research:fieldProfile(research,field),
        cardsAndMasteries:fieldProfile(cards,field)
      })),
      cardCatalogDistributions:{
        rarityValues,
        levelTypeValues:cardLevelTypes,
        masteryTypeValues:masteryTypes
      },
      nestedArrays:{
        researchLevels:nestedArrayProfile(research,'levels'),
        cardLevelValues:nestedArrayProfile(cards,'levelValues'),
        cardMasteryValues:nestedArrayProfile(cards,'masteryValues')
      }
    },
    exactIdentifierCandidates:idMatches.pairs.map(({left:r,right:c})=>({
      researchSourceIndex:r.sourceIndex,
      researchSlug:r.raw.slug,
      researchName:r.raw.name,
      cardSourceIndex:c.sourceIndex,
      cardId:c.raw.id,
      cardName:c.raw.name,
      candidateStatus:'EXACT_SOURCE_IDENTIFIER_CANDIDATE'
    })),
    exactNameCandidates:labelCandidates,
    exactMasteryNameCandidates:masteryCandidates,
    ambiguousCandidates:{
      identifiers:idMatches.ambiguous.map(({left,rightCandidates})=>({
        researchSlug:left.raw.slug,
        researchName:left.raw.name,
        cardCandidates:rightCandidates.map(c=>({sourceIndex:c.sourceIndex,id:c.raw.id,name:c.raw.name}))
      })),
      names:nameMatches.ambiguous.map(({left,rightCandidates})=>({
        researchSlug:left.raw.slug,
        researchName:left.raw.name,
        cardCandidates:rightCandidates.map(c=>({sourceIndex:c.sourceIndex,id:c.raw.id,name:c.raw.name}))
      })),
      masteryNames:masteryNameMatches.ambiguous.map(({left,rightCandidates})=>({
        researchSlug:left.raw.slug,
        researchName:left.raw.name,
        cardCandidates:rightCandidates.map(c=>({sourceIndex:c.sourceIndex,id:c.raw.id,masteryName:c.raw.masteryName}))
      }))
    },
    findings:[
      {
        code:'EXACT_SOURCE_IDENTIFIER_OVERLAP',
        severity:'INFO',
        count:idMatches.pairs.length,
        message:'Research.slug and Cards/Masteries.id exact string equality is reported as a candidate only; identifier namespace equivalence is not assumed.'
      },
      {
        code:'EXACT_CARD_NAME_OVERLAP',
        severity:'INFO',
        count:nameMatches.pairs.length,
        message:'Research.name and Cards/Masteries.name exact text matches are naming candidates, not proof of shared mechanics or entity identity.'
      },
      {
        code:'EXACT_MASTERY_NAME_OVERLAP',
        severity:'INFO',
        count:masteryNameMatches.pairs.length,
        message:'Research.name and Cards/Masteries.masteryName exact text matches are separate candidates; they do not establish that a Research record describes a card mastery.'
      },
      {
        code:'NESTED_ARRAY_SHAPE_DIFFERENCE',
        severity:'INFO',
        count:3,
        message:'Research.levels contains structured objects while card levelValues and masteryValues are inspected as separate arrays. Their values, units, progression, and mechanics are not reconciled.'
      }
    ],
    policy:{
      readOnly:true,
      rawRecordsModified:false,
      recordsMerged:false,
      recordsDeduplicated:false,
      identifiersGenerated:false,
      canonicalMappingsApproved:false,
      canonicalClaimsCreated:false,
      canonicalRelationshipsCreated:false,
      verificationStatusesPromoted:false,
      numericalValuesComparedForGameplayEquivalence:false
    },
    limitations:[
      'This report compares only the Research and Cards/Masteries exports staged from the pinned SDK package.',
      'Exact source-ID or label equality is a candidate observation, not proof of canonical identity or gameplay relationship.',
      'Research.slug is compared only with Cards/Masteries.id; Research.name is compared separately with name and masteryName.',
      'Shared top-level fields do not establish equivalent meaning or data semantics.',
      'Research.levels, card levelValues, and masteryValues have different structural roles in the source records; no progression or numeric equivalence is inferred.',
      'Card rarity, levelType, masteryType, and descriptions are reported as source fields, not interpreted as mechanics.',
      'No external fanmade source comparison or independent gameplay validation is included.',
      'All SDK records remain EXTERNAL-UNVERIFIED.'
    ]
  };
  return report;
}

async function main(){
  const pkg=JSON.parse(await readFile(path.join(RUNTIME,'node_modules/thetowersdk/package.json'),'utf8'));
  if(pkg.version!=='0.14.1') throw new Error(`Expected thetowersdk@0.14.1, got ${pkg.version}`);
  const staging=JSON.parse(await readFile(INPUT,'utf8'));
  const report=buildResearchCardsMasteriesComparison(staging);
  await mkdir(path.dirname(OUTPUT),{recursive:true});
  await writeFile(OUTPUT,JSON.stringify(report,null,2)+'\n','utf8');
  console.log(JSON.stringify({
    test:report.test,
    status:report.status,
    sdkVersion:report.source?.sdkVersion ?? null,
    sdkGameVersion:report.source?.sdkGameVersion ?? null,
    summary:report.summary,
    nestedArrays:report.fieldComparison.nestedArrays,
    policy:report.policy
  },null,2));
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch(error=>{
    console.error(JSON.stringify({test:'Samantha GKB SDK Research–Cards and Masteries Comparison',status:'FAILED',error:error.message},null,2));
    process.exitCode=1;
  });
}

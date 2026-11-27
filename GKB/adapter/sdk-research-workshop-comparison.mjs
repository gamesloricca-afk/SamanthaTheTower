/**
 * Read-only Research ↔ Workshop comparison for staged TheTowerSDK catalogs.
 * Exact text/identifier comparisons are observations, never canonical mappings.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUNTIME = path.join(ROOT, 'runtime');
const INPUT = path.join(ROOT, 'staging/sdk-domain-catalogs.json');
const OUTPUT = path.join(ROOT, 'reports/sdk-research-workshop-comparison.json');

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const sortedUnique = values => [...new Set(values)].sort();
const objectKeyShape = value => isObject(value) ? Object.keys(value).sort() : null;

function catalogByDomain(staging, domain) {
  const matches = staging.catalogs.filter(item => item?.domain === domain);
  if (matches.length !== 1) throw new Error(`Expected exactly one ${domain} catalog; found ${matches.length}`);
  return matches[0];
}

function unwrap(catalog) {
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
    if (typeof value !== 'string' || value.length === 0) continue;
    index.set(value, [...(index.get(value) ?? []), record]);
  }
  return index;
}

function nestedObjectShapes(records, field) {
  const shapes = new Map();
  for (const record of records) {
    const value = record.raw[field];
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      const keys = objectKeyShape(item);
      if (!keys) continue;
      const signature = JSON.stringify(keys);
      shapes.set(signature, (shapes.get(signature) ?? 0) + 1);
    }
  }
  return [...shapes].map(([signature, occurrenceCount]) => ({
    keys: JSON.parse(signature),
    occurrenceCount
  })).sort((a, b) => JSON.stringify(a.keys).localeCompare(JSON.stringify(b.keys)));
}

function numericStats(values) {
  const nums = values.filter(value => Number.isFinite(value));
  return nums.length ? {
    count: nums.length,
    min: Math.min(...nums),
    max: Math.max(...nums),
    distinctCount: new Set(nums).size
  } : null;
}

export function buildResearchWorkshopComparison(staging) {
  if (!isObject(staging) || !Array.isArray(staging.catalogs)) {
    throw new TypeError('staging.catalogs must be an array');
  }
  const researchCatalog = catalogByDomain(staging, 'Research');
  const workshopCatalog = catalogByDomain(staging, 'Workshop');
  const research = unwrap(researchCatalog);
  const workshop = unwrap(workshopCatalog);

  const byWorkshopLabel = indexValues(workshop, 'label');
  const byWorkshopKey = indexValues(workshop, 'key');
  const byWorkshopId = indexValues(workshop, 'key');
  const researchSlugIndex = indexValues(research, 'slug');

  const exactLabelCandidates = [];
  const ambiguousLabelCandidates = [];
  const crossFieldKeyMatches = [];
  for (const item of research) {
    const name = item.raw.name;
    if (typeof name !== 'string') continue;
    const labelMatches = byWorkshopLabel.get(name) ?? [];
    const keyMatches = byWorkshopKey.get(name) ?? [];
    if (labelMatches.length === 1) {
      exactLabelCandidates.push({ research: item, workshop: labelMatches[0] });
    } else if (labelMatches.length > 1) {
      ambiguousLabelCandidates.push({ research: item, workshopCandidates: labelMatches });
    }
    for (const match of keyMatches) {
      crossFieldKeyMatches.push({ research: item, workshop: match });
    }
  }

  const exactIdentifierMatches = [];
  for (const item of research) {
    const matches = byWorkshopId.get(item.raw.slug) ?? [];
    for (const match of matches) exactIdentifierMatches.push({ research: item, workshop: match });
  }

  const researchFields = sortedUnique(research.flatMap(item => Object.keys(item.raw)));
  const workshopFields = sortedUnique(workshop.flatMap(item => Object.keys(item.raw)));
  const sharedFields = researchFields.filter(field => workshopFields.includes(field));
  const researchOnlyFields = researchFields.filter(field => !workshopFields.includes(field));
  const workshopOnlyFields = workshopFields.filter(field => !researchFields.includes(field));

  const pairedLevels = exactLabelCandidates.map(({ research: r, workshop: w }) => ({
    researchSlug: r.raw.slug,
    researchName: r.raw.name,
    workshopKey: w.raw.key,
    workshopLabel: w.raw.label,
    researchCategory: r.raw.category ?? null,
    workshopCategory: w.raw.category ?? null,
    categoryExactEqual: r.raw.category === w.raw.category,
    researchLevelCount: Array.isArray(r.raw.levels) ? r.raw.levels.length : null,
    workshopLevelCount: Array.isArray(w.raw.levels) ? w.raw.levels.length : null,
    researchLevelObjectKeys: sortedUnique((r.raw.levels ?? []).filter(isObject).flatMap(Object.keys)),
    workshopLevelObjectKeys: sortedUnique((w.raw.levels ?? []).filter(isObject).flatMap(Object.keys))
  })).sort((a, b) => a.researchSlug.localeCompare(b.researchSlug));

  const researchLevelRecords = exactLabelCandidates.map(pair => pair.research);
  const workshopLevelRecords = exactLabelCandidates.map(pair => pair.workshop);
  const researchLevelShapes = nestedObjectShapes(researchLevelRecords, 'levels');
  const workshopLevelShapes = nestedObjectShapes(workshopLevelRecords, 'levels');

  const report = {
    reportVersion: '1.0.0',
    test: 'Samantha GKB SDK Research–Workshop Catalog Comparison',
    status: 'PASSED',
    source: staging.source ?? null,
    scope: {
      research: {
        domain: 'Research',
        sourceRef: researchCatalog.sourceRef,
        exportName: researchCatalog.exportName,
        recordCount: research.length,
        identifierField: 'slug',
        labelField: 'name'
      },
      workshop: {
        domain: 'Workshop',
        sourceRef: workshopCatalog.sourceRef,
        exportName: workshopCatalog.exportName,
        recordCount: workshop.length,
        identifierField: 'key',
        labelField: 'label'
      }
    },
    summary: {
      sharedTopLevelFieldCount: sharedFields.length,
      sharedTopLevelFields: sharedFields,
      researchOnlyTopLevelFields: researchOnlyFields,
      workshopOnlyTopLevelFields: workshopOnlyFields,
      exactResearchSlugWorkshopKeyMatches: exactIdentifierMatches.length,
      exactResearchNameWorkshopLabelCandidates: exactLabelCandidates.length,
      ambiguousResearchNameWorkshopLabelCandidates: ambiguousLabelCandidates.length,
      exactResearchNameWorkshopKeyTextMatches: crossFieldKeyMatches.length,
      explicitCrossCatalogReferenceStatus: 'NOT_ESTABLISHED_FROM_SELECTED_FIELDS'
    },
    fieldComparison: {
      sharedFields: sharedFields.map(field => ({
        field,
        researchObservedTypes: sortedUnique(research.map(item => item.raw[field]).filter(value => value !== undefined).map(value => Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value)),
        workshopObservedTypes: sortedUnique(workshop.map(item => item.raw[field]).filter(value => value !== undefined).map(value => Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value))
      })),
      nestedLevelsForExactLabelCandidates: {
        pairedRecordCount: exactLabelCandidates.length,
        researchObjectKeyShapes: researchLevelShapes,
        workshopObjectKeyShapes: workshopLevelShapes,
        researchLevelCountStats: numericStats(pairedLevels.map(item => item.researchLevelCount)),
        workshopLevelCountStats: numericStats(pairedLevels.map(item => item.workshopLevelCount)),
        pairedRecordLevelCounts: pairedLevels
      }
    },
    exactLabelCandidates: exactLabelCandidates.map(({ research: r, workshop: w }) => ({
      researchSourceIndex: r.sourceIndex,
      researchSlug: r.raw.slug,
      researchName: r.raw.name,
      researchCategory: r.raw.category ?? null,
      workshopSourceIndex: w.sourceIndex,
      workshopKey: w.raw.key,
      workshopLabel: w.raw.label,
      workshopCategory: w.raw.category ?? null,
      categoryExactEqual: r.raw.category === w.raw.category,
      researchLevelCount: Array.isArray(r.raw.levels) ? r.raw.levels.length : null,
      workshopLevelCount: Array.isArray(w.raw.levels) ? w.raw.levels.length : null,
      candidateStatus: 'EXACT_LABEL_CANDIDATE'
    })).sort((a, b) => a.researchSlug.localeCompare(b.researchSlug)),
    ambiguousLabelCandidates: ambiguousLabelCandidates.map(({ research: r, workshopCandidates }) => ({
      researchSlug: r.raw.slug,
      researchName: r.raw.name,
      workshopCandidates: workshopCandidates.map(w => ({
        sourceIndex: w.sourceIndex, key: w.raw.key, label: w.raw.label
      }))
    })),
    nameToWorkshopKeyTextMatches: crossFieldKeyMatches.map(({ research: r, workshop: w }) => ({
      researchSlug: r.raw.slug,
      researchName: r.raw.name,
      workshopKey: w.raw.key,
      workshopLabel: w.raw.label,
      classification: 'CROSS_FIELD_TEXT_EQUALITY_NOT_IDENTIFIER_MATCH'
    })).sort((a, b) => a.researchSlug.localeCompare(b.researchSlug)),
    findings: [
      {
        code: 'EXACT_LABEL_OVERLAP',
        severity: 'INFO',
        count: exactLabelCandidates.length,
        message: 'Research.name and Workshop.label have exact text matches. This is a naming candidate only, not proof of identical mechanics or canonical identity.'
      },
      {
        code: 'IDENTIFIER_FIELDS_NOT_EQUAL',
        severity: 'INFO',
        count: exactIdentifierMatches.length,
        message: 'Research.slug and Workshop.key were compared by exact string equality; no semantic or normalized matching was attempted.'
      },
      {
        code: 'NESTED_LEVEL_SHAPE_DIFFERENCE',
        severity: 'INFO',
        count: exactLabelCandidates.length,
        message: 'For exact-label candidate pairs, nested levels object keys are reported separately. Similar field names such as level/value do not establish equivalent meaning.'
      }
    ],
    policy: {
      readOnly: true,
      rawRecordsModified: false,
      recordsMerged: false,
      recordsDeduplicated: false,
      identifiersGenerated: false,
      canonicalMappingsApproved: false,
      canonicalClaimsCreated: false,
      canonicalRelationshipsCreated: false,
      verificationStatusesPromoted: false,
      numericalValuesComparedForGameplayEquivalence: false
    },
    limitations: [
      'This report compares only the Research and Workshop exports staged from the pinned SDK package.',
      'Exact name/label or cross-field text equality is a candidate observation, not proof of entity identity or shared mechanics.',
      'Research.slug and Workshop.key are compared as source identifier fields by exact equality only.',
      'No dedicated cross-catalog reference field was established from the selected top-level field mappings; this does not prove that no relationships exist elsewhere in the SDK.',
      'Shared field names and nested object keys do not establish equivalent units, costs, values, formulas, or gameplay effects.',
      'Numeric values, costs, level progressions, and game mechanics were not reconciled or validated.',
      'All SDK records remain EXTERNAL-UNVERIFIED.'
    ]
  };
  return report;
}

async function main() {
  const pkg = JSON.parse(await readFile(path.join(RUNTIME, 'node_modules/thetowersdk/package.json'), 'utf8'));
  if (pkg.version !== '0.14.1') throw new Error(`Expected thetowersdk@0.14.1, got ${pkg.version}`);
  const staging = JSON.parse(await readFile(INPUT, 'utf8'));
  const report = buildResearchWorkshopComparison(staging);
  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({
    test: report.test,
    status: report.status,
    sdkVersion: report.source?.sdkVersion ?? null,
    sdkGameVersion: report.source?.sdkGameVersion ?? null,
    summary: report.summary,
    policy: report.policy
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(JSON.stringify({ test: 'Samantha GKB SDK Research–Workshop Catalog Comparison', status: 'FAILED', error: error.message }, null, 2));
    process.exitCode = 1;
  });
}

/**
 * Read-only structural audit of staged SDK domain catalogs.
 * Reports shape anomalies and observations; it does not judge game-value correctness.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUNTIME = path.join(ROOT, 'runtime');
const INPUT = path.join(ROOT, 'staging/sdk-domain-catalogs.json');
const OUTPUT = path.join(ROOT, 'reports/sdk-domain-catalog-audit.json');
const require = createRequire(path.join(RUNTIME, 'package.json'));
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const FIELD_MAP = {
  Research: { idField: 'slug', labelField: 'name' },
  Workshop: { idField: 'key', labelField: 'label' },
  'Cards and Masteries': { idField: 'id', labelField: 'name' },
  Perks: { idField: null, labelField: 'perk' }
};
const valueType = value => value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
const stable = value => {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (isObject(value)) return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stable(value[key])).join(',') + '}';
  return JSON.stringify(value);
};

export function buildSdkDomainCatalogAudit(staging) {
  if (!isObject(staging) || !Array.isArray(staging.catalogs)) {
    throw new TypeError('staging.catalogs must be an array');
  }
  const findings = [];
  const catalogReports = [];
  const add = (catalog, code, severity, message, details = {}) => {
    findings.push({ domain: catalog.domain, sourceRef: catalog.sourceRef, code, severity, message, ...details });
  };

  for (const catalog of staging.catalogs) {
    if (!isObject(catalog) || typeof catalog.domain !== 'string' || !Array.isArray(catalog.records)) {
      throw new TypeError('Each catalog requires domain and records[]');
    }
    const fields = FIELD_MAP[catalog.domain];
    if (!fields) throw new Error(`No explicit field audit mapping for domain: ${catalog.domain}`);
    const idCounts = new Map();
    const labelCounts = new Map();
    const rawCounts = new Map();
    const fieldTypes = new Map();
    const fieldPresence = new Map();
    let nonObjectRecords = 0;
    let missingId = 0;
    let missingLabel = 0;
    let emptyRequired = 0;
    let sourceIndexProblems = 0;

    catalog.records.forEach((entry, index) => {
      if (!isObject(entry) || !Number.isInteger(entry.sourceIndex) || !Object.hasOwn(entry, 'rawRecord')) {
        add(catalog, 'INVALID_STAGING_ENTRY', 'ERROR', 'Staged entry is missing a valid sourceIndex or rawRecord.', { recordPosition: index });
        return;
      }
      if (entry.sourceIndex !== index) {
        sourceIndexProblems++;
        add(catalog, 'SOURCE_ORDER_INDEX_MISMATCH', 'WARNING', 'sourceIndex differs from the current staged position.', { recordPosition: index, sourceIndex: entry.sourceIndex });
      }
      const raw = entry.rawRecord;
      if (!isObject(raw)) {
        nonObjectRecords++;
        add(catalog, 'NON_OBJECT_RECORD', 'ERROR', 'Raw catalog record is not an object.', { sourceIndex: entry.sourceIndex, actualType: valueType(raw) });
        return;
      }
      for (const [key, value] of Object.entries(raw)) {
        fieldPresence.set(key, (fieldPresence.get(key) ?? 0) + 1);
        if (!fieldTypes.has(key)) fieldTypes.set(key, new Set());
        fieldTypes.get(key).add(valueType(value));
      }
      const id = fields.idField ? raw[fields.idField] : null;
      const label = raw[fields.labelField];
      if (fields.idField && (typeof id !== 'string' || id.length === 0)) {
        missingId++;
        add(catalog, 'MISSING_OR_EMPTY_SOURCE_ID', 'WARNING', 'Expected source identifier is missing or empty.', { sourceIndex: entry.sourceIndex, field: fields.idField });
      } else if (fields.idField) {
        idCounts.set(id, [...(idCounts.get(id) ?? []), entry.sourceIndex]);
      }
      if (typeof label !== 'string' || label.length === 0) {
        missingLabel++;
        add(catalog, 'MISSING_OR_EMPTY_SOURCE_LABEL', 'WARNING', 'Expected source label is missing or empty.', { sourceIndex: entry.sourceIndex, field: fields.labelField });
      } else {
        labelCounts.set(label, [...(labelCounts.get(label) ?? []), entry.sourceIndex]);
      }
      for (const [field, value] of Object.entries(raw)) {
        if (value === null || value === '') {
          emptyRequired++;
          add(catalog, value === null ? 'NULL_FIELD_VALUE' : 'EMPTY_STRING_FIELD', 'INFO', 'A top-level field contains a null or empty-string value; optionality is not inferred.', { sourceIndex: entry.sourceIndex, field });
        }
      }
      const signature = stable(raw);
      rawCounts.set(signature, [...(rawCounts.get(signature) ?? []), entry.sourceIndex]);
    });

    const duplicateIds = [...idCounts].filter(([, indices]) => indices.length > 1);
    for (const [value, indices] of duplicateIds) {
      add(catalog, 'DUPLICATE_SOURCE_ID', 'ERROR', 'A source identifier occurs more than once within this catalog.', { field: fields.idField, value, sourceIndices: indices });
    }
    const repeatedLabels = [...labelCounts].filter(([, indices]) => indices.length > 1);
    for (const [value, indices] of repeatedLabels) {
      add(catalog, 'REPEATED_SOURCE_LABEL', 'INFO', 'A label occurs more than once; repeated labels are not assumed to be duplicate entities.', { field: fields.labelField, value, sourceIndices: indices });
    }
    const exactDuplicates = [...rawCounts].filter(([, indices]) => indices.length > 1);
    for (const [, indices] of exactDuplicates) {
      add(catalog, 'EXACT_DUPLICATE_RECORD', 'WARNING', 'Structurally identical raw records occur more than once; source records are preserved.', { sourceIndices: indices });
    }
    for (const [field, types] of fieldTypes) {
      if (types.size > 1) add(catalog, 'FIELD_TYPE_VARIATION', 'INFO', 'A field has multiple observed JSON types; no coercion was attempted.', { field, observedTypes: [...types].sort() });
    }
    const expectedCount = catalog.recordCount;
    if (expectedCount !== catalog.records.length) {
      add(catalog, 'RECORD_COUNT_MISMATCH', 'ERROR', 'recordCount does not equal records.length.', { declaredCount: expectedCount, actualCount: catalog.records.length });
    }
    const observedKeys = [...new Set(catalog.records.flatMap(entry => isObject(entry?.rawRecord) ? Object.keys(entry.rawRecord) : []))].sort();
    if (Array.isArray(catalog.observedRecordKeys) && stable(observedKeys) !== stable([...catalog.observedRecordKeys].sort())) {
      add(catalog, 'OBSERVED_KEYS_MISMATCH', 'WARNING', 'observedRecordKeys differs from keys found in raw records.', { declaredKeys: catalog.observedRecordKeys, actualKeys: observedKeys });
    }

    catalogReports.push({
      domain: catalog.domain,
      sourceRef: catalog.sourceRef,
      recordCount: catalog.records.length,
      idField: fields.idField,
      labelField: fields.labelField,
      missingId,
      missingLabel,
      nonObjectRecords,
      duplicateSourceIdGroups: duplicateIds.length,
      repeatedLabelGroups: repeatedLabels.length,
      exactDuplicateRecordGroups: exactDuplicates.length,
      sourceIndexProblems,
      fieldCount: fieldTypes.size,
      fields: [...fieldTypes].sort(([a], [b]) => a.localeCompare(b)).map(([field, types]) => ({
        field, observedTypes: [...types].sort(), presentCount: fieldPresence.get(field),
        absentCount: catalog.records.length - (fieldPresence.get(field) ?? 0)
      }))
    });
  }

  const severityCounts = Object.fromEntries(['ERROR', 'WARNING', 'INFO'].map(level => [level, findings.filter(item => item.severity === level).length]));
  return {
    reportVersion: '1.0.0',
    test: 'Samantha GKB SDK Domain Catalog Structural Audit',
    status: 'PASSED',
    source: staging.source ?? null,
    scope: { catalogCount: staging.catalogs.length, totalRecords: staging.catalogs.reduce((sum, item) => sum + (Array.isArray(item.records) ? item.records.length : 0), 0) },
    summary: { severityCounts, findingCount: findings.length, catalogReports },
    findings,
    policy: {
      readOnly: true, rawRecordsModified: false, recordsDeduplicated: false,
      valuesNormalized: false, missingFieldsInferredOptionality: false,
      gameMechanicsValidated: false, canonicalClaimsCreated: false,
      canonicalImportPerformed: false
    },
    limitations: [
      'This is a structural audit of the selected staged SDK exports only.',
      'Required identity fields are limited to the explicit SDK field mapping for each selected export.',
      'Repeated labels are observations, not proof of duplicate entities.',
      'Null and empty values are reported without assuming whether the field is optional.',
      'No numerical game values, formulas, units, or mechanics are validated.',
      'All SDK records remain EXTERNAL-UNVERIFIED.'
    ]
  };
}

async function main() {
  const pkg = JSON.parse(await readFile(path.join(RUNTIME, 'node_modules/thetowersdk/package.json'), 'utf8'));
  if (pkg.version !== '0.14.1') throw new Error(`Expected thetowersdk@0.14.1, got ${pkg.version}`);
  const staging = JSON.parse(await readFile(INPUT, 'utf8'));
  const report = buildSdkDomainCatalogAudit(staging);
  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({ ...report, findings: undefined }, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(JSON.stringify({ status: 'FAILED', error: error.message }, null, 2)); process.exitCode = 1; });
}

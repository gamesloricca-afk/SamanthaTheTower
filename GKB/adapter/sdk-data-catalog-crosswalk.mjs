/**
 * SDK-to-SDK candidate crosswalk: knowledge graph nodes to selected data catalogs.
 * This is not a Samantha canonical identifier mapping.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUNTIME = path.join(ROOT, 'runtime');
const OUTPUT = path.join(ROOT, 'reports/sdk-data-catalog-crosswalk.json');
const require = createRequire(path.join(RUNTIME, 'package.json'));

const FIELD_MAP = {
  Research: { idField: 'slug', labelField: 'name' },
  Workshop: { idField: 'key', labelField: 'label' },
  'Cards and Masteries': { idField: 'id', labelField: 'name' },
  Perks: { idField: null, labelField: 'perk' }
};
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function buildSdkDataCatalogCrosswalk({ graph, staging, sdkVersion, retrievedAt }) {
  if (!isObject(graph) || !Array.isArray(graph.nodes)) throw new TypeError('graph.nodes must be an array');
  if (!isObject(staging) || !Array.isArray(staging.catalogs)) throw new TypeError('staging.catalogs must be an array');
  if (typeof sdkVersion !== 'string' || !sdkVersion) throw new TypeError('sdkVersion is required');
  if (typeof retrievedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(retrievedAt) ||
      Number.isNaN(new Date(retrievedAt + 'T00:00:00.000Z').getTime()) ||
      new Date(retrievedAt + 'T00:00:00.000Z').toISOString().slice(0, 10) !== retrievedAt) {
    throw new TypeError('retrievedAt must be a valid YYYY-MM-DD date');
  }

  const catalogs = staging.catalogs.map(catalog => {
    const fields = FIELD_MAP[catalog.domain];
    if (!fields) throw new Error(`No explicit SDK field mapping for domain: ${catalog.domain}`);
    if (!Array.isArray(catalog.records)) throw new TypeError(`${catalog.domain}.records must be an array`);
    return { ...catalog, fields };
  });

  const records = graph.nodes.map((node, nodeIndex) => {
    if (!isObject(node)) throw new TypeError(`graph.nodes[${nodeIndex}] must be an object`);
    const domainCandidates = catalogs.map(catalog => {
      const { idField, labelField } = catalog.fields;
      const matches = catalog.records.flatMap(stagedRecord => {
        const raw = stagedRecord.rawRecord;
        if (!isObject(raw)) return [];
        const methods = [];
        if (idField && typeof node.id === 'string' && typeof raw[idField] === 'string' && node.id === raw[idField]) {
          methods.push('EXACT_SOURCE_ID');
        }
        if (typeof node.label === 'string' && typeof raw[labelField] === 'string' && node.label === raw[labelField]) {
          methods.push('EXACT_LABEL');
        }
        return methods.length ? [{
          sourceIndex: stagedRecord.sourceIndex,
          sourceIdField: idField,
          sourceId: idField ? raw[idField] : null,
          sourceLabelField: labelField,
          sourceLabel: raw[labelField],
          matchMethods: methods
        }] : [];
      });
      const unique = new Map(matches.map(match => [match.sourceIndex, match]));
      const candidates = [...unique.values()];
      const exactIdCount = candidates.filter(item => item.matchMethods.includes('EXACT_SOURCE_ID')).length;
      const exactLabelCount = candidates.filter(item => item.matchMethods.includes('EXACT_LABEL')).length;
      let status = 'UNMATCHED';
      if (candidates.length > 1) status = 'AMBIGUOUS';
      else if (exactIdCount === 1) status = 'EXACT_SOURCE_ID_MATCH';
      else if (exactLabelCount === 1) status = 'EXACT_LABEL_CANDIDATE';
      return {
        domain: catalog.domain,
        sourceRef: catalog.sourceRef,
        sourceIdField: idField,
        sourceLabelField: labelField,
        status,
        candidateCount: candidates.length,
        candidates
      };
    });
    return {
      sdkNodeIndex: nodeIndex,
      sdkNodeId: typeof node.id === 'string' ? node.id : null,
      sdkNodeLabel: typeof node.label === 'string' ? node.label : null,
      domainCandidates
    };
  });

  const domainSummary = catalogs.map(catalog => {
    const rows = records.map(record => record.domainCandidates.find(item => item.domain === catalog.domain));
    return {
      domain: catalog.domain,
      sourceRef: catalog.sourceRef,
      sourceIdField: catalog.fields.idField,
      sourceLabelField: catalog.fields.labelField,
      exactSourceIdMatches: rows.filter(item => item.status === 'EXACT_SOURCE_ID_MATCH').length,
      exactLabelCandidates: rows.filter(item => item.status === 'EXACT_LABEL_CANDIDATE').length,
      ambiguous: rows.filter(item => item.status === 'AMBIGUOUS').length,
      unmatched: rows.filter(item => item.status === 'UNMATCHED').length,
      nodesWithAnyCandidate: rows.filter(item => item.candidateCount > 0).length
    };
  });

  return {
    reportVersion: '1.0.0',
    test: 'Samantha SDK-to-SDK Data Catalog Crosswalk',
    status: 'PASSED',
    sdkPackage: 'thetowersdk',
    sdkVersion,
    retrievedAt,
    sourceGameVersion: staging.source?.sdkGameVersion ?? null,
    scope: {
      graphNodeCount: graph.nodes.length,
      catalogCount: catalogs.length,
      catalogRecordCounts: catalogs.map(catalog => ({ domain: catalog.domain, recordCount: catalog.recordCount }))
    },
    summary: {
      domainSummary,
      nodeCountWithAtLeastOneCandidate: records.filter(record => record.domainCandidates.some(item => item.candidateCount > 0)).length,
      mappingApprovedCount: 0
    },
    records,
    policy: {
      comparison: 'Exact source ID and exact label equality only.',
      fuzzyMatching: false,
      normalization: false,
      generatedIdentifiers: false,
      candidatePromotion: false,
      canonicalClaimsCreated: false,
      canonicalIdsCreated: false,
      canonicalImportPerformed: false,
      sourceDataModified: false
    },
    limitations: [
      'This report links records inside one SDK package only; it is not a Samantha canonical mapping.',
      'Exact label equality is a candidate, not proof of semantic identity.',
      'SDK source identifiers remain scoped to their source catalog and package version.',
      'Perks has no separate ID field in the observed export; the perk text is compared as a label only.',
      'Unmatched graph nodes may be represented in other SDK exports or Samantha documents not included in this crosswalk.',
      'All SDK records remain EXTERNAL-UNVERIFIED.'
    ]
  };
}

async function main() {
  const pkg = JSON.parse(await readFile(path.join(RUNTIME, 'node_modules/thetowersdk/package.json'), 'utf8'));
  if (pkg.version !== '0.14.1') throw new Error(`Expected thetowersdk@0.14.1, got ${pkg.version}`);
  const graph = require('thetowersdk/knowledge-graph.json');
  const staging = JSON.parse(await readFile(path.join(ROOT, 'staging/sdk-domain-catalogs.json'), 'utf8'));
  const report = buildSdkDataCatalogCrosswalk({
    graph, staging, sdkVersion: pkg.version, retrievedAt: new Date().toISOString().slice(0, 10)
  });
  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({ ...report, records: undefined }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(JSON.stringify({ test: 'Samantha SDK-to-SDK Data Catalog Crosswalk', status: 'FAILED', error: error.message }, null, 2));
    process.exitCode = 1;
  });
}

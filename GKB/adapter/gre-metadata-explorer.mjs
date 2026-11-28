import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const norm = value => String(value ?? '').normalize('NFKC')
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ').trim();
const readJsonl = file => fs.readFileSync(file, 'utf8')
  .split(/\r?\n/).filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); }
    catch (error) { throw new Error('Invalid JSONL at ' + file + ':' + (index + 1) + ': ' + error.message); }
  });
const unique = values => [...new Set(values)];

export function loadGreExplorerData(directory) {
  const readOptional = name => {
    const file = path.join(directory, name);
    return fs.existsSync(file) ? readJsonl(file) : [];
  };
  const types = readJsonl(path.join(directory, 'gre-types.jsonl'));
  const methods = readJsonl(path.join(directory, 'gre-methods.jsonl'));
  const memberships = readJsonl(path.join(directory, 'gre-domain-memberships.jsonl'));
  const claimLinks = readOptional('gre-claim-method-links.jsonl');
  const domainsByType = new Map();
  for (const item of memberships) {
    const list = domainsByType.get(item.typeIndex) ?? [];
    list.push(item.domain);
    domainsByType.set(item.typeIndex, list);
  }
  const methodsByType = new Map();
  for (const method of methods) {
    const index = method.ownerType?.index;
    const list = methodsByType.get(index) ?? [];
    list.push(method);
    methodsByType.set(index, list);
  }
  const linksByClaim = new Map();
  for (const link of claimLinks) {
    const list = linksByClaim.get(link.claimId) ?? [];
    list.push(link);
    linksByClaim.set(link.claimId, list);
  }
  return {
    types, methods, memberships, claimLinks,
    domainsByType, methodsByType, linksByClaim,
    sourceCommit: methods[0]?.commit ?? types[0]?.commit ?? null
  };
}

const limitRows = (rows, limit = 100) => rows.slice(0, Math.max(1, Math.min(500, Number(limit) || 100)));
const typeView = (data, type) => ({
  typeIndex: type.index, typeName: type.name, namespace: type.namespace ?? null,
  typeToken: type.token ?? null, typeOffset: type.offset ?? null,
  domains: unique(data.domainsByType.get(type.index) ?? []).sort(),
  methodCount: (data.methodsByType.get(type.index) ?? []).length,
  fieldCount: type.fields?.length ?? null,
  propertyCount: type.properties?.length ?? null,
  sourceCommit: type.commit ?? data.sourceCommit,
  verificationStatus: type.verificationStatus ?? 'EXTERNAL-UNVERIFIED'
});
const methodView = (data, method) => ({
  methodIndex: method.index, methodName: method.name, methodToken: method.token,
  methodOffset: method.offset, ownerTypeIndex: method.ownerType?.index ?? null,
  ownerTypeName: method.ownerType?.name ?? null, ownerNamespace: method.ownerType?.namespace ?? null,
  domains: unique(data.domainsByType.get(method.ownerType?.index) ?? []).sort(),
  parameters: method.parameters ?? [], returnType: method.returnType ?? null,
  sourceFile: method.sourceFile ?? null, sourceCommit: method.commit ?? data.sourceCommit,
  evidenceClass: method.evidenceClass ?? 'DIRECT_METADATA_DECLARATION',
  verificationStatus: method.verificationStatus ?? 'EXTERNAL-UNVERIFIED'
});
const envelope = (data, result) => ({
  format: 'SAMANTHA_GRE_METADATA_EXPLORER_RESULT',
  formatVersion: 1,
  sourceCommit: data.sourceCommit,
  evidenceBoundary: 'Structural declaration and navigation data only; not proof of runtime execution or game mechanics.',
  result
});

export function listGreDomains(data) {
  const names = unique(data.memberships.map(item => item.domain)).sort();
  return names.map(domain => {
    const typeIndices = unique(data.memberships.filter(item => item.domain === domain).map(item => item.typeIndex));
    const methodCount = data.methods.filter(method => typeIndices.includes(method.ownerType?.index)).length;
    return { domain, typeCount: typeIndices.length, methodCount };
  });
}

export function listGreTypes(data, { domain = '', query = '', limit = 100 } = {}) {
  const q = norm(query), d = norm(domain);
  const rows = data.types.filter(type => {
    const domains = data.domainsByType.get(type.index) ?? [];
    const domainMatch = !d || domains.some(value => norm(value).includes(d));
    const queryMatch = !q || norm([type.name, type.namespace, type.token, type.index].join(' ')).includes(q);
    return domainMatch && queryMatch;
  }).map(type => typeView(data, type));
  return limitRows(rows, limit);
}

export function getGreType(data, selector) {
  const value = String(selector ?? '');
  const matches = data.types.filter(type =>
    String(type.index) === value || norm(type.name) === norm(value)
  );
  if (!matches.length) return { found: false, selector: value };
  if (matches.length > 1) return { found: false, ambiguous: true, selector: value, candidates: matches.map(type => typeView(data, type)) };
  const type = matches[0];
  return {
    found: true,
    type: typeView(data, type),
    methods: (data.methodsByType.get(type.index) ?? []).map(method => methodView(data, method))
  };
}

export function getGreMethod(data, selector) {
  const value = String(selector ?? '');
  const lower = value.toLowerCase();
  let matches = data.methods.filter(method =>
    String(method.index) === value || String(method.token ?? '').toLowerCase() === lower
  );
  if (!matches.length) matches = data.methods.filter(method => norm(method.name) === norm(value));
  if (!matches.length) return { found: false, selector: value };
  if (matches.length > 1) return { found: false, ambiguous: true, selector: value, candidates: matches.map(method => methodView(data, method)) };
  return { found: true, method: methodView(data, matches[0]) };
}

export function getGreClaim(data, claimId) {
  const links = data.linksByClaim.get(String(claimId)) ?? [];
  return {
    found: links.length > 0,
    claimId: String(claimId),
    references: links.map(link => ({
      ...link,
      navigationOnly: true,
      note: 'This reference does not establish execution or mechanic behavior.'
    }))
  };
}

export function searchGreMetadata(data, { query = '', domain = '', limit = 100 } = {}) {
  const q = norm(query), d = norm(domain);
  if (!q) return { methods: [], types: [], message: 'A non-empty query is required.' };
  const methods = data.methods.filter(method => {
    const domains = data.domainsByType.get(method.ownerType?.index) ?? [];
    const text = norm([
      method.name, method.index, method.token, method.offset,
      method.ownerType?.name, method.ownerType?.namespace,
      ...(method.parameters ?? []).map(parameter => parameter.name)
    ].join(' '));
    return text.includes(q) && (!d || domains.some(value => norm(value).includes(d)));
  }).map(method => methodView(data, method));
  const types = data.types.filter(type => {
    const domains = data.domainsByType.get(type.index) ?? [];
    const text = norm([type.name, type.index, type.token, type.namespace].join(' '));
    return text.includes(q) && (!d || domains.some(value => norm(value).includes(d)));
  }).map(type => typeView(data, type));
  return { methods: limitRows(methods, limit), types: limitRows(types, limit) };
}

function main() {
  const [command, directory, selector, domain] = process.argv.slice(2);
  if (!directory) throw new Error('Artifact directory is required.');
  const data = loadGreExplorerData(directory);
  let result;
  switch (command) {
    case 'domains': result = listGreDomains(data); break;
    case 'types': result = listGreTypes(data, { domain: selector ?? '', query: domain ?? '' }); break;
    case 'type': result = getGreType(data, selector); break;
    case 'method': result = getGreMethod(data, selector); break;
    case 'claim': result = getGreClaim(data, selector); break;
    case 'search': result = searchGreMetadata(data, { query: selector ?? '', domain: domain ?? '' }); break;
    default: throw new Error('Commands: domains | types [domain] [query] | type <index-or-name> | method <index-token-or-name> | claim <claim-id> | search <query> [domain]');
  }
  console.log(JSON.stringify(envelope(data, result), null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); }
  catch (error) { console.error(JSON.stringify({ status: 'FAILED', error: error.message }, null, 2)); process.exitCode = 1; }
}